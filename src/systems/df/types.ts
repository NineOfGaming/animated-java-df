export interface CodeBlock {
	id: string
	block?: string
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
	[key: string]: unknown
}

export interface CodeTemplate {
	blocks: CodeBlock[]
}

export interface CodeClientTemplateItem {
	template?: CodeTemplate
	codetemplateData?: string
	templateName: string
	displayName?: string
	description?: string
	author?: string
	version?: number
	itemId?: string
	itemSnbt?: string
	customData?: Record<string, unknown>
	publicBukkitValues?: Record<string, string>
}
