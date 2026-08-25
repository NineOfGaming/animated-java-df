import { buildDFExporterFunctionBlock } from './dfExporterTemplate'
import type { CodeBlock, CodeTemplate } from './types'

export type SupportedDFNodeType =
	| 'bone'
	| 'text_display'
	| 'item_display'
	| 'block_display'
	| 'locator'
	| 'camera'
	| 'interaction'

export interface DFTemplateNode {
	name: string
	type: SupportedDFNodeType
	data?: Record<string, unknown>
}

export interface DFTemplateData {
	model_name: string
	item_material: string
	nodes: Record<string, DFTemplateNode>
}

export type RawAnimationData = Record<
	string,
	{
		length: number
		nodes: Record<string, string>
	}
>

export type RawVariantData = Record<string, DFTemplateNode[]>

const DF_HYPERCUBE_TYPE_BY_NODE_TYPE: Record<SupportedDFNodeType, string> = {
	bone: 'model',
	text_display: 'text',
	item_display: 'item',
	block_display: 'block',
	locator: 'locator',
	camera: 'camera',
	interaction: 'interaction',
}

const DF_NODE_ITEM_DISPLAY_TYPE_BY_NODE_TYPE: Record<SupportedDFNodeType, string> = {
	bone: 'Model',
	text_display: 'Text Display',
	item_display: 'Item Display',
	block_display: 'Block Display',
	locator: 'Locator',
	camera: 'Camera',
	interaction: 'Interaction',
}

export function ensureNamespacedId(id: string): string {
	const trimmed = id.trim()
	if (!trimmed) return 'minecraft:stone'
	return trimmed.includes(':') ? trimmed : `minecraft:${trimmed}`
}

export function parseBlockMaterial(blockMaterial: string): { itemId: string; states?: string } {
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

function blockMaterialToItemId(blockMaterial: string): string {
	return parseBlockMaterial(blockMaterial).itemId
}

function escapeSnbtString(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t')
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

function buildNodeItemCustomNameComponent(type: SupportedDFNodeType, nodeName: string): string {
	const label = `${DF_NODE_ITEM_DISPLAY_TYPE_BY_NODE_TYPE[type]}: ${nodeName}`
	return `[{"text":"${escapeSnbtString(label)}","color":"#6DC7E9","italic":false}]`
}

function buildNodeItemSNBT(nodeData: DFTemplateNode, fallbackItemMaterial: string): string {
	const hypercubeType = DF_HYPERCUBE_TYPE_BY_NODE_TYPE[nodeData.type]
	const flatNodeData = flattenNodeDataToTags(nodeData.data ?? {})
	const customDataTags: Record<string, FlatNodeTagPrimitive> = {
		...appendAltBooleanNodeTags(flatNodeData),
		id: nodeData.name,
		type: hypercubeType,
	}

	const bukkitValues: string[] = Object.entries(customDataTags).map(([key, value]) => {
		return `"hypercube:${escapeSnbtString(key)}":"${escapeSnbtString(
			primitiveToString(value)
		)}"`
	})

	const components: string[] = [
		`"minecraft:custom_data":{PublicBukkitValues:{${bukkitValues.join(',')}}}`,
		`"minecraft:custom_name":${buildNodeItemCustomNameComponent(nodeData.type, nodeData.name)}`,
	]

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
			itemId = 'minecraft:book'
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
		case 'locator': {
			itemId = 'minecraft:paper'
			break
		}
		case 'camera': {
			itemId = 'minecraft:spyglass'
			break
		}
		case 'interaction': {
			itemId = 'minecraft:tripwire_hook'
			break
		}
	}

	return `{components:{${components.join(',')}},count:1,id:"${escapeSnbtString(itemId)}"}`
}

export function buildCodeTemplate(
	templateData: DFTemplateData,
	rawAnimationData: RawAnimationData,
	rawVariantData: RawVariantData
): CodeTemplate {
	const template: CodeTemplate = {
		blocks: [buildDFExporterFunctionBlock(templateData.model_name)],
	}

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

		for (const [nodeName, compressedMatrix] of Object.entries(animation.nodes)) {
			if (animationBlock.args!.items!.length + 2 > slotLimit) {
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

		template.blocks.push({
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
		})
	}

	for (const [variantName, variant] of Object.entries(rawVariantData)) {
		let variantBlock: CodeBlock = {
			id: 'block',
			block: 'set_var',
			action: 'CreateList',
			args: {
				items: [
					{
						item: { id: 'var', data: { name: variantName, scope: 'line' } },
						slot: 0,
					},
				],
			},
		}

		for (const nodeData of variant) {
			if (variantBlock.args!.items!.length + 1 > slotLimit) {
				template.blocks.push(variantBlock)
				variantBlock = {
					id: 'block',
					block: 'set_var',
					action: 'AppendValue',
					args: {
						items: [
							{
								item: { id: 'var', data: { name: variantName, scope: 'line' } },
								slot: 0,
							},
						],
					},
				}
			}
			const itemSnbt = buildNodeItemSNBT(nodeData, templateData.item_material)

			variantBlock.args!.items!.push({
				item: {
					id: 'item',
					data: {
						item: itemSnbt,
					},
				},
				slot: variantBlock.args!.items!.length,
			})
		}
		if (variantBlock.action === 'CreateList' || variantBlock.args!.items!.length > 1) {
			template.blocks.push(variantBlock)
		}

		template.blocks.push({
			id: 'block',
			block: 'set_var',
			action: 'SetDictValue',
			args: {
				items: [
					{
						item: { id: 'var', data: { name: 'variants', scope: 'line' } },
						slot: 0,
					},
					{
						item: { id: 'txt', data: { name: variantName } },
						slot: 1,
					},
					{
						item: { id: 'var', data: { name: variantName, scope: 'line' } },
						slot: 2,
					},
				],
			},
		})
	}

	return template
}
