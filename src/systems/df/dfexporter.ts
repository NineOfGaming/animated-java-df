import { IRenderedAnimation } from '../animationRenderer'
import { IRenderedRig } from '../rigRenderer'
import { compressMatrix, rotateMatrix } from './dfdata'

export class DFExportError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message)
		this.name = 'DFExportError'
	}
}

async function loadPako() {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.3/pako.min.js'
		script.onload = resolve
		script.onerror = reject
		document.head.appendChild(script)
	})
}

interface PakoApi {
	gzip: (input: unknown, options?: unknown) => Uint8Array | string
}

async function getPakoApi(): Promise<PakoApi> {
	const globalObj = globalThis as unknown as {
		pako?: PakoApi
		PAKO?: PakoApi
	}

	if (globalObj.pako?.gzip) return globalObj.pako
	if (globalObj.PAKO?.gzip) return globalObj.PAKO

	await loadPako()

	if (globalObj.pako?.gzip) return globalObj.pako
	if (globalObj.PAKO?.gzip) return globalObj.PAKO

	throw new Error('Failed to load pako gzip API')
}

async function textToGZip(input: any): Promise<string> {
	try {
		const pako = await getPakoApi()
		const uint8array = pako.gzip(input, { to: 'string' })

		return Buffer.from(uint8array).toString('base64')
	} catch (e) {
		throw new DFExportError('Failed to compress DF export payload.', e)
	}
}

interface Node {
	name: string
	type:
		| 'bone'
		| 'struct'
		| 'camera'
		| 'locator'
		| 'text_display'
		| 'item_display'
		| 'block_display'
	data?: any
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

interface CodeBlock {
	id: string
	block: string
	args?: {
		items?: Array<{
			item: {
				id: string
				data: any
			}
			slot: number
		}>
	}
	data?: string
	action?: string
}
interface CodeTemplate {
	blocks: CodeBlock[]
}

const CODECLIENT_API_URL = 'ws://localhost:31375'
const CODECLIENT_GIVE_RESPONSE_TIMEOUT_MS = 5_000

function escapeSnbtString(value: string) {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function buildCodeClientGiveCommand(template: CodeTemplate, modelName: string) {
	const zippedTemplate = await textToGZip(JSON.stringify(template))
	const templatePayload = JSON.stringify({
		author: 'Animated Java',
		name: modelName,
		version: 1,
		code: zippedTemplate,
	})
	const escapedTemplatePayload = escapeSnbtString(templatePayload)

	return (
		'give ' +
		`{count:1,id:"minecraft:ender_chest",components:{"minecraft:custom_name":[{"text":"Init Rig ${modelName}","color":"#6DC7E9","italic":false}],"minecraft:custom_data":{PublicBukkitValues:{"hypercube:codetemplatedata":"${escapedTemplatePayload}"}}}}`
	)
}

async function sendTemplateToCodeClient(template: CodeTemplate, modelName: string) {
	const giveCommand = await buildCodeClientGiveCommand(template, modelName)

	await new Promise<void>((resolve, reject) => {
		let hasSettled = false
		let hasSentGive = false
		let responseTimeout: ReturnType<typeof setTimeout> | undefined
		const socket = new WebSocket(CODECLIENT_API_URL)

		const cleanup = () => {
			if (responseTimeout) clearTimeout(responseTimeout)
			responseTimeout = undefined
		}

		const fail = (message: string, error?: unknown) => {
			if (hasSettled) return
			hasSettled = true
			cleanup()
			try {
				socket.close()
			} catch {
				/* no-op */
			}
			reject(new DFExportError(message, error))
		}

		socket.addEventListener('open', () => {
			hasSentGive = true
			socket.send(giveCommand)
			responseTimeout = setTimeout(() => {
				if (hasSettled) return
				hasSettled = true
				cleanup()
				socket.close()
				resolve()
			}, CODECLIENT_GIVE_RESPONSE_TIMEOUT_MS)
		})

		socket.addEventListener('message', event => {
			const response = String(event.data).trim()
			if (!response || hasSettled) return

			if (response === 'unauthed') {
				fail('CodeClient rejected the export due to missing permissions.')
				return
			}

			if (response === 'not creative mode') {
				fail('CodeClient can only give items while the player is in creative mode.')
				return
			}

			if (response === 'invalid nbt') {
				fail('CodeClient rejected the generated template item payload as invalid NBT.')
				return
			}

			if (response === 'invalid') {
				fail('CodeClient rejected the API command as invalid.')
				return
			}
		})

		socket.addEventListener('error', error => {
			fail(
				'Failed to connect to CodeClient API. Enable the API in CodeClient settings and make sure CodeClient is running.',
				error
			)
		})

		socket.addEventListener('close', () => {
			if (!hasSettled) {
				if (hasSentGive) {
					hasSettled = true
					cleanup()
					resolve()
					return
				}
				fail('CodeClient API connection closed before the template item was delivered.')
			}
		})
	})
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
	for (const [uuid, node] of Object.entries(rig.nodes)) {
		nodes[uuid] = {
			name: node.name,
			type: node.type,
			data: {},
		}

		if (node.type === 'item_display') {
			nodes[uuid].data = {
				material: node.item || 'minecraft:stone',
			}
		}

		if (node.type === 'block_display') {
			nodes[uuid].data = {
				material: node.block || 'minecraft:stone',
			}
		}
	}
	for (const [uuid, info] of Object.entries(rig.variants[Object.keys(rig.variants)[0]].models)) {
		nodes[uuid].data = {
			item_model: info.item_model,
		}
	}

	const item = displayItemPath.split('\\').pop()?.replace('.json', '') ?? 'stone'

	const dataForTempalte: DFTemplateData = {
		model_name: Project!.name,
		item_material: item,
		nodes,
	}

	const animationData: any = {}

	for (const animation of animations) {
		animationData[animation.name] = {
			length: animation.duration,
			nodes: {},
		}

		const cachedAnimationData: Record<string, string[]> = {}
		for (const frame of animation.frames) {
			for (const nodeUuid of Object.keys(nodes)) {
				const nodeTransform = frame.node_transforms[nodeUuid]
				if (!nodeTransform) continue

				const matrix = nodeTransform.matrix.elements
				const newMatrix = compressMatrix(rotateMatrix(matrix))

				cachedAnimationData[nodeUuid] = cachedAnimationData[nodeUuid] || []
				cachedAnimationData[nodeUuid].push(newMatrix)
			}
		}

		const compressedAnimationData: Record<string, string> = {}
		for (const [nodeUuid, matrices] of Object.entries(cachedAnimationData)) {
			const joinedMatrices = matrices.join('')
			const gzipped = await textToGZip(joinedMatrices)

			compressedAnimationData[nodes[nodeUuid].name] = gzipped
		}
		animationData[animation.name].nodes = compressedAnimationData
	}

	// animationData["default"] = {
	//     length: 1,
	//     nodes: {}
	// }
	// for (const [uuid, node] of Object.entries(rig.nodes)) {
	//     const matrix = rotateMatrix(node.default_transform.matrix.elements);
	//     const compressedMatrix = compressMatrix(rotateMatrix(matrix));
	//     animationData["default"].nodes[node.name] = await textToGZip(compressedMatrix);
	// }

	const codeTemplate = buildCodeTemplate(dataForTempalte, animationData)

	await sendTemplateToCodeClient(codeTemplate, Project!.name)
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
	Object.entries(templateData.nodes).forEach(([_nodeName, nodeData]) => {
		if (nodeData.type === 'struct') {
			return // Skip structs
		}

		const itemData: any = {
			item: `{components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"${
				nodeData.name
			}\",\"hypercube:type\":\"${nodeData.type}\"}}},count:1,id:\"minecraft:${
				nodeData.type === 'item_display'
					? nodeData.data?.material
					: templateData.item_material
			}\"}`,
		}

		if (nodeData.type === 'bone') {
			itemData.item = `{components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"${nodeData.name}\",\"hypercube:type\":\"model\"}},\"minecraft:item_model\":\"animated_java:blueprint/${templateData.model_name}/${nodeData.name}\"},count:1,id:\"${templateData.item_material}\"}`
		} else if (nodeData.type === 'text_display') {
			itemData.item = `{components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"${nodeData.name}\",\"hypercube:type\":\"text\"}},\"minecraft:custom_name\":'${nodeData.data?.name}'},count:1,id:\"minecraft:name_tag\"}`
		} else if (nodeData.type === 'item_display') {
			itemData.item = `{components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"${
				nodeData.name
			}\",\"hypercube:type\":\"item\"}}},count:1,id:\"${
				nodeData.data?.material ?? 'minecraft:stone'
			}\"}`
		} else if (nodeData.type === 'block_display') {
			console.log('!!!!!!!!!!!!!!!!!!', nodeData)
			itemData.item = `{components:{\"minecraft:custom_data\":{PublicBukkitValues:{\"hypercube:id\":\"${
				nodeData.name
			}\",\"hypercube:type\":\"block\"}}},count:1,id:\"${
				nodeData.data?.material ?? 'minecraft:stone'
			}\"}`
		}

		nodesVarBlock.args!.items!.push({
			item: { id: 'item', data: itemData },
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
	})
	if (nodesVarBlock.args!.items!.length > 1) template.blocks.push(nodesVarBlock)

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
