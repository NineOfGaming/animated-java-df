import {
	TextComponent,
	UnicodeString,
	type ShadowColor,
	type TextComponentStyle,
	type TextElement,
	type TextObject,
} from 'book-and-quill'

const NAMED_COLOR_HEXES = {
	black: '#000000',
	dark_blue: '#0000aa',
	dark_green: '#00aa00',
	dark_aqua: '#00aaaa',
	dark_red: '#aa0000',
	dark_purple: '#aa00aa',
	gold: '#ffaa00',
	gray: '#aaaaaa',
	dark_gray: '#555555',
	blue: '#5555ff',
	green: '#55ff55',
	aqua: '#55ffff',
	red: '#ff5555',
	light_purple: '#ff55ff',
	yellow: '#ffff55',
	white: '#ffffff',
} as const

const NAMED_COLORS = new Set(Object.keys(NAMED_COLOR_HEXES))

const COLOR_ALIASES: Record<string, string> = {
	grey: 'gray',
	dark_grey: 'dark_gray',
}

const DECORATION_ALIASES = {
	bold: 'bold',
	b: 'bold',
	italic: 'italic',
	em: 'italic',
	i: 'italic',
	underlined: 'underlined',
	u: 'underlined',
	strikethrough: 'strikethrough',
	st: 'strikethrough',
	obfuscated: 'obfuscated',
	obf: 'obfuscated',
} as const

const SHORT_DECORATION_NAMES: Record<keyof typeof DECORATION_ALIASES, string> = {
	bold: 'b',
	b: 'b',
	italic: 'i',
	em: 'i',
	i: 'i',
	underlined: 'u',
	u: 'u',
	strikethrough: 'st',
	st: 'st',
	obfuscated: 'obf',
	obf: 'obf',
}

const DECORATION_KEYS = ['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated'] as const

const NON_VISUAL_PAIRED_TAGS = new Set([
	'click',
	'hover',
	'insertion',
	'insert',
	'gradient',
	'rainbow',
	'transition',
	'pride',
])

type Decoration = (typeof DECORATION_KEYS)[number]

interface ParsedTag {
	args: string[]
	closing: boolean
	end: number
	name: string
	raw: string
	selfClosing: boolean
}

interface OpenStyleTag {
	matchName: string
	previousStyle: TextComponentStyle
}

export class MiniMessageParseError extends Error {
	readonly index: number

	constructor(message: string, input: string, index: number) {
		const pointer = `${' '.repeat(Math.max(0, index))}^`
		super(`${message} at character ${index + 1}.\n${input}\n${pointer}`)
		this.name = 'MiniMessageParseError'
		this.index = index
	}
}

function escapeMiniMessageText(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/</g, '\\<')
}

function resolveJsonTextString(value: string): string {
	return new UnicodeString(value).toString()
}

function quoteMiniMessageArgument(value: string): string {
	return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function styleValuesEqual(a: unknown, b: unknown): boolean {
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((value, index) => value === b[index])
	}
	return a === b
}

function stylesEqual(a: TextComponentStyle, b: TextComponentStyle): boolean {
	return (
		a.color === b.color &&
		a.font === b.font &&
		styleValuesEqual(a.shadow_color, b.shadow_color) &&
		DECORATION_KEYS.every(key => (a[key] ?? false) === (b[key] ?? false))
	)
}

function channelToHex(value: number): string {
	return Math.round(Math.max(0, Math.min(1, value)) * 255)
		.toString(16)
		.padStart(2, '0')
}

function alphaByteToFloatString(alpha: number): string {
	if (alpha === 0) return '0'
	if (alpha === 255) return '1'

	const exact = alpha / 255
	for (let precision = 1; precision <= 4; precision++) {
		const candidate = Number(exact.toFixed(precision)).toString()
		if (Math.round(Number(candidate) * 255) === alpha) return candidate
	}
	return Number(exact.toFixed(6)).toString()
}

function compactShadowColor(red: number, green: number, blue: number, alpha: number) {
	const hex = `#${red.toString(16).padStart(2, '0')}${green
		.toString(16)
		.padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
	const hexWithAlpha = `${hex}${alpha.toString(16).padStart(2, '0')}`
	const namedColor = Object.entries(NAMED_COLOR_HEXES).find(([, value]) => value === hex)?.[0]
	const candidates = [hexWithAlpha]

	if (alpha === 64) candidates.push(hex)
	if (namedColor) {
		candidates.push(
			alpha === 64 ? namedColor : `${namedColor}:${alphaByteToFloatString(alpha)}`
		)
	}

	return candidates.reduce((shortest, candidate) =>
		candidate.length < shortest.length ? candidate : shortest
	)
}

function shadowColorToMiniMessage(color: ShadowColor): string {
	let red: number
	let green: number
	let blue: number
	let alpha: number

	if (Array.isArray(color)) {
		const [redChannel, greenChannel, blueChannel, alphaChannel = 1] = color
		red = parseInt(channelToHex(redChannel), 16)
		green = parseInt(channelToHex(greenChannel), 16)
		blue = parseInt(channelToHex(blueChannel), 16)
		alpha = parseInt(channelToHex(alphaChannel), 16)
	} else if (typeof color === 'number') {
		const unsigned = color >>> 0
		alpha = (unsigned >>> 24) & 0xff
		red = (unsigned >>> 16) & 0xff
		green = (unsigned >>> 8) & 0xff
		blue = unsigned & 0xff
	} else {
		const [redChannel, greenChannel, blueChannel, alphaChannel] = parseShadowColor(color)
		red = parseInt(channelToHex(redChannel), 16)
		green = parseInt(channelToHex(greenChannel), 16)
		blue = parseInt(channelToHex(blueChannel), 16)
		alpha = parseInt(channelToHex(alphaChannel), 16)
	}

	if (alpha === 0) return '!shadow'
	return compactShadowColor(red, green, blue, alpha)
}

function parseShadowAlpha(value: string | undefined): number {
	if (value === undefined) return 0.25
	const normalized = value.trim()
	if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) {
		throw new Error(`Invalid shadow alpha '${value}'`)
	}
	const alpha = Number(normalized)
	if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
		throw new Error(`Shadow alpha must be between 0 and 1, got '${value}'`)
	}
	return alpha
}

function parseShadowColor(value: string, alphaValue?: string): [number, number, number, number] {
	const normalized = COLOR_ALIASES[value.toLowerCase()] ?? value.toLowerCase()
	const namedColor = NAMED_COLOR_HEXES[normalized as keyof typeof NAMED_COLOR_HEXES]
	const hex = namedColor ?? normalized
	if (/^#[\da-f]{6}$/i.test(hex)) {
		const alpha = parseShadowAlpha(alphaValue)
		return [
			parseInt(hex.slice(1, 3), 16) / 255,
			parseInt(hex.slice(3, 5), 16) / 255,
			parseInt(hex.slice(5, 7), 16) / 255,
			alpha,
		]
	}
	if (!/^#[\da-f]{8}$/i.test(hex)) throw new Error(`Invalid shadow color '${value}'`)

	// MiniMessage ignores the separate alpha argument when the hex color already
	// contains an alpha channel.
	return [
		parseInt(hex.slice(1, 3), 16) / 255,
		parseInt(hex.slice(3, 5), 16) / 255,
		parseInt(hex.slice(5, 7), 16) / 255,
		parseInt(hex.slice(7, 9), 16) / 255,
	]
}

function splitTagParts(value: string, input: string, index: number): string[] {
	const parts: string[] = []
	let current = ''
	let quote: string | undefined

	for (let i = 0; i < value.length; i++) {
		const char = value[i]
		if (quote) {
			if (char === '\\' && i + 1 < value.length) {
				current += value[++i]
			} else if (char === quote) {
				quote = undefined
			} else {
				current += char
			}
			continue
		}

		if (char === "'" || char === '"') {
			quote = char
		} else if (char === ':') {
			parts.push(current)
			current = ''
		} else {
			current += char
		}
	}

	if (quote) {
		throw new MiniMessageParseError('Unclosed quoted tag argument', input, index)
	}
	parts.push(current)
	return parts
}

function readTag(input: string, start: number): ParsedTag | undefined {
	let quote: string | undefined
	let escaped = false
	let end = start + 1

	for (; end < input.length; end++) {
		const char = input[end]
		if (escaped) {
			escaped = false
			continue
		}
		if (quote && char === '\\') {
			escaped = true
			continue
		}
		if (char === "'" || char === '"') {
			if (!quote) quote = char
			else if (quote === char) quote = undefined
			continue
		}
		if (char === '>' && !quote) break
	}

	if (end >= input.length || quote) return

	const raw = input.slice(start, end + 1)
	let content = input.slice(start + 1, end).trim()
	const closing = content.startsWith('/')
	if (closing) content = content.slice(1).trim()
	const selfClosing = content.endsWith('/')
	if (selfClosing) content = content.slice(0, -1).trim()
	if (!content) return

	const [name, ...args] = splitTagParts(content, input, start)
	return {
		args,
		closing,
		end,
		name: name.toLowerCase(),
		raw,
		selfClosing,
	}
}

function normalizeColor(value: string): string | undefined {
	const normalized = COLOR_ALIASES[value.toLowerCase()] ?? value.toLowerCase()
	if (NAMED_COLORS.has(normalized)) return normalized
	if (/^#[\da-f]{6}$/i.test(normalized)) return normalized.toLowerCase()
}

function appendText(components: TextObject[], text: string, style: TextComponentStyle): void {
	if (!text) return
	const previous = components.at(-1)
	if (previous?.text !== undefined && stylesEqual(previous, style)) {
		previous.text += text
		return
	}
	components.push({ ...style, text })
}

function appendComponent(
	components: TextObject[],
	component: TextObject,
	style: TextComponentStyle
): void {
	components.push({ ...style, ...component })
}

function normalizeStyleTagName(name: string): string {
	if (name in DECORATION_ALIASES) {
		return DECORATION_ALIASES[name as keyof typeof DECORATION_ALIASES]
	}
	if (name === 'color' || name === 'colour' || name === 'c') return 'color'
	if (normalizeColor(name)) return name
	return name
}

function isStyleTagName(name: string): boolean {
	return (
		name in DECORATION_ALIASES ||
		name === 'color' ||
		name === 'colour' ||
		name === 'c' ||
		name === 'font' ||
		name === 'shadow' ||
		normalizeColor(name) !== undefined
	)
}

function parseBooleanArgument(value: string | undefined, defaultValue = true): boolean {
	if (value === undefined) return defaultValue
	return value.toLowerCase() !== 'false'
}

/** Parses the visual subset of MiniMessage used by DiamondFire text displays. */
export function miniMessageToTextComponent(input: string): TextComponent {
	const components: TextObject[] = []
	const openStyleTags: OpenStyleTag[] = []
	const defaultStyle = { ...TextComponent.defaultStyle }
	let style = { ...defaultStyle }
	let plainText = ''

	const flushText = () => {
		appendText(components, plainText, style)
		plainText = ''
	}

	const openStyle = (matchName: string, nextStyle: TextComponentStyle) => {
		flushText()
		openStyleTags.push({ matchName, previousStyle: style })
		style = nextStyle
	}

	const closeStyle = (matchName: string): boolean => {
		flushText()
		let index = openStyleTags.findLastIndex(tag => tag.matchName === matchName)
		if (index === -1 && matchName === 'color') {
			index = openStyleTags.findLastIndex(tag => tag.matchName === 'color')
		}
		if (index === -1) return false
		style = openStyleTags[index].previousStyle
		openStyleTags.splice(index)
		return true
	}

	for (let i = 0; i < input.length; i++) {
		const char = input[i]
		if (char === '\\' && (input[i + 1] === '<' || input[i + 1] === '\\')) {
			plainText += input[++i]
			continue
		}
		if (char !== '<') {
			plainText += char
			continue
		}

		const tag = readTag(input, i)
		if (!tag) {
			plainText += char
			continue
		}

		let name = tag.name
		const inverted = name.startsWith('!')
		if (inverted) name = name.slice(1)
		const normalizedName = normalizeStyleTagName(name)
		const shorthandColor = normalizeColor(name)
		let handled = true

		if (tag.closing && isStyleTagName(name)) {
			handled = closeStyle(normalizedName)
		} else if (tag.closing && NON_VISUAL_PAIRED_TAGS.has(name)) {
			// These tags do not affect the text display preview.
		} else if (tag.closing) {
			handled = false
		} else if (shorthandColor) {
			openStyle(normalizedName, { ...style, color: shorthandColor })
		} else if (name === 'color' || name === 'colour' || name === 'c') {
			const color = normalizeColor(tag.args[0] ?? '')
			if (!color) {
				throw new MiniMessageParseError('Invalid or missing color', input, i)
			}
			openStyle('color', { ...style, color })
		} else if (name in DECORATION_ALIASES) {
			const decoration = DECORATION_ALIASES[
				name as keyof typeof DECORATION_ALIASES
			] as Decoration
			openStyle(decoration, {
				...style,
				[decoration]: inverted ? false : parseBooleanArgument(tag.args[0]),
			})
		} else if (name === 'font') {
			const font = tag.args.join(':')
			if (!font) throw new MiniMessageParseError('Missing font name', input, i)
			openStyle('font', { ...style, font })
		} else if (name === 'shadow') {
			try {
				if (inverted && tag.args.length) {
					throw new Error(`The shadow disable tag does not accept arguments`)
				}
				if (!inverted && tag.args.length > 2) {
					throw new Error(`The shadow tag accepts at most a color and alpha`)
				}
				openStyle('shadow', {
					...style,
					shadow_color: inverted
						? [0, 0, 0, 0]
						: parseShadowColor(tag.args[0] ?? '', tag.args[1]),
				})
			} catch (error) {
				throw new MiniMessageParseError((error as Error).message, input, i)
			}
		} else if (name === 'reset') {
			flushText()
			style = { ...defaultStyle }
			openStyleTags.length = 0
		} else if (name === 'newline' || name === 'br') {
			plainText += '\n'
		} else if (name === 'key') {
			flushText()
			appendComponent(components, { keybind: tag.args.join(':') }, style)
		} else if (name === 'lang' || name === 'tr' || name === 'translate') {
			flushText()
			const [translate, ...values] = tag.args
			if (!translate) throw new MiniMessageParseError('Missing translation key', input, i)
			appendComponent(
				components,
				{
					translate,
					...(values.length
						? { with: values.map(value => miniMessageToTextComponent(value).toJSON()) }
						: {}),
				},
				style
			)
		} else if (name === 'lang_or' || name === 'tr_or' || name === 'translate_or') {
			flushText()
			const [translate, fallback, ...values] = tag.args
			if (!translate || fallback === undefined) {
				throw new MiniMessageParseError('Missing translation key or fallback', input, i)
			}
			appendComponent(
				components,
				{
					translate,
					fallback,
					...(values.length
						? { with: values.map(value => miniMessageToTextComponent(value).toJSON()) }
						: {}),
				},
				style
			)
		} else if (name === 'selector' || name === 'sel') {
			flushText()
			const [selector, separator] = tag.args
			if (!selector) throw new MiniMessageParseError('Missing selector', input, i)
			appendComponent(
				components,
				{
					selector,
					...(separator === undefined
						? {}
						: { separator: miniMessageToTextComponent(separator).toJSON() }),
				},
				style
			)
		} else if (name === 'score') {
			flushText()
			const [scoreName, objective] = tag.args
			if (!scoreName || !objective) {
				throw new MiniMessageParseError('Missing score name or objective', input, i)
			}
			appendComponent(components, { score: { name: scoreName, objective } }, style)
		} else if (name === 'nbt' || name === 'data') {
			flushText()
			const [source, sourceId, nbt, separatorOrInterpret, maybeInterpret] = tag.args
			if (!['block', 'entity', 'storage'].includes(source) || !sourceId || !nbt) {
				throw new MiniMessageParseError('Invalid NBT component', input, i)
			}
			const interpret = separatorOrInterpret === 'interpret' || maybeInterpret === 'interpret'
			const separator =
				separatorOrInterpret === 'interpret' ? undefined : separatorOrInterpret
			appendComponent(
				components,
				{
					nbt,
					[source]: sourceId,
					...(separator === undefined
						? {}
						: { separator: miniMessageToTextComponent(separator).toJSON() }),
					...(interpret ? { interpret: true } : {}),
				},
				style
			)
		} else if (
			name === 'click' ||
			name === 'hover' ||
			name === 'insertion' ||
			name === 'insert'
		) {
			// These events do not affect how a text display is rendered.
		} else if (
			name === 'gradient' ||
			name === 'rainbow' ||
			name === 'transition' ||
			name === 'pride'
		) {
			// Preserve readable preview text for procedural colors. Their exact colors
			// are resolved by DiamondFire's MiniMessage implementation at runtime.
		} else {
			handled = false
		}

		if (!handled) {
			plainText += tag.raw
		}
		i = tag.end
	}

	flushText()
	return new TextComponent({ text: '', extra: components })
}

/** Parses MiniMessage for editor preview, rendering invalid tags as literal text. */
export function miniMessageToPreviewTextComponent(input: string): TextComponent {
	let previewInput = input
	const maxAttempts = [...input].filter(character => character === '<').length

	for (let attempt = 0; attempt <= maxAttempts; attempt++) {
		try {
			return miniMessageToTextComponent(previewInput)
		} catch (error) {
			if (!(error instanceof MiniMessageParseError)) break

			let tagStart = error.index
			if (previewInput[tagStart] !== '<') {
				tagStart = previewInput.lastIndexOf('<', tagStart)
			}
			if (tagStart < 0 || previewInput[tagStart - 1] === '\\') break

			previewInput = `${previewInput.slice(0, tagStart)}\\${previewInput.slice(tagStart)}`
		}
	}

	return new TextComponent({ text: input })
}

function serializeSeparator(separator: TextElement | undefined, parentStyle: TextComponentStyle) {
	if (separator === undefined) return ''
	return `:${quoteMiniMessageArgument(textElementToMiniMessage(separator, parentStyle))}`
}

function serializeTextObjectContent(element: TextObject, style: TextComponentStyle): string {
	if (element.text !== undefined) {
		return escapeMiniMessageText(resolveJsonTextString(element.text))
	}

	if (element.translate !== undefined) {
		const tagName = element.fallback === undefined ? 'tr' : 'tr_or'
		const args = [quoteMiniMessageArgument(resolveJsonTextString(element.translate))]
		if (element.fallback !== undefined) {
			args.push(quoteMiniMessageArgument(resolveJsonTextString(element.fallback)))
		}
		for (const value of element.with ?? []) {
			args.push(quoteMiniMessageArgument(textElementToMiniMessage(value, style)))
		}
		return `<${tagName}:${args.join(':')}/>`
	}

	if (element.keybind !== undefined) {
		return `<key:${quoteMiniMessageArgument(resolveJsonTextString(element.keybind))}/>`
	}

	if (element.selector !== undefined) {
		return `<sel:${quoteMiniMessageArgument(
			resolveJsonTextString(element.selector)
		)}${serializeSeparator(element.separator, style)}/>`
	}

	if (element.score !== undefined) {
		return `<score:${quoteMiniMessageArgument(
			resolveJsonTextString(element.score.name)
		)}:${quoteMiniMessageArgument(resolveJsonTextString(element.score.objective))}/>`
	}

	if (element.nbt !== undefined) {
		const source = element.block
			? ['block', element.block]
			: element.entity
				? ['entity', element.entity]
				: element.storage
					? ['storage', element.storage]
					: undefined
		if (source) {
			const interpret = element.interpret ? ':interpret' : ''
			return `<nbt:${source[0]}:${quoteMiniMessageArgument(
				resolveJsonTextString(source[1])
			)}:${quoteMiniMessageArgument(resolveJsonTextString(element.nbt))}${serializeSeparator(
				element.separator,
				style
			)}${interpret}/>`
		}
	}

	if (element.sprite !== undefined) {
		return escapeMiniMessageText(`{sprite:${resolveJsonTextString(element.sprite)}}`)
	}
	if (element.player !== undefined) {
		return escapeMiniMessageText('{player}')
	}

	return ''
}

function getStyleTransition(
	from: TextComponentStyle,
	to: TextComponentStyle
): { output: string; style: TextComponentStyle } {
	let output = ''
	const next = { ...from }

	if ((to.color ?? 'white') !== (from.color ?? 'white')) {
		const color = to.color ?? 'white'
		output += `<${color}>`
		next.color = color
	}

	if ((to.font ?? 'minecraft:default') !== (from.font ?? 'minecraft:default')) {
		const font = to.font ?? 'default'
		output += `<font:${font}>`
		if (to.font === undefined) delete next.font
		else next.font = to.font
	}

	if (!styleValuesEqual(to.shadow_color, from.shadow_color)) {
		if (to.shadow_color === undefined) {
			output += '<!shadow>'
			delete next.shadow_color
		} else {
			const shadow = shadowColorToMiniMessage(to.shadow_color)
			output += shadow === '!shadow' ? '<!shadow>' : `<shadow:${shadow}>`
			next.shadow_color = to.shadow_color
		}
	}

	for (const decoration of DECORATION_KEYS) {
		const fromValue = from[decoration] ?? false
		const toValue = to[decoration] ?? false
		if (fromValue === toValue) continue
		const shortName = SHORT_DECORATION_NAMES[decoration]
		output += `<${toValue ? '' : '!'}${shortName}>`
		next[decoration] = toValue
	}

	return { output, style: next }
}

function flattenTextElement(
	element: TextElement,
	parentStyle: TextComponentStyle,
	output: Array<{ content: string; style: TextComponentStyle }>
): void {
	if (typeof element === 'string') {
		output.push({
			content: escapeMiniMessageText(resolveJsonTextString(element)),
			style: parentStyle,
		})
		return
	}

	const style = TextComponent.getComponentStyle(element, parentStyle)
	if (Array.isArray(element)) {
		for (const child of element) flattenTextElement(child, style, output)
		return
	}

	const content = serializeTextObjectContent(element, style)
	if (content) output.push({ content, style })
	for (const child of element.extra ?? []) flattenTextElement(child, style, output)
}

export function textElementToMiniMessage(
	element: TextElement,
	initialStyle: TextComponentStyle = TextComponent.defaultStyle
): string {
	const pieces: Array<{ content: string; style: TextComponentStyle }> = []
	flattenTextElement(element, initialStyle, pieces)

	let currentStyle = { ...initialStyle }
	let output = ''
	for (const piece of pieces) {
		const direct = getStyleTransition(currentStyle, piece.style)
		const afterReset = getStyleTransition(TextComponent.defaultStyle, piece.style)
		if (`<reset>${afterReset.output}`.length < direct.output.length) {
			output += `<reset>${afterReset.output}`
			currentStyle = afterReset.style
		} else {
			output += direct.output
			currentStyle = direct.style
		}
		output += piece.content
	}
	return output
}

/** Converts Animated Java SNBT/JSON text into compact, lenient MiniMessage. */
export function jsonTextToMiniMessage(
	rawText: string,
	minecraftVersion = TextComponent.defaultMinecraftVersion
): string {
	if (!rawText.trim()) return ''

	try {
		const component = TextComponent.fromString(rawText, { minecraftVersion }).toJSON()
		return textElementToMiniMessage(component)
	} catch {
		return escapeMiniMessageText(rawText)
	}
}

export function miniMessageToJsonText(
	miniMessage: string,
	minecraftVersion = TextComponent.defaultMinecraftVersion
): string {
	return miniMessageToTextComponent(miniMessage).toString(true, minecraftVersion)
}

export function compactMiniMessage(miniMessage: string): string {
	return textElementToMiniMessage(miniMessageToTextComponent(miniMessage).toJSON())
}
