import { IRenderedAnimation } from '../animationRenderer'
import type { IBlueprintDisplayEntityConfigJSON } from '../../formats/blueprint'
import { DisplayEntityConfig } from '../../nodeConfigs'
import type { AnyRenderedNode, IRenderedRig, IRenderedVariantModel } from '../rigRenderer'
import { CodeClientError, sendTemplatesToCodeClient } from './codeclient'
import { textToGZip } from './compression'
import { compressMatrix, rotateMatrix } from './dfdata'
import type { CodeBlock, CodeTemplate } from './types'

export class DFExportError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message)
		this.name = 'DFExportError'
	}
}

interface Node {
	name: string
	type: AnyRenderedNode['type']
	data?: Record<string, unknown>
}

interface DFTemplateData {
	model_name: string
	item_material: string
	nodes: Record<string, Node>
}

type RawAnimationData = Record<
	string,
	{
		length: number
		nodes: Record<string, string>
	}
>

type SupportedDFNodeType = 'bone' | 'text_display' | 'item_display' | 'block_display'

const DF_EXPORTED_NODE_TYPES: ReadonlySet<AnyRenderedNode['type']> = new Set([
	'text_display',
	'item_display',
	'block_display',
])

const DF_HYPERCUBE_TYPE_BY_NODE_TYPE: Record<SupportedDFNodeType, string> = {
	bone: 'model',
	text_display: 'text',
	item_display: 'item',
	block_display: 'block',
}

const DF_ANIMATION_NAME_PREFIX = 'animation.model.'

function ensureNamespacedId(id: string): string {
	const trimmed = id.trim()
	if (!trimmed) return 'minecraft:stone'
	return trimmed.includes(':') ? trimmed : `minecraft:${trimmed}`
}

function toDFAnimationName(animationName: string): string {
	const trimmed = animationName.trim()
	const withoutPrefix = trimmed.startsWith(DF_ANIMATION_NAME_PREFIX)
		? trimmed.slice(DF_ANIMATION_NAME_PREFIX.length)
		: trimmed

	return withoutPrefix || trimmed || 'animation'
}

function makeUniqueName(baseName: string, usedNames: Set<string>): string {
	let uniqueName = baseName
	let suffix = 2
	while (usedNames.has(uniqueName)) {
		uniqueName = `${baseName}_${suffix}`
		suffix++
	}
	usedNames.add(uniqueName)
	return uniqueName
}

function blockMaterialToItemId(blockMaterial: string): string {
	return parseBlockMaterial(blockMaterial).itemId
}

function parseBlockMaterial(blockMaterial: string): { itemId: string; states?: string } {
	const trimmed = blockMaterial.trim()
	if (!trimmed) {
		return { itemId: 'minecraft:stone' }
	}

	const firstBracket = trimmed.indexOf('[')
	if (firstBracket === -1) {
		return { itemId: ensureNamespacedId(trimmed) }
	}

	const itemId = ensureNamespacedId(trimmed.slice(0, firstBracket).trim() || 'minecraft:stone')
	const lastBracket = trimmed.lastIndexOf(']')
	const states = (
		lastBracket > firstBracket
			? trimmed.slice(firstBracket + 1, lastBracket)
			: trimmed.slice(firstBracket + 1)
	).trim()

	return states ? { itemId, states } : { itemId }
}

function escapeSnbtString(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t')
}

function normalizeJsonText(rawText: string): string {
	const trimmed = rawText.trim()
	if (!trimmed) return JSON.stringify(' ')
	try {
		JSON.parse(trimmed)
		return trimmed
	} catch {
		return JSON.stringify(rawText)
	}
}

function normalizeTextTagValue(rawText: string): string {
	const trimmed = rawText.trim()
	if (!trimmed) return ''
	try {
		const parsed = JSON.parse(trimmed)
		if (typeof parsed === 'string') return parsed
	} catch {
		// keep raw text if it's not valid JSON
	}
	return rawText
}

function normalizeRgbHex(color: string): string {
	const trimmed = color.trim()
	if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) {
		return `#${trimmed.slice(3)}`
	}
	if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
		return trimmed
	}
	return '#000000'
}

type FlatNodeTagPrimitive = string | number | boolean

const ALT_BOOLEAN_TAG_KEYS: ReadonlySet<string> = new Set(['shadow', 'see_through', 'glowing'])

function sanitizeTagKeyPart(part: string): string {
	const sanitized = part
		.trim()
		.replace(/[^a-zA-Z0-9_]+/g, '_')
		.replace(/^_+|_+$/g, '')
	return sanitized || 'value'
}

function flattenNodeDataToTags(
	value: unknown,
	currentPath: string[] = [],
	out: Record<string, FlatNodeTagPrimitive> = {}
): Record<string, FlatNodeTagPrimitive> {
	if (value === null || value === undefined) {
		return out
	}

	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		const key = currentPath.map(sanitizeTagKeyPart).join('_')
		if (key) {
			out[key] = value
		}
		return out
	}

	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			flattenNodeDataToTags(value[i], [...currentPath, `i${i}`], out)
		}
		return out
	}

	if (typeof value === 'object') {
		for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
			flattenNodeDataToTags(nestedValue, [...currentPath, key], out)
		}
		return out
	}

	return out
}

function primitiveToString(value: FlatNodeTagPrimitive): string {
	if (typeof value === 'boolean') return value ? 'true' : 'false'
	return String(value)
}

function appendAltBooleanNodeTags(
	tags: Record<string, FlatNodeTagPrimitive>
): Record<string, FlatNodeTagPrimitive> {
	const tagsWithAltValues: Record<string, FlatNodeTagPrimitive> = { ...tags }

	for (const [key, value] of Object.entries(tags)) {
		if (!ALT_BOOLEAN_TAG_KEYS.has(key) || typeof value !== 'boolean') continue
		tagsWithAltValues[`${key}_alt`] = value ? 'enabled' : 'disabled'
	}

	return tagsWithAltValues
}

function resolveDisplayConfigWithDefaults(
	config?: IBlueprintDisplayEntityConfigJSON
): Record<string, string | number | boolean> {
	const resolved = DisplayEntityConfig.fromJSON(config ?? {})
	return {
		on_apply_function: resolved.onApplyFunction,
		billboard: resolved.billboard,
		override_brightness: resolved.overrideBrightness,
		brightness_override: resolved.brightnessOverride,
		enchanted: resolved.enchanted,
		glowing: resolved.glowing,
		override_glow_color: resolved.overrideGlowColor,
		glow_color: resolved.glowColor,
		invisible: resolved.invisible,
		shadow_radius: resolved.shadowRadius,
		shadow_strength: resolved.shadowStrength,
	}
}

function resolveVariantDisplayConfigWithDefaults(
	defaultConfig: IBlueprintDisplayEntityConfigJSON | undefined,
	variantConfig: IBlueprintDisplayEntityConfigJSON | undefined
): Record<string, string | number | boolean> {
	const resolved = DisplayEntityConfig.fromJSON(defaultConfig ?? {})
	if (variantConfig) {
		resolved.inheritFrom(DisplayEntityConfig.fromJSON(variantConfig))
	}
	return {
		on_apply_function: resolved.onApplyFunction,
		billboard: resolved.billboard,
		override_brightness: resolved.overrideBrightness,
		brightness_override: resolved.brightnessOverride,
		enchanted: resolved.enchanted,
		glowing: resolved.glowing,
		override_glow_color: resolved.overrideGlowColor,
		glow_color: resolved.glowColor,
		invisible: resolved.invisible,
		shadow_radius: resolved.shadowRadius,
		shadow_strength: resolved.shadowStrength,
	}
}

function serializeDisplayNodeCommon(
	node: Extract<AnyRenderedNode, { type: 'bone' | 'text_display' | 'item_display' | 'block_display' }>
): Record<string, unknown> {
	const defaultConfig = resolveDisplayConfigWithDefaults(node.configs?.default)
	const variantConfigs = Object.fromEntries(
		Object.entries(node.configs?.variants ?? {}).map(([variantId, variantConfig]) => {
			return [
				variantId,
				resolveVariantDisplayConfigWithDefaults(node.configs?.default, variantConfig),
			]
		})
	)

	return {
		storage_name: node.storage_name,
		parent: node.parent,
		base_scale: node.base_scale,
		...defaultConfig,
		...(Object.keys(variantConfigs).length > 0 ? { variant_configs: variantConfigs } : {}),
	}
}

function serializeNodeForDF(node: AnyRenderedNode, defaultVariantModel?: IRenderedVariantModel): Node | undefined {
	if (!DF_EXPORTED_NODE_TYPES.has(node.type)) {
		return
	}

	switch (node.type) {
		case 'bone': {
			if (!defaultVariantModel) return
			return {
				name: node.name,
				type: node.type,
				data: {
					...serializeDisplayNodeCommon(node),
					material: ensureNamespacedId(Project!.animated_java.display_item),
					item_model: defaultVariantModel.item_model,
				},
			}
		}
		case 'text_display': {
			return {
				name: node.name,
				type: node.type,
				data: {
					...serializeDisplayNodeCommon(node),
					text: normalizeTextTagValue(node.text),
					line_width: node.line_width,
					background_color: node.background_color,
					background_color_rgb: normalizeRgbHex(node.background_color),
					background_alpha: node.background_alpha,
					align: node.align,
					shadow: node.shadow,
					see_through: node.see_through,
				},
			}
		}
		case 'item_display': {
			return {
				name: node.name,
				type: node.type,
				data: {
					...serializeDisplayNodeCommon(node),
					material: ensureNamespacedId(node.item || 'minecraft:stone'),
					item_display: node.item_display,
				},
			}
		}
		case 'block_display': {
			const blockMaterial = node.block || 'minecraft:stone'
			const parsedBlockMaterial = parseBlockMaterial(blockMaterial)
			return {
				name: node.name,
				type: node.type,
				data: {
					...serializeDisplayNodeCommon(node),
					material: blockMaterial,
					...(parsedBlockMaterial.states ? { block_states: parsedBlockMaterial.states } : {}),
				},
			}
		}
		default:
			return
	}
}

function buildNodeItemSNBT(nodeData: Node, fallbackItemMaterial: string): string | undefined {
	if (
		nodeData.type !== 'bone' &&
		nodeData.type !== 'text_display' &&
		nodeData.type !== 'item_display' &&
		nodeData.type !== 'block_display'
	) {
		return
	}

	const hypercubeType = DF_HYPERCUBE_TYPE_BY_NODE_TYPE[nodeData.type]
	const flatNodeData = flattenNodeDataToTags(nodeData.data ?? {})
	const customDataTags: Record<string, FlatNodeTagPrimitive> = {
		...appendAltBooleanNodeTags(flatNodeData),
		id: nodeData.name,
		type: hypercubeType,
	}

	const bukkitValues: string[] = Object.entries(customDataTags).map(([key, value]) => {
		return `"hypercube:${escapeSnbtString(key)}":"${escapeSnbtString(primitiveToString(value))}"`
	})

	const components: string[] = [`"minecraft:custom_data":{PublicBukkitValues:{${bukkitValues.join(',')}}}`]

	let itemId = ensureNamespacedId(fallbackItemMaterial)

	switch (nodeData.type) {
		case 'bone': {
			const itemModel = nodeData.data?.item_model
			const material = nodeData.data?.material
			if (typeof itemModel === 'string' && itemModel.length > 0) {
				components.push(`"minecraft:item_model":"${escapeSnbtString(itemModel)}"`)
			}
			if (typeof material === 'string' && material.length > 0) {
				itemId = ensureNamespacedId(material)
			}
			break
		}
		case 'text_display': {
			itemId = 'minecraft:name_tag'
			const textRaw =
				typeof nodeData.data?.text === 'string' ? nodeData.data.text : JSON.stringify(' ')
			const normalizedText = normalizeJsonText(textRaw)
			components.push(`"minecraft:custom_name":"${escapeSnbtString(normalizedText)}"`)
			break
		}
		case 'item_display': {
			const material = nodeData.data?.material
			itemId =
				typeof material === 'string' && material.length > 0
					? ensureNamespacedId(material)
					: 'minecraft:stone'
			if (nodeData.data?.enchanted === true) {
				components.push(`"minecraft:enchantment_glint_override":1b`)
			}
			break
		}
		case 'block_display': {
			const material = nodeData.data?.material
			itemId =
				typeof material === 'string' && material.length > 0
					? blockMaterialToItemId(material)
					: 'minecraft:stone'
			break
		}
	}

	return `{components:{${components.join(',')}},count:1,id:"${escapeSnbtString(itemId)}"}`
}

export async function exportJSONDF(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	displayItemPath: string
	textureExportFolder: string
	modelExportFolder: string
}) {
	const { rig, animations, displayItemPath } = options

	const nodes: Record<string, Node> = {}
	const defaultVariant = rig.variants[Object.keys(rig.variants)[0]]
	for (const [uuid, node] of Object.entries(rig.nodes)) {
		const renderedNode = serializeNodeForDF(node, defaultVariant?.models[uuid])
		if (!renderedNode) continue
		nodes[uuid] = renderedNode
	}

	const item = displayItemPath.split(/[\\/]/).pop()?.replace('.json', '') ?? 'stone'

	const dataForTemplate: DFTemplateData = {
		model_name: Project!.name,
		item_material: item,
		nodes,
	}

	const animationData: RawAnimationData = {}
	const usedAnimationNames = new Set<string>()

	for (const animation of animations) {
		const animationName = makeUniqueName(toDFAnimationName(animation.name), usedAnimationNames)

		animationData[animationName] = {
			length: animation.duration,
			nodes: {},
		}

		const cachedAnimationData: Record<string, string[]> = {}
		const lastKnownMatrixByNode: Record<string, string | undefined> = {}
		for (const frame of animation.frames) {
			for (const nodeUuid of Object.keys(nodes)) {
				const nodeTransform = frame.node_transforms[nodeUuid]
				if (nodeTransform) {
					const matrix = nodeTransform.matrix.elements
					lastKnownMatrixByNode[nodeUuid] = compressMatrix(rotateMatrix(matrix))
				}

				const matrixForFrame = lastKnownMatrixByNode[nodeUuid]
				if (!matrixForFrame) continue

				cachedAnimationData[nodeUuid] = cachedAnimationData[nodeUuid] || []
				cachedAnimationData[nodeUuid].push(matrixForFrame)
			}
		}

		const compressedAnimationData: Record<string, string> = {}
		for (const [nodeUuid, matrices] of Object.entries(cachedAnimationData)) {
			const joinedMatrices = matrices.join('')
			const gzipped = await textToGZip(joinedMatrices)

			compressedAnimationData[nodes[nodeUuid].name] = gzipped
		}
		animationData[animationName].nodes = compressedAnimationData
	}

	const codeTemplate = buildCodeTemplate(dataForTemplate, animationData)
	try {
		await sendTemplatesToCodeClient(
			[
				{
					template: codeTemplate,
					templateName: Project!.name,
					displayName: `Init Rig ${Project!.name}`,
				},
			],
			textToGZip
		)
	} catch (error) {
		if (error instanceof CodeClientError) {
			throw new DFExportError(error.message, error.cause)
		}
		throw error
	}
}

function buildCodeTemplate(
	templateData: DFTemplateData,
	rawAnimationData: RawAnimationData
): CodeTemplate {
	// {"blocks":[
	// {"id":"block","block":"func","args":{"items":[{"item":{"id":"pn_el","data":{"name":"nodes","type":"var","plural":false,"optional":false}},"slot":0},{"item":{"id":"pn_el","data":{"name":"animations","type":"var","plural":false,"optional":false}},"slot":1},{"item":{"id":"hint","data":{"id":"function"}},"slot":25},{"item":{"id":"bl_tag","data":{"option":"False","tag":"Is Hidden","action":"dynamic","block":"func"}},"slot":26}]},"data":"consts.rig.NAME"},{"id":"block","block":"set_var","args":{"items":[{"item":{"id":"var","data":{"name":"nodes","scope":"line"}},"slot":0},{"item":{"id":"item","data":{"item":"{DF_NBT:3955,components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"leg_right\",\"hypercube:type\":\"model\"}},\"minecraft:custom_model_data\":2},count:1,id:\"minecraft:lime_candle\"}"}},"slot":1},{"item":{"id":"item","data":{"item":"{DF_NBT:3955,components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"backpack\",\"hypercube:type\":\"text\"}},\"minecraft:custom_name\":'{\"color\":\"red\",\"italic\":false,\"text\":\"asdf\"}'},count:1,id:\"minecraft:name_tag\"}"}},"slot":2},{"item":{"id":"item","data":{"item":"{DF_NBT:3955,components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"held\",\"hypercube:type\":\"item\"}}},count:1,id:\"minecraft:diamond_sword\"}"}},"slot":3}]},"action":"CreateList"},{"id":"block","block":"set_var","args":{"items":[{"item":{"id":"var","data":{"name":"animations","scope":"line"}},"slot":0},{"item":{"id":"txt","data":{"name":"default"}},"slot":1},{"item":{"id":"txt","data":{"name":"soem really long compressed gzip"}},"slot":2}]},"action":"SetDictValue"},{"id":"block","block":"set_var","args":{"items":[{"item":{"id":"var","data":{"name":"animations","scope":"line"}},"slot":0},{"item":{"id":"txt","data":{"name":"wave"}},"slot":1},{"item":{"id":"txt","data":{"name":"soem really long compressed gzip"}},"slot":2}]},"action":"SetDictValue"}
	// ]}

	const template: CodeTemplate = {
		blocks: [],
	}

	// Function Block
	template.blocks.push({
		id: 'block',
		block: 'func',
		data: `rig.init.${templateData.model_name}`,
		args: {
			items: [
				{
					item: {
						id: 'item',
						data: {
							item: `{id:"minecraft:turtle_egg",count:1,components:{"minecraft:custom_name":[{"text":"Init Rig ${templateData.model_name}","color":"#6DC7E9","italic":false}]}}`,
						},
					},
					slot: 0,
				},
				{
					item: {
						id: 'pn_el',
						data: { name: 'nodes', type: 'var', plural: false, optional: false },
					},
					slot: 1,
				},
				{
					item: {
						id: 'pn_el',
						data: { name: 'animations', type: 'var', plural: false, optional: false },
					},
					slot: 2,
				},
				{
					item: {
						id: 'bl_tag',
						data: {
							option: 'False',
							tag: 'Is Hidden',
							action: 'dynamic',
							block: 'func',
						},
					},
					slot: 26,
				},
			],
		},
	})

	// Set Nodes Variable Block
	let nodesVarBlock: CodeBlock = {
		id: 'block',
		block: 'set_var',
		action: 'CreateList',
		args: {
			items: [
				{
					item: { id: 'var', data: { name: 'nodes', scope: 'line' } },
					slot: 0,
				},
			],
		},
	}

	const slotLimit = 27
	for (const nodeData of Object.values(templateData.nodes)) {
		const itemSnbt = buildNodeItemSNBT(nodeData, templateData.item_material)
		if (!itemSnbt) continue

		nodesVarBlock.args!.items!.push({
			item: {
				id: 'item',
				data: {
					item: itemSnbt,
				},
			},
			slot: nodesVarBlock.args!.items!.length,
		})

		if (nodesVarBlock.args!.items!.length >= slotLimit) {
			// push current block and start a new one
			template.blocks.push(nodesVarBlock)
			nodesVarBlock = {
				id: 'block',
				block: 'set_var',
				action: 'AppendValue',
				args: {
					items: [
						{
							item: { id: 'var', data: { name: 'nodes', scope: 'line' } },
							slot: 0,
						},
					],
				},
			}
		}
	}
	if (nodesVarBlock.action === 'CreateList' || nodesVarBlock.args!.items!.length > 1) {
		template.blocks.push(nodesVarBlock)
	}

	for (const [animationName, animation] of Object.entries(rawAnimationData)) {
		let animationBlock: CodeBlock = {
			id: 'block',
			block: 'set_var',
			action: 'CreateList',
			args: {
				items: [
					{
						item: { id: 'var', data: { name: animationName, scope: 'line' } },
						slot: 0,
					},
				],
			},
		}

		animationBlock.args!.items!.push({
			item: { id: 'num', data: { name: animation.length.toString() } },
			slot: animationBlock.args!.items!.length,
		})

		// add node data
		for (const [nodeName, compressedMatrix] of Object.entries(animation.nodes)) {
			if (animationBlock.args!.items!.length + 2 > slotLimit) {
				// push current block and start a new one
				template.blocks.push(animationBlock)
				animationBlock = {
					id: 'block',
					block: 'set_var',
					action: 'AppendValue',
					args: {
						items: [
							{
								item: { id: 'var', data: { name: animationName, scope: 'line' } },
								slot: 0,
							},
						],
					},
				}
			}
			animationBlock.args!.items!.push({
				item: { id: 'txt', data: { name: nodeName } },
				slot: animationBlock.args!.items!.length,
			})
			animationBlock.args!.items!.push({
				item: { id: 'txt', data: { name: compressedMatrix } },
				slot: animationBlock.args!.items!.length,
			})
		}
		if (animationBlock.args!.items!.length > 1) template.blocks.push(animationBlock)

		const setDictValueBlock: CodeBlock = {
			id: 'block',
			block: 'set_var',
			action: 'SetDictValue',
			args: {
				items: [
					{
						item: { id: 'var', data: { name: 'animations', scope: 'line' } },
						slot: 0,
					},
					{
						item: { id: 'txt', data: { name: animationName } },
						slot: 1,
					},
					{
						item: { id: 'var', data: { name: animationName, scope: 'line' } },
						slot: 2,
					},
				],
			},
		}
		template.blocks.push(setDictValueBlock)
	}

	return template
}
