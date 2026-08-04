import { registerProjectPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import { type Alignment, TextDisplay, type TextDisplayTextFormat } from '../../outliner/textDisplay'
import { textElementToMiniMessage } from '../../systems/df/minimessage'
import EVENTS from '../../util/events'
import { localize as translate } from '../../util/lang'
import TextDisplayElementPanel from './textDisplayElement.svelte'

let unmountCallback: (() => Promise<void>) | null = null
let currentUpdatePromise: Promise<void> | null = null

const updatePanel = () => {
	if (currentUpdatePromise) {
		return currentUpdatePromise.then(() => {
			void updatePanel()
		})
	}

	currentUpdatePromise = new Promise(async resolve => {
		await unmountCallback?.()

		const textDisplay = TextDisplay.selected.at(0)
		if (textDisplay) {
			unmountCallback = injectComponent({
				component: TextDisplayElementPanel,
				props: { selected: textDisplay },
				elementSelector() {
					return Panels.element.node
				},
				postMount() {
					currentUpdatePromise = null
					resolve()
				},
			})
		} else {
			currentUpdatePromise = null
			resolve()
		}
	})
}

registerProjectPatch({
	id: 'animated_java:append-element-panel/text-display',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const unsubscribers = [EVENTS.UPDATE_SELECTION.subscribe(updatePanel)]
		return { unsubscribers }
	},

	revert: async ({ unsubscribers }) => {
		unsubscribers.forEach(u => u())
		await unmountCallback?.()
		unmountCallback = null
	},
})

// @ts-expect-error - Broken BB types
type Grammar = ReturnType<typeof Prism.languages.extend>
type GrammarValue = NonNullable<Grammar['property']>

function addPrismSyntaxForSnbtTextComponents() {
	const quotes: GrammarValue = {
		pattern: /^['"]|['"]$/,
		alias: 'quotation',
	}

	// @ts-expect-error - Broken BB types
	Prism.languages.snbtTextComponent = Prism.languages.extend('json', {
		punctuation: /[,:]/,
		brackets: {
			pattern: /[{}[\]]/g,
		},
		property: [
			{
				pattern: /('|")?\w+\1\s*(?=\s*:)/,
				inside: {
					punctuation: quotes,
				},
			},
		],
		string: [
			{
				pattern: /("|')(?:\\(?:\r\n?|\n|.)|(?!\1)[^\\\r\n])*\1/,
				greedy: true,
				inside: {
					punctuation: quotes,
					'named-unicode-escape-sequence': {
						pattern: /\\N\{ *[\w ]+ *\}/,
						alias: 'escape-sequence',
						inside: {
							constant: {
								pattern: /(\\N\{ *)[\w ]+?(?= *\})/,
								lookbehind: true,
							},
						},
					},
					'unicode-escape-sequence': {
						pattern: /\\(?:x[\da-fA-F]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8})/,
						alias: 'escape-sequence',
						inside: {
							constant: { pattern: /(?:[\da-fA-F]+)/ },
						},
					},
					'escape-sequence': {
						pattern: /\\(?:n|s|t|b|f|r|'|"|\\)/,
					},
				},
			},
			{
				pattern: /([:,]\s*)\b(?!true|false)\w+\b/i,
				inside: { punctuation: quotes },
				lookbehind: true,
			},
		],
		boolean: {
			pattern: /\b(?:true|false|0b|1b)\b/i,
		},
		number: /(?:(?:#|0x)[\dA-Fa-f_]{1,8}\b|[-]?(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.[\d_]+)(?:[eE][+-]?[\d_]+\b)?)/,
	})
}

addPrismSyntaxForSnbtTextComponents()

function addPrismSyntaxForMiniMessage() {
	Prism.languages.miniMessage = {
		'escape-sequence': /\\[\\<]/,
		tag: {
			pattern: /<\/?(?:\\.|[^<>])+?>/,
			greedy: true,
			inside: {
				punctuation: /^<\/?|\/?>$/,
				keyword: {
					pattern: /(^<\/?)[^:/>]+/,
					lookbehind: true,
				},
				string: /([:'"])(?:\\.|(?!\1).)*\1/,
				operator: /:/,
			},
		},
	}
}

addPrismSyntaxForMiniMessage()

const TEXT_DISPLAY_CONDITION = () =>
	activeProjectIsBlueprintFormat() && !!TextDisplay.selected.length

export const TEXT_DISPLAY_WIDTH_SLIDER = new NumSlider(
	`animated_java:text-display-line-width-slider`,
	{
		name: translate('tool.text_display.line_width.title'),
		icon: 'format_size',
		description: translate('tool.text_display.line_width.description'),
		settings: {
			min: 1,
			max: 10000,
			interval: 1,
		},
		condition: TEXT_DISPLAY_CONDITION,
		get() {
			const selected = TextDisplay.selected.at(0)
			if (!selected) return TextDisplay.properties.lineWidth.default as number
			return selected.lineWidth
		},
		change(value) {
			if (!Project) return
			const selected = TextDisplay.selected.at(0)
			if (!selected) return
			const newLineWidth = Math.clamp(value(selected.lineWidth), 1, 10000)
			if (selected.lineWidth === newLineWidth) return
			selected.lineWidth = newLineWidth
			selected.updateTextMesh()
			Project.saved = false
		},
	}
)

export const TEXT_DISPLAY_BACKGROUND_COLOR_PICKER = new ColorPicker(
	`animated_java:text-display-background-color-picker`,
	{
		name: translate('tool.text_display.background_color.title'),
		icon: 'format_color_fill',
		description: translate('tool.text_display.background_color.description'),
		condition: TEXT_DISPLAY_CONDITION,
	}
)
// @ts-expect-error - Broken BB types
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.jq.spectrum(
	'option',
	'defaultColor',
	TextDisplay.properties.backgroundColor.default
)
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.get = function () {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return tinycolor(TextDisplay.properties.backgroundColor.default)
	return tinycolor(selected.backgroundColor)
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set = function (this: ColorPicker, color: tinycolor.Instance) {
	this.value = color
	// @ts-expect-error - Broken BB types
	this.jq.spectrum('set', color.toHex8String())

	const selected = TextDisplay.selected.at(0)
	if (!selected) return this

	const value = color.toHex8String()
	if (selected.backgroundColor === value) return this

	selected.backgroundColor = color.toHex8String()
	selected.updateTextMesh()
	Project!.saved = false
	return this
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.change = function (
	this: ColorPicker,
	color: InstanceType<typeof tinycolor>
) {
	if (!Project) return this
	const selected = TextDisplay.selected.at(0)
	if (!selected) return this

	const newBackground = color.toHex8String()

	if (selected.backgroundColor === newBackground) return this

	selected.backgroundColor = newBackground
	selected.updateTextMesh()
	Project!.saved = false
	return this
}

export const TEXT_DISPLAY_SHADOW_TOGGLE = new Toggle(`animated_java:text-display-shadow-toggle`, {
	name: translate('tool.text_display.text_shadow.title'),
	icon: 'check_box_outline_blank',
	description: translate('tool.text_display.text_shadow.description'),
	condition: TEXT_DISPLAY_CONDITION,
	default: TextDisplay.properties.shadow.default as boolean,
	onChange() {
		if (!Project) return
		const scope = TEXT_DISPLAY_SHADOW_TOGGLE
		scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
		const selected = TextDisplay.selected.at(0)
		if (!selected) return
		if (selected.shadow === TEXT_DISPLAY_SHADOW_TOGGLE.value) return
		selected.shadow = TEXT_DISPLAY_SHADOW_TOGGLE.value
		selected.updateTextMesh()
		Project!.saved = false
	},
})
TEXT_DISPLAY_SHADOW_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click?.()
	return this
}

export const TEXT_DISPLAY_ALIGNMENT_SELECT = new BarSelect(
	`animated_java:text-display-alignment-select`,
	{
		name: translate('tool.text_display.text_alignment.title'),
		icon: 'format_align_left',
		description: translate('tool.text_display.text_alignment.description'),
		condition: TEXT_DISPLAY_CONDITION,
		options: {
			left: translate('tool.text_display.text_alignment.options.left'),
			center: translate('tool.text_display.text_alignment.options.center'),
			right: translate('tool.text_display.text_alignment.options.right'),
		},
	}
)
TEXT_DISPLAY_ALIGNMENT_SELECT.get = function () {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return TextDisplay.properties.align.default as Alignment
	return selected.align
}
TEXT_DISPLAY_ALIGNMENT_SELECT.set = function (this: BarSelect, value: Alignment) {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return this
	updateBarSelectLabel(this, value)

	if (selected.align === value) return this

	selected.align = value
	selected.updateTextMesh()
	Project!.saved = false
	return this
}

function updateBarSelectLabel(select: BarSelect, value: string) {
	select.value = value
	const name = select.getNameFor(value)
	const updateNode = (node: HTMLElement) => {
		const label = node.matches('.bb-select, bb-select')
			? node
			: node.querySelector<HTMLElement>('.bb-select, bb-select')
		if (label) label.textContent = name
	}
	select.nodes.forEach(updateNode)
	if (!select.nodes.includes(select.node)) {
		updateNode(select.node)
	}
}

export const TEXT_DISPLAY_FORMAT_SELECT = new BarSelect(
	`animated_java:text-display-format-select`,
	{
		name: translate('tool.text_display.text_format.title'),
		icon: 'code',
		description: translate('tool.text_display.text_format.description'),
		condition: TEXT_DISPLAY_CONDITION,
		options: {
			minimessage: translate('tool.text_display.text_format.options.minimessage'),
			json: translate('tool.text_display.text_format.options.json'),
		},
	}
)
TEXT_DISPLAY_FORMAT_SELECT.get = function () {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return TextDisplay.properties.textFormat.default as TextDisplayTextFormat
	return selected.textFormat
}
TEXT_DISPLAY_FORMAT_SELECT.set = function (this: BarSelect, value: TextDisplayTextFormat) {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return this

	const previousFormat = selected.textFormat
	updateBarSelectLabel(this, value)
	if (previousFormat === value) return this
	if (!Project) {
		updateBarSelectLabel(this, previousFormat)
		return this
	}

	let convertedText: string
	try {
		const component = selected.getTextComponent(Project.animated_java.target_minecraft_version)
		convertedText =
			value === 'minimessage'
				? textElementToMiniMessage(component.toJSON())
				: component.toString(true, Project.animated_java.target_minecraft_version)
	} catch (error) {
		console.error(error)
		updateBarSelectLabel(this, previousFormat)
		Blockbench.showQuickMessage(translate('tool.text_display.text_format.failed'), 2000)
		return this
	}

	Undo.initEdit({ elements: [selected] })
	selected.textFormat = value
	selected.text = convertedText
	selected.updateTextMesh()
	Project.saved = false
	Undo.finishEdit(`Change Text Display Text Format`, { elements: [selected] })

	requestAnimationFrame(() => {
		void updatePanel()
	})
	return this
}

export const TEXT_DISPLAY_SEE_THROUGH_TOGGLE = new Toggle(
	`animated_java:text-display-see-through-toggle`,
	{
		name: translate('tool.text_display.see_through.title'),
		icon: 'check_box_outline_blank',
		description: translate('tool.text_display.see_through.description'),
		condition: TEXT_DISPLAY_CONDITION,
		onChange() {
			if (!Project) return
			const scope = TEXT_DISPLAY_SEE_THROUGH_TOGGLE
			scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
			const selected = TextDisplay.selected.at(0)
			if (!selected) return
			if (selected.seeThrough === TEXT_DISPLAY_SEE_THROUGH_TOGGLE.value) return
			selected.seeThrough = TEXT_DISPLAY_SEE_THROUGH_TOGGLE.value
			selected.updateTextMesh()
			Project!.saved = false
		},
	}
)
TEXT_DISPLAY_SEE_THROUGH_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click?.()
	return this
}

export const TEXT_DISPLAY_COPY_TEXT_ACTION = new Action(
	`animated_java:text-display-copy-text-action`,
	{
		name: translate('tool.text_display.copy_text.title'),
		icon: 'content_copy',
		description: translate('tool.text_display.copy_text.description'),
		condition: TEXT_DISPLAY_CONDITION,
		click: () => {
			if (!Project) return
			const selected = TextDisplay.selected.at(0)
			if (!selected) return

			const clipboard = requireNativeModule('clipboard', {
				message: translate('tool.text_display.copy_text.clipboard_module_access_request'),
			})

			if (!clipboard) {
				Blockbench.showQuickMessage(
					translate('tool.text_display.copy_text.clipboard_module_access_denied'),
					2000
				)
				return
			}

			try {
				const text = selected
					.getTextComponent(Project.animated_java.target_minecraft_version)
					.toString(true, Project.animated_java.target_minecraft_version)
				clipboard.writeText(text)
				Blockbench.showQuickMessage(translate('tool.text_display.copy_text.copied'), 2000)
			} catch (e) {
				console.error(e)
				Blockbench.showQuickMessage(translate('tool.text_display.copy_text.failed'), 2000)
			}
		},
	}
)
