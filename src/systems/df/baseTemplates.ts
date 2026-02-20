import { sendTemplatesToCodeClient } from './codeclient'
import { textToGZip } from './compression'
import type { CodeBlock, CodeClientTemplateItem, CodeTemplate } from './types'

interface HelperFunctionItem {
	item: {
		id: string
		data: any
	}
	slot: number
}

export interface DFHelperTemplateDefinition {
	templateName: string
	displayName?: string
	functionName: string
	codetemplateData?: string
	author?: string
	version?: number
	itemId?: string
	itemSnbt?: string
	hidden?: boolean
	functionItems?: HelperFunctionItem[]
	extraBlocks?: CodeBlock[]
	customData?: Record<string, unknown>
	publicBukkitValues?: Record<string, string>
}

function createFunctionBlock(definition: DFHelperTemplateDefinition): CodeBlock {
	const items: HelperFunctionItem[] = [...(definition.functionItems ?? [])]

	if (definition.hidden !== false) {
		items.push({
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
		})
	}

	return {
		id: 'block',
		block: 'func',
		data: definition.functionName,
		args: {
			items,
		},
	}
}

export function buildHelperTemplate(
	definition: DFHelperTemplateDefinition
): CodeClientTemplateItem {
	const template: CodeTemplate | undefined = definition.codetemplateData
		? undefined
		: {
				blocks: [createFunctionBlock(definition), ...(definition.extraBlocks ?? [])],
		  }

	return {
		template,
		codetemplateData: definition.codetemplateData,
		templateName: definition.templateName,
		displayName: definition.displayName ?? definition.templateName,
		author: definition.author,
		version: definition.version,
		itemId: definition.itemId,
		itemSnbt: definition.itemSnbt,
		customData: definition.customData,
		publicBukkitValues: definition.publicBukkitValues,
	}
}

export const DF_BASE_HELPER_DEFINITIONS: DFHelperTemplateDefinition[] = [
	{
		templateName: 'MatrixDecoder',
		displayName: 'Matrix Decoder',
		functionName: 'MatrixDecoder',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §baj.MatrixDecoder","version":1,"code":"H4sIAAAAAAAA/+VZUW/bNhD+KxmLAFGjrLbjupmAPSxx0wZItqFN+zIHBkPRNleKFCgqcxb4v+8oybIsWbYUWUG3vTgWRd4dv/u+49F5Qvdckm8Bcv54QsxFTvyM7OSvgyahIPCI1RQmwRxNvWQ2fItGzKrowUYu1ng5C0afhpfjX89vnf7gXdcm0vOloEIHztMIeUxQovBEOyQMtPTGAnt0BGvpXCsM9onkUjkj9GowvHj3/qcRsjW8goEbrBWbHwwpkS5VI7S4s5nGnBGnc7+cA6MLcBgK7XRt5jpZfy5+5Gw602OXakq0NCbMdBRwqZHTWdi5vfliTHlmcyZSGHajANwoHEIDmKAfffPiASt48HmoMEfOBPOA2kj6mkmRDqz8dav6oyLydyX8UK+c6bmu4axX2RmnnknV71TFeK88ijDKNJ3gkOvxA+YhTa0l79ZtdQcRvKUxahVmQjytGiKZYWXiex+H2iDA0zrx9QvxzVjkPeW+m6jGrM8Qq/e2sPKejzWeZtbGTuHNpQnCbAleO+gqOPjIXJcKI0SSTHEfIXxG8lLNOBws7hZL2wj/+WOcyUQ4KIpmk+IDalBTu0UfT8qnBWSuaBBQ9/xRR7IIiIzywkGCW4W20V6O9iXGiioqx/bL7eXJWYrthaER1VlkPwNMYnorlxvIA/PMnN4Cj1K3n9lUUPeZXuPElqxsKa9JudtPUiuTpE5ed+B7jgM66MfsrwXv2sKW0FX4r/0gWy1Ne4T1w9/MN9jECa0FbG5pS9DeGyiy51hD6haOncoYb65vG07aEou9dfjmbSGmJfRT+6Hjbl531zd1zQJ9TcVUz1qTGvUwE+YEbLq5KjhVZEFVkhYbuHLhfspsNFZvOnJwExfBFPbDWsI9LM8Nm7x0aja2dJ1yhv3wcyZ6hcm36PB3mYLLAAyBV5HpJaXyyjdLpNBK8g27XfP4iepQia1eCZdxv1fFbTP+exHFLszl6L+ugGF8B0j5P2QPLIBXBfq/qUX/N62mhmwvu2uRXCiKNTU1szwkRX2Y1IgsV6DJ5idnJeLlxHoD6WM+pzUkm+y3VfWYlvC3ySS+NzSrVIdgcXZ0CM6OMmBbJ12rTQ29TCMRb+iruYF/R5xOOq79kLpG+/a9UzvZyvO43VAsRYJvE8tKMtlcGs28jkZzPbpllXP/uC0049+d9lQdsp+mQZofLRtruwjGCm/ruGtZ1smgbx03NdRLDL3u9s6aWztNrQ1Oz/rW9lK3+UfFTqfzf+oKKlTRSpLcQctcjfrFh/rjRq7rtK8vcATv6JJqlKddwP4bICn+L2IPyGw1lEMF7lR3i38AyffsRk0aAAA="}'`,
	},
]

export function buildDFBaseTemplateItems(): CodeClientTemplateItem[] {
	return DF_BASE_HELPER_DEFINITIONS.map(buildHelperTemplate)
}

export function getDFBaseTemplateDefinition(templateName: string) {
	return DF_BASE_HELPER_DEFINITIONS.find(definition => definition.templateName === templateName)
}

export function buildDFBaseTemplateItem(templateName: string): CodeClientTemplateItem {
	const definition = getDFBaseTemplateDefinition(templateName)
	if (!definition) {
		throw new Error(`Unknown DF base template "${templateName}".`)
	}
	return buildHelperTemplate(definition)
}

export async function sendDFBaseTemplatesToCodeClient() {
	const templates = buildDFBaseTemplateItems()
	await sendTemplatesToCodeClient(templates, textToGZip)
}

export async function sendDFBaseTemplateToCodeClient(templateName: string) {
	const template = buildDFBaseTemplateItem(templateName)
	await sendTemplatesToCodeClient([template], textToGZip)
}
