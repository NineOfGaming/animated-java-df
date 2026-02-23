import type { CodeClientTemplateItem } from './types'

// https://github.com/DFOnline/CodeClient/wiki/API

const CODECLIENT_API_URL = 'ws://localhost:31375'

function escapeSnbtString(value: string) {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function buildLoreComponent(description?: string) {
	if (!description) return ''
	const lines = description
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(line => line.length > 0)
	if (lines.length === 0) return ''

	const loreEntries = lines
		.map(line => `{"text":"${escapeSnbtString(line)}","color":"gray","italic":false}`)
		.join(',')

	return `,"minecraft:lore":[${loreEntries}]`
}

function normalizeCodeTemplateData(value: string) {
	let normalized = value.trim()
	if (
		(normalized.startsWith("'") && normalized.endsWith("'")) ||
		(normalized.startsWith('"') && normalized.endsWith('"'))
	) {
		normalized = normalized.slice(1, -1).trim()
	}
	return normalized
}

function parseAndNormalizeCodeTemplateData(value: string) {
	const normalized = normalizeCodeTemplateData(value)
	let parsed: unknown
	try {
		parsed = JSON.parse(normalized)
	} catch {
		throw new CodeClientError(
			'Invalid codetemplateData. Expected JSON object like {"author":"...","name":"...","version":1,"code":"..."}'
		)
	}

	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed)
		} catch {
			throw new CodeClientError(
				'Invalid codetemplateData JSON string. Expected nested JSON object payload.'
			)
		}
	}

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new CodeClientError(
			'Invalid codetemplateData. Expected a JSON object with author/name/version/code.'
		)
	}

	return JSON.stringify(parsed)
}

export class CodeClientError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message)
		this.name = 'CodeClientError'
	}
}

interface CodeClientSocketOptions {
	url?: string
	postSendResponseWindowMs?: number
}

export class CodeClientSocket {
	private socket: WebSocket | undefined
	private connecting: Promise<WebSocket> | undefined
	private readonly url: string
	private readonly postSendResponseWindowMs: number

	constructor(options: CodeClientSocketOptions = {}) {
		this.url = options.url ?? CODECLIENT_API_URL
		this.postSendResponseWindowMs = options.postSendResponseWindowMs ?? 1500
	}

	async sendGiveCommand(giveCommand: string): Promise<void> {
		await this.sendGiveCommands([giveCommand])
	}

	async sendGiveCommands(giveCommands: string[]): Promise<void> {
		const socket = await this.getSocket()
		const errors: string[] = []
		const parseTasks: Array<Promise<void>> = []
		const onMessage = (event: MessageEvent) => {
			parseTasks.push(
				this.extractMessageTexts(event.data).then(messages => {
					for (const message of messages) {
						const normalized = message.trim().toLowerCase()

						if (
							normalized.includes('not creative mode') ||
							(normalized.includes('creative mode') &&
								(normalized.includes('not ') || normalized.includes('must be')))
						) {
							errors.push(
								'CodeClient rejected the `give` command because you are not in creative mode.'
							)
							continue
						}

						if (normalized.includes('unauthed')) {
							errors.push(
								'CodeClient rejected the `give` command due to insufficient API scopes (received `unauthed`).'
							)
							continue
						}

						if (normalized.includes('invalid nbt')) {
							errors.push(
								'CodeClient rejected the `give` command due to invalid NBT data.'
							)
						}
					}
				})
			)
		}

		socket.addEventListener('message', onMessage)
		for (const command of giveCommands) {
			try {
				socket.send(command)
			} catch (error) {
				socket.removeEventListener('message', onMessage)
				throw new CodeClientError(
					'Failed to send command to CodeClient API. Ensure the CodeClient API connection is open.',
					error
				)
			}
		}

		await new Promise(resolve => setTimeout(resolve, this.postSendResponseWindowMs))
		socket.removeEventListener('message', onMessage)
		await Promise.allSettled(parseTasks)

		if (errors.length > 0) {
			throw new CodeClientError(errors[0])
		}
	}

	close() {
		if (!this.socket) return
		try {
			this.socket.close()
		} catch {
			// no-op
		}
		this.socket = undefined
		this.connecting = undefined
	}

	private async getSocket(): Promise<WebSocket> {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			return this.socket
		}

		if (this.connecting) {
			return this.connecting
		}

		this.connecting = new Promise<WebSocket>((resolve, reject) => {
			const socket = new WebSocket(this.url)

			const onOpen = () => {
				cleanup()
				this.socket = socket
				socket.addEventListener('close', () => {
					if (this.socket === socket) {
						this.socket = undefined
					}
				})
				resolve(socket)
			}

			const onError = (error: Event) => {
				cleanup()
				try {
					socket.close()
				} catch {
					// no-op
				}
				reject(
					new CodeClientError(
						'Failed to connect to CodeClient API. Enable the API in CodeClient settings and make sure CodeClient is running.',
						error
					)
				)
			}

			const onClose = () => {
				cleanup()
				reject(
					new CodeClientError(
						'CodeClient API connection closed before it could be established.'
					)
				)
			}

			const cleanup = () => {
				socket.removeEventListener('open', onOpen)
				socket.removeEventListener('error', onError)
				socket.removeEventListener('close', onClose)
			}

			socket.addEventListener('open', onOpen)
			socket.addEventListener('error', onError)
			socket.addEventListener('close', onClose)
		}).finally(() => {
			this.connecting = undefined
		})

		return this.connecting
	}

	private async extractMessageTexts(data: unknown): Promise<string[]> {
		let rawText: string | undefined
		if (typeof data === 'string') {
			rawText = data
		} else if (data instanceof Blob) {
			rawText = await data.text()
		} else if (data instanceof ArrayBuffer) {
			rawText = new TextDecoder().decode(data)
		} else if (ArrayBuffer.isView(data)) {
			rawText = new TextDecoder().decode(data)
		}

		if (!rawText) return []
		return this.expandPotentialJsonMessages(rawText)
	}

	private expandPotentialJsonMessages(rawText: string): string[] {
		const messages = [rawText]
		try {
			const parsed: unknown = JSON.parse(rawText)
			const extracted: string[] = []
			this.collectNestedStrings(parsed, extracted)
			for (const text of extracted) {
				messages.push(text)
			}
		} catch {
			// no-op, payload was plain text
		}
		return messages
	}

	private collectNestedStrings(value: unknown, output: string[]) {
		if (typeof value === 'string') {
			output.push(value)
			return
		}
		if (!value || typeof value !== 'object') return
		if (Array.isArray(value)) {
			for (const item of value) {
				this.collectNestedStrings(item, output)
			}
			return
		}
		for (const child of Object.values(value)) {
			this.collectNestedStrings(child, output)
		}
	}
}

const DEFAULT_CODECLIENT_SOCKET = new CodeClientSocket()

export async function buildCodeClientGiveCommand(
	item: CodeClientTemplateItem,
	toBase64GZip: (input: string) => Promise<string>
) {
	const templateName = item.templateName
	const displayName = escapeSnbtString(item.displayName ?? templateName)
	const itemId = item.itemId ?? 'minecraft:ender_chest'

	let templatePayload: string
	if (item.codetemplateData) {
		const normalizedPayload = parseAndNormalizeCodeTemplateData(item.codetemplateData)
		templatePayload = normalizedPayload
	} else {
		if (!item.template) {
			throw new CodeClientError(
				'Template item requires either `template` or `codetemplateData`.'
			)
		}

		const zippedTemplate = await toBase64GZip(JSON.stringify(item.template))
		const author = item.author ?? 'Animated Java'
		const version = item.version ?? 1
		const generatedPayload = JSON.stringify({
			author,
			name: templateName,
			...(item.description ? { description: item.description } : {}),
			version,
			code: zippedTemplate,
		})
		templatePayload = generatedPayload
	}

	if (item.itemSnbt) {
		const escapedTemplatePayload = escapeSnbtString(templatePayload)
		return `give ${item.itemSnbt.replaceAll(
			'{{CODETEMPLATE_PAYLOAD}}',
			escapedTemplatePayload
		)}`
	}

	const publicBukkitValues = {
		...(item.publicBukkitValues ?? {}),
		'hypercube:codetemplatedata': templatePayload,
	}
	const customData = {
		...(item.customData ?? {}),
		PublicBukkitValues: publicBukkitValues,
	}
	const serializedCustomData = JSON.stringify(customData)
	const loreComponent = buildLoreComponent(item.description)

	return (
		'give ' +
		`{count:1,id:"${itemId}",components:{"minecraft:custom_name":[{"text":"${displayName}","color":"#6DC7E9","italic":false}]${loreComponent},"minecraft:custom_data":${serializedCustomData}}}`
	)
}

export async function sendTemplatesToCodeClient(
	templates: CodeClientTemplateItem[],
	toBase64GZip: (input: string) => Promise<string>
) {
	const commands: string[] = []
	for (const item of templates) {
		commands.push(await buildCodeClientGiveCommand(item, toBase64GZip))
	}
	await DEFAULT_CODECLIENT_SOCKET.sendGiveCommands(commands)
}
