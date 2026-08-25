import {
	CODECLIENT_TEMPLATE_SAFE_ENCODED_BYTES,
	CodeClientError,
	CodeClientTemplateSizeError,
	prepareCodeClientTemplate,
} from './codeclient'
import type { CodeBlock, CodeClientTemplateItem, CodeTemplate } from './types'

const SLOT_LIMIT = 27
const WORKING_PARAMETER_NAME = 'working'
const ORCHESTRATOR_WORKING_VARIABLE_NAME = '__aj_df_split_working'
const HELPER_INDEX_WIDTH = 8

interface AtomicOperation {
	block: CodeBlock
	mergeSequence?: number
}

interface SizeResult {
	fits: boolean
	encodedSizeBytes: number
}

export class DFTemplateSplitError extends CodeClientError {
	constructor(
		public readonly templateName: string,
		public readonly encodedSizeBytes: number,
		public readonly safeMaximumBytes: number,
		reason: string
	) {
		super(
			`DiamondFire template "${templateName}" could not be split safely: ${reason} ` +
				`The final item string is ${encodedSizeBytes} bytes in Minecraft's modified UTF-8 ` +
				`NBT encoding; the safe maximum is ${safeMaximumBytes} bytes.`
		)
		this.name = 'DFTemplateSplitError'
	}
}

function getBlockItems(block: CodeBlock) {
	return [...(block.args?.items ?? [])].sort((a, b) => a.slot - b.slot)
}

function cloneItemEntry(entry: NonNullable<CodeBlock['args']>['items'][number]) {
	return {
		item: {
			...entry.item,
			data:
				entry.item.data && typeof entry.item.data === 'object'
					? { ...entry.item.data }
					: entry.item.data,
		},
		slot: entry.slot,
	}
}

function cloneBlockWithItems(
	block: CodeBlock,
	items: NonNullable<CodeBlock['args']>['items']
): CodeBlock {
	return {
		...block,
		args: {
			...block.args,
			items: items.map(cloneItemEntry),
		},
	}
}

function buildMutationBlock(
	action: 'CreateList' | 'AppendValue',
	targetName: string,
	values: NonNullable<CodeBlock['args']>['items']
): CodeBlock {
	return {
		id: 'block',
		block: 'set_var',
		action,
		args: {
			items: [
				{
					item: { id: 'var', data: { name: targetName, scope: 'line' } },
					slot: 0,
				},
				...values.map((entry, index) => ({
					...cloneItemEntry(entry),
					slot: index + 1,
				})),
			],
		},
	}
}

function groupMutationValues(
	values: NonNullable<CodeBlock['args']>['items']
): Array<NonNullable<CodeBlock['args']>['items']> {
	if (values.length === 0) return []

	if (values[0].item.id === 'num') {
		const groups = [[values[0]]]
		for (let i = 1; i < values.length; i += 2) {
			if (!values[i + 1]) {
				throw new Error('Animation node data is missing its compressed matrix value.')
			}
			groups.push([values[i], values[i + 1]])
		}
		return groups
	}

	if (values[0].item.id === 'txt') {
		const groups: Array<NonNullable<CodeBlock['args']>['items']> = []
		for (let i = 0; i < values.length; i += 2) {
			if (!values[i + 1]) {
				throw new Error('Animation node name is missing its compressed matrix value.')
			}
			groups.push([values[i], values[i + 1]])
		}
		return groups
	}

	return values.map(value => [value])
}

function atomizeTemplateBody(template: CodeTemplate): AtomicOperation[] {
	const operations: AtomicOperation[] = []
	let mergeSequence = 0

	for (const block of template.blocks.slice(1)) {
		if (
			block.block === 'set_var' &&
			(block.action === 'CreateList' || block.action === 'AppendValue')
		) {
			const items = getBlockItems(block)
			const target = items[0]
			if (target?.item.id !== 'var' || typeof target.item.data?.name !== 'string') {
				throw new Error('Generated list mutation is missing its target variable.')
			}

			if (block.action === 'CreateList') mergeSequence++
			const targetName = target.item.data.name === 'nodes' ? 'nodes' : WORKING_PARAMETER_NAME
			const valueGroups = groupMutationValues(items.slice(1))

			if (valueGroups.length === 0) {
				operations.push({
					block: buildMutationBlock(block.action, targetName, []),
					mergeSequence,
				})
				continue
			}

			for (let i = 0; i < valueGroups.length; i++) {
				operations.push({
					block: buildMutationBlock(
						block.action === 'CreateList' && i === 0 ? 'CreateList' : 'AppendValue',
						targetName,
						valueGroups[i]
					),
					mergeSequence,
				})
			}
			continue
		}

		if (block.block === 'set_var' && block.action === 'SetDictValue') {
			const items = getBlockItems(block).map(cloneItemEntry)
			const valueVariable = items.find(item => item.slot === 2)
			if (valueVariable?.item.id !== 'var') {
				throw new Error('Generated dictionary mutation is missing its list value.')
			}
			valueVariable.item.data = {
				...valueVariable.item.data,
				name: WORKING_PARAMETER_NAME,
				scope: 'line',
			}
			operations.push({ block: cloneBlockWithItems(block, items) })
			continue
		}

		throw new Error(
			`Generated block ${JSON.stringify({ block: block.block, action: block.action })} ` +
				'is not a safe automatic split boundary.'
		)
	}

	return operations
}

function coalesceOperations(operations: AtomicOperation[]): CodeBlock[] {
	const blocks: CodeBlock[] = []
	let previousOperation: AtomicOperation | undefined

	for (const operation of operations) {
		const currentBlock = cloneBlockWithItems(operation.block, getBlockItems(operation.block))
		const previousBlock = blocks.at(-1)
		const canMerge =
			previousBlock?.block === 'set_var' &&
			(currentBlock.action === 'AppendValue' || currentBlock.action === 'CreateList') &&
			(previousBlock.action === 'AppendValue' || previousBlock.action === 'CreateList') &&
			currentBlock.action === 'AppendValue' &&
			operation.mergeSequence !== undefined &&
			operation.mergeSequence === previousOperation?.mergeSequence

		if (canMerge) {
			const previousItems = getBlockItems(previousBlock)
			const currentValues = getBlockItems(currentBlock).slice(1)
			if (previousItems.length + currentValues.length <= SLOT_LIMIT) {
				previousBlock.args!.items = [
					...previousItems,
					...currentValues.map((entry, index) => ({
						...cloneItemEntry(entry),
						slot: previousItems.length + index,
					})),
				]
				previousOperation = operation
				continue
			}
		}

		blocks.push(currentBlock)
		previousOperation = operation
	}

	return blocks
}

function buildHelperFunctionBlock(functionName: string): CodeBlock {
	const parameterNames = ['nodes', 'animations', 'variants', WORKING_PARAMETER_NAME]
	return {
		id: 'block',
		block: 'func',
		data: functionName,
		args: {
			items: [
				...parameterNames.map((name, slot) => ({
					item: {
						id: 'pn_el',
						data: { name, type: 'var', plural: false, optional: false },
					},
					slot,
				})),
				{
					item: {
						id: 'bl_tag',
						data: {
							option: 'True',
							tag: 'Is Hidden',
							action: 'dynamic',
							block: 'func',
						},
					},
					slot: 26,
				},
			],
		},
	}
}

function buildHelperCallBlock(functionName: string, workingVariableName: string): CodeBlock {
	const variableNames = ['nodes', 'animations', 'variants', workingVariableName]
	return {
		id: 'block',
		block: 'call_func',
		data: functionName,
		args: {
			items: variableNames.map((name, slot) => ({
				item: { id: 'var', data: { name, scope: 'line' } },
				slot,
			})),
		},
	}
}

function hashTemplateName(value: string) {
	let hash = 0xcbf29ce484222325n
	for (let i = 0; i < value.length; i++) {
		hash ^= BigInt(value.charCodeAt(i))
		hash = BigInt.asUintN(64, hash * 0x100000001b3n)
	}
	return hash.toString(16).padStart(16, '0')
}

function buildHelperFunctionName(groupHash: string, index: number) {
	if (index >= 10 ** HELPER_INDEX_WIDTH) {
		throw new Error('DiamondFire export requires too many split template parts.')
	}
	return `__aj.rig.init.${groupHash}.part.${String(index + 1).padStart(HELPER_INDEX_WIDTH, '0')}`
}

function buildDispatcherFunctionName(groupHash: string, level: number, index: number) {
	if (index >= 10 ** HELPER_INDEX_WIDTH) {
		throw new Error('DiamondFire export requires too many split template dispatchers.')
	}
	return `__aj.rig.init.${groupHash}.dispatch.${String(level + 1).padStart(4, '0')}.${String(
		index + 1
	).padStart(HELPER_INDEX_WIDTH, '0')}`
}

function buildHelperItem(
	originalItem: CodeClientTemplateItem,
	operations: AtomicOperation[],
	groupHash: string,
	index: number
): CodeClientTemplateItem {
	const functionName = buildHelperFunctionName(groupHash, index)
	return {
		templateName: functionName,
		displayName: `${originalItem.displayName ?? originalItem.templateName} - Data Part ${index + 1}`,
		description: 'Place every generated Data Part and the Init Rig template.',
		author: originalItem.author,
		version: originalItem.version,
		itemId: originalItem.itemId,
		template: {
			blocks: [buildHelperFunctionBlock(functionName), ...coalesceOperations(operations)],
		},
	}
}

function buildDispatcherItem(
	originalItem: CodeClientTemplateItem,
	targetFunctionNames: string[],
	groupHash: string,
	level: number,
	index: number
): CodeClientTemplateItem {
	const functionName = buildDispatcherFunctionName(groupHash, level, index)
	return {
		templateName: functionName,
		displayName:
			`${originalItem.displayName ?? originalItem.templateName} - ` +
			`Dispatcher ${level + 1}.${index + 1}`,
		description: 'Place every generated Data Part and the Init Rig template.',
		author: originalItem.author,
		version: originalItem.version,
		itemId: originalItem.itemId,
		template: {
			blocks: [
				buildHelperFunctionBlock(functionName),
				...targetFunctionNames.map(targetFunctionName =>
					buildHelperCallBlock(targetFunctionName, WORKING_PARAMETER_NAME)
				),
			],
		},
	}
}

function buildMainItem(
	originalItem: CodeClientTemplateItem,
	functionBlock: CodeBlock,
	targetFunctionNames: string[]
): CodeClientTemplateItem {
	return {
		...originalItem,
		template: {
			blocks: [
				functionBlock,
				...targetFunctionNames.map(targetFunctionName =>
					buildHelperCallBlock(targetFunctionName, ORCHESTRATOR_WORKING_VARIABLE_NAME)
				),
			],
		},
	}
}

async function getSizeResult(
	item: CodeClientTemplateItem,
	toBase64GZip: (input: string) => Promise<string>
): Promise<SizeResult> {
	try {
		const prepared = await prepareCodeClientTemplate(item, toBase64GZip)
		return { fits: true, encodedSizeBytes: prepared.encodedSizeBytes }
	} catch (error) {
		if (error instanceof CodeClientTemplateSizeError) {
			return { fits: false, encodedSizeBytes: error.encodedSizeBytes }
		}
		throw error
	}
}

async function buildDispatcherLayer(
	originalItem: CodeClientTemplateItem,
	targetFunctionNames: string[],
	groupHash: string,
	level: number,
	toBase64GZip: (input: string) => Promise<string>
) {
	const dispatchers: CodeClientTemplateItem[] = []
	let currentTargets: string[] = []

	for (const targetFunctionName of targetFunctionNames) {
		const dispatcherIndex = dispatchers.length
		const candidateTargets = [...currentTargets, targetFunctionName]
		const candidateItem = buildDispatcherItem(
			originalItem,
			candidateTargets,
			groupHash,
			level,
			dispatcherIndex
		)
		const candidateSize = await getSizeResult(candidateItem, toBase64GZip)
		if (candidateSize.fits) {
			currentTargets = candidateTargets
			continue
		}

		if (currentTargets.length === 0) {
			throw new DFTemplateSplitError(
				originalItem.templateName,
				candidateSize.encodedSizeBytes,
				CODECLIENT_TEMPLATE_SAFE_ENCODED_BYTES,
				'one generated helper call is indivisible.'
			)
		}

		dispatchers.push(
			buildDispatcherItem(originalItem, currentTargets, groupHash, level, dispatcherIndex)
		)
		currentTargets = [targetFunctionName]
	}

	if (currentTargets.length > 0) {
		dispatchers.push(
			buildDispatcherItem(originalItem, currentTargets, groupHash, level, dispatchers.length)
		)
	}
	return dispatchers
}

function describeAtomicOperation(operation: AtomicOperation) {
	const items = getBlockItems(operation.block)
	if (operation.block.action === 'SetDictValue') {
		return `the dictionary entry "${items[1]?.item.data?.name ?? 'unknown'}" is indivisible.`
	}
	const value = items[1]
	if (value?.item.id === 'txt' && items[2]?.item.id === 'txt') {
		return `the animation data for node "${value.item.data?.name ?? 'unknown'}" is indivisible.`
	}
	if (value?.item.id === 'item') {
		return 'one generated model/variant node item is indivisible.'
	}
	return 'one generated mutation is indivisible.'
}

export async function splitDFCodeTemplateItem(
	item: CodeClientTemplateItem,
	toBase64GZip: (input: string) => Promise<string>
): Promise<CodeClientTemplateItem[]> {
	let originalSizeError: CodeClientTemplateSizeError
	try {
		await prepareCodeClientTemplate(item, toBase64GZip)
		return [item]
	} catch (error) {
		if (!(error instanceof CodeClientTemplateSizeError)) throw error
		originalSizeError = error
	}

	if (item.codetemplateData || !item.template) throw originalSizeError
	const functionBlock = item.template.blocks[0]
	if (functionBlock?.block !== 'func') throw originalSizeError

	let operations: AtomicOperation[]
	try {
		operations = atomizeTemplateBody(item.template)
	} catch (error) {
		throw new DFTemplateSplitError(
			item.templateName,
			originalSizeError.encodedSizeBytes,
			CODECLIENT_TEMPLATE_SAFE_ENCODED_BYTES,
			error instanceof Error ? error.message : String(error)
		)
	}
	if (operations.length === 0) throw originalSizeError

	const groupHash = hashTemplateName(item.templateName)
	const operationChunks: AtomicOperation[][] = []
	let currentChunk: AtomicOperation[] = []

	for (const operation of operations) {
		const chunkIndex = operationChunks.length
		const candidateChunk = [...currentChunk, operation]
		const candidateItem = buildHelperItem(item, candidateChunk, groupHash, chunkIndex)
		const candidateSize = await getSizeResult(candidateItem, toBase64GZip)
		if (candidateSize.fits) {
			currentChunk = candidateChunk
			continue
		}

		if (currentChunk.length === 0) {
			throw new DFTemplateSplitError(
				item.templateName,
				candidateSize.encodedSizeBytes,
				CODECLIENT_TEMPLATE_SAFE_ENCODED_BYTES,
				describeAtomicOperation(operation)
			)
		}

		operationChunks.push(currentChunk)
		currentChunk = [operation]
		const singleOperationItem = buildHelperItem(
			item,
			currentChunk,
			groupHash,
			operationChunks.length
		)
		const singleOperationSize = await getSizeResult(singleOperationItem, toBase64GZip)
		if (!singleOperationSize.fits) {
			throw new DFTemplateSplitError(
				item.templateName,
				singleOperationSize.encodedSizeBytes,
				CODECLIENT_TEMPLATE_SAFE_ENCODED_BYTES,
				describeAtomicOperation(operation)
			)
		}
	}
	if (currentChunk.length > 0) operationChunks.push(currentChunk)

	const dataHelperItems = operationChunks.map((chunk, index) =>
		buildHelperItem(item, chunk, groupHash, index)
	)
	const allHelperItems = [...dataHelperItems]
	let targetFunctionNames = dataHelperItems.map(helper => helper.templateName)
	let mainItem = buildMainItem(item, functionBlock, targetFunctionNames)
	let mainSize = await getSizeResult(mainItem, toBase64GZip)
	let dispatcherLevel = 0
	while (!mainSize.fits && targetFunctionNames.length > 1) {
		const dispatcherItems = await buildDispatcherLayer(
			item,
			targetFunctionNames,
			groupHash,
			dispatcherLevel,
			toBase64GZip
		)
		if (dispatcherItems.length >= targetFunctionNames.length) break
		allHelperItems.push(...dispatcherItems)
		targetFunctionNames = dispatcherItems.map(dispatcher => dispatcher.templateName)
		mainItem = buildMainItem(item, functionBlock, targetFunctionNames)
		mainSize = await getSizeResult(mainItem, toBase64GZip)
		dispatcherLevel++
	}
	if (!mainSize.fits) {
		throw new DFTemplateSplitError(
			item.templateName,
			mainSize.encodedSizeBytes,
			CODECLIENT_TEMPLATE_SAFE_ENCODED_BYTES,
			'the public function header and its smallest helper-call orchestrator are indivisible.'
		)
	}

	const splitItems = [...allHelperItems, mainItem]
	const splitInfoBase = {
		groupName: item.templateName,
		partCount: splitItems.length,
	}
	for (let i = 0; i < splitItems.length; i++) {
		splitItems[i].splitInfo = { ...splitInfoBase, partIndex: i }
	}

	return splitItems
}
