import type {
	IBlueprintDisplayEntityConfigJSON,
	IBlueprintInteractionConfigJSON,
} from '../../formats/blueprint'
import { DisplayEntityConfig, InteractionConfig } from '../../nodeConfigs'
import type { INodeTransform, IRenderedAnimation } from '../animationRenderer'
import type { AnyRenderedNode, IRenderedRig, IRenderedVariantModel } from '../rigRenderer'
import {
	buildCodeTemplate,
	ensureNamespacedId,
	parseBlockMaterial,
	type DFTemplateData,
	type DFTemplateNode,
	type RawAnimationData,
	type RawVariantData,
	type SupportedDFNodeType,
} from './codeTemplateBuilder'
import { DFTemplateSplitError, splitDFCodeTemplateItem } from './codeTemplateSplitter'
import { CodeClientError, sendTemplatesToCodeClient } from './codeclient'
import { textToGZip } from './compression'
import { compressLocatorTransform, compressMatrix, rotateMatrix } from './dfdata'
import { jsonTextToMiniMessage } from './minimessage'

export class DFExportError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message)
		this.name = 'DFExportError'
	}
}

type SupportedDFDisplayNode = Extract<
	AnyRenderedNode,
	{ type: 'bone' | 'text_display' | 'item_display' | 'block_display' }
>

const DF_EXPORTED_NODE_TYPES: ReadonlySet<SupportedDFNodeType> = new Set([
	'bone',
	'text_display',
	'item_display',
	'block_display',
	'locator',
	'camera',
	'interaction',
])

const DF_ANIMATION_NAME_PREFIX = 'animation.model.'

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

function isSupportedDFNodeType(type: AnyRenderedNode['type']): type is SupportedDFNodeType {
	return DF_EXPORTED_NODE_TYPES.has(type as SupportedDFNodeType)
}

function getLocatorTransformValues(
	transform?: INodeTransform
): [number, number, number, number, number] {
	return [
		transform?.pos?.[0] ?? 0,
		transform?.pos?.[1] ?? 0,
		transform?.pos?.[2] ?? 0,
		transform?.head_rot?.[0] ?? 0,
		transform?.head_rot?.[1] ?? 0,
	]
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

function resolveDisplayConfigWithDefaults(
	config?: IBlueprintDisplayEntityConfigJSON
): Record<string, string | number | boolean> {
	const resolved = DisplayEntityConfig.fromJSON(config ?? {})
	return {
		on_apply_function: resolved.onApplyFunction,
		billboard: resolved.billboard,
		override_brightness: resolved.overrideBrightness,
		sky_brightness: resolved.skyBrightness,
		block_brightness: resolved.blockBrightness,
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
		sky_brightness: resolved.skyBrightness,
		block_brightness: resolved.blockBrightness,
		enchanted: resolved.enchanted,
		glowing: resolved.glowing,
		override_glow_color: resolved.overrideGlowColor,
		glow_color: resolved.glowColor,
		invisible: resolved.invisible,
		shadow_radius: resolved.shadowRadius,
		shadow_strength: resolved.shadowStrength,
	}
}

function resolveInteractionConfigWithDefaults(
	config?: IBlueprintInteractionConfigJSON
): Record<string, string | number | boolean> {
	const resolved = InteractionConfig.fromJSON(config ?? {})
	return {
		response: resolved.response,
	}
}

function serializeDisplayNodeCommon(
	node: SupportedDFDisplayNode,
	displayConfig: Record<string, string | number | boolean> = resolveDisplayConfigWithDefaults(
		node.configs?.default
	)
): Record<string, unknown> {
	return {
		storage_name: node.storage_name,
		parent: node.parent,
		base_scale: node.base_scale,
		...displayConfig,
	}
}

function serializeNodeForDF(
	node: AnyRenderedNode,
	defaultVariantModel?: IRenderedVariantModel,
	displayConfig?: Record<string, string | number | boolean>
): DFTemplateNode | undefined {
	if (!isSupportedDFNodeType(node.type)) {
		return
	}

	switch (node.type) {
		case 'bone': {
			if (!defaultVariantModel) return
			return {
				name: node.name,
				type: node.type,
				data: {
					...serializeDisplayNodeCommon(node, displayConfig),
					material: ensureNamespacedId(Project!.animated_java.display_item),
					item_display: 'head',
					item_model: defaultVariantModel.item_model,
				},
			}
		}
		case 'text_display': {
			return {
				name: node.name,
				type: node.type,
				data: {
					...serializeDisplayNodeCommon(node, displayConfig),
					text:
						node.mini_message ??
						jsonTextToMiniMessage(
							node.text,
							Project!.animated_java.target_minecraft_version
						),
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
					...serializeDisplayNodeCommon(node, displayConfig),
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
					...serializeDisplayNodeCommon(node, displayConfig),
					material: blockMaterial,
					...(parsedBlockMaterial.states
						? { block_states: parsedBlockMaterial.states }
						: {}),
				},
			}
		}
		case 'locator': {
			const [defaultPx, defaultPy, defaultPz, defaultRx, defaultRy] =
				getLocatorTransformValues(node.default_transform)
			return {
				name: node.name,
				type: node.type,
				data: {
					parent: node.parent,
					default_px: defaultPx,
					default_py: defaultPy,
					default_pz: defaultPz,
					default_rx: defaultRx,
					default_ry: defaultRy,
				},
			}
		}
		case 'camera': {
			const [defaultPx, defaultPy, defaultPz, defaultRx, defaultRy] =
				getLocatorTransformValues(node.default_transform)
			return {
				name: node.name,
				type: node.type,
				data: {
					parent: node.parent,
					default_px: defaultPx,
					default_py: defaultPy,
					default_pz: defaultPz,
					default_rx: defaultRx,
					default_ry: defaultRy,
				},
			}
		}
		case 'interaction': {
			const [defaultPx, defaultPy, defaultPz, defaultRx, defaultRy] =
				getLocatorTransformValues(node.default_transform)
			return {
				name: node.name,
				type: node.type,
				data: {
					parent: node.parent,
					default_px: defaultPx,
					default_py: defaultPy,
					default_pz: defaultPz,
					default_rx: defaultRx,
					default_ry: defaultRy,
					width: node.width,
					height: node.height,
					...resolveInteractionConfigWithDefaults(node.config),
				},
			}
		}
		default:
			return
	}
}

function isSupportedDFDisplayNode(node: AnyRenderedNode): node is SupportedDFDisplayNode {
	return (
		node.type === 'bone' ||
		node.type === 'text_display' ||
		node.type === 'item_display' ||
		node.type === 'block_display'
	)
}

export async function exportJSONDF(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	displayItemPath: string
	textureExportFolder: string
	modelExportFolder: string
}) {
	const { rig, animations, displayItemPath } = options

	const nodes: Record<string, DFTemplateNode> = {}
	const defaultVariant = Object.values(rig.variants).find(variant => variant.is_default)
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

	const variantAffectedNodeUuids = new Set<string>()
	for (const variant of Object.values(rig.variants)) {
		if (variant.is_default) continue

		for (const [nodeUuid, node] of Object.entries(rig.nodes)) {
			if (!isSupportedDFDisplayNode(node)) continue
			if (!nodes[nodeUuid]) continue

			const hasModelOverride = variant.models[nodeUuid] !== undefined
			const variantConfig = node.configs?.variants?.[variant.uuid]
			if (hasModelOverride || variantConfig) variantAffectedNodeUuids.add(nodeUuid)
		}
	}

	const variantData: RawVariantData = {}
	for (const variant of Object.values(rig.variants)) {
		if (variant.is_default) continue
		const variantNodes: DFTemplateNode[] = []
		for (const nodeUuid of variantAffectedNodeUuids) {
			const node = rig.nodes[nodeUuid]
			if (!isSupportedDFDisplayNode(node)) continue

			const displayConfig = resolveVariantDisplayConfigWithDefaults(
				node.configs?.default,
				node.configs?.variants?.[variant.uuid]
			)
			const renderedVariantNode = serializeNodeForDF(
				node,
				defaultVariant?.models[nodeUuid],
				displayConfig
			)
			if (renderedVariantNode) variantNodes.push(renderedVariantNode)
		}

		variantData[variant.name] = variantNodes
	}

	for (const animation of animations) {
		const animationName = makeUniqueName(toDFAnimationName(animation.name), usedAnimationNames)

		animationData[animationName] = {
			length: animation.duration,
			nodes: {},
		}

		const cachedAnimationData: Record<string, string[]> = {}
		const lastKnownAnimationDataByNode: Record<string, string | undefined> = {}
		for (const frame of animation.frames) {
			for (const nodeUuid of Object.keys(nodes)) {
				const nodeTransform = frame.node_transforms[nodeUuid]
				if (nodeTransform) {
					if (
						nodes[nodeUuid].type === 'locator' ||
						nodes[nodeUuid].type === 'camera' ||
						nodes[nodeUuid].type === 'interaction'
					) {
						lastKnownAnimationDataByNode[nodeUuid] = compressLocatorTransform(
							getLocatorTransformValues(nodeTransform)
						)
					} else {
						const matrix = nodeTransform.matrix.elements
						lastKnownAnimationDataByNode[nodeUuid] = compressMatrix(
							rotateMatrix(matrix)
						)
					}
				}

				const animationDataForFrame = lastKnownAnimationDataByNode[nodeUuid]
				if (!animationDataForFrame) continue

				cachedAnimationData[nodeUuid] = cachedAnimationData[nodeUuid] || []
				cachedAnimationData[nodeUuid].push(animationDataForFrame)
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

	const codeTemplate = buildCodeTemplate(dataForTemplate, animationData, variantData)
	try {
		const templateItems = await splitDFCodeTemplateItem(
			{
				template: codeTemplate,
				templateName: Project!.name,
				displayName: `Init Rig ${Project!.name}`,
			},
			textToGZip
		)
		await sendTemplatesToCodeClient(templateItems, textToGZip)
	} catch (error) {
		if (error instanceof DFTemplateSplitError) {
			console.error(
				`[Animated Java/DF] Template split rejected: name="${error.templateName}", ` +
					`finalModifiedUtf8SizeBytes=${error.encodedSizeBytes}, ` +
					`safeMaximumBytes=${error.safeMaximumBytes}, rejected=true`
			)
		}
		if (error instanceof CodeClientError) {
			throw new DFExportError(error.message, error.cause)
		}
		throw error
	}
}
