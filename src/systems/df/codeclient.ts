import type { CodeClientTemplateItem } from './types'

// https://github.com/DFOnline/CodeClient/wiki/API

const CODECLIENT_API_URL = 'ws://localhost:31375'
const CODECLIENT_GIVE_RESPONSE_TIMEOUT_MS = 5_000

function escapeSnbtString(value: string) {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
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
	giveResponseTimeoutMs?: number
}

export class CodeClientSocket {
	private socket: WebSocket | undefined
	private connecting: Promise<WebSocket> | undefined
	private sendQueue: Promise<void> = Promise.resolve()
	private readonly url: string
	private readonly giveResponseTimeoutMs: number

	constructor(options: CodeClientSocketOptions = {}) {
		this.url = options.url ?? CODECLIENT_API_URL
		this.giveResponseTimeoutMs =
			options.giveResponseTimeoutMs ?? CODECLIENT_GIVE_RESPONSE_TIMEOUT_MS
	}

	async sendGiveCommand(giveCommand: string): Promise<void> {
		const sendTask = this.sendQueue.then(() => this.sendGiveCommandInternal(giveCommand))
		this.sendQueue = sendTask.catch(() => undefined)
		return sendTask
	}

	async sendGiveCommands(giveCommands: string[]): Promise<void> {
		for (const command of giveCommands) {
			await this.sendGiveCommand(command)
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

	private async sendGiveCommandInternal(giveCommand: string): Promise<void> {
		const socket = await this.getSocket()
		await new Promise<void>((resolve, reject) => {
			let hasSettled = false
			let responseTimeout: ReturnType<typeof setTimeout> | undefined

			const cleanup = () => {
				if (responseTimeout) clearTimeout(responseTimeout)
				responseTimeout = undefined
				socket.removeEventListener('message', onMessage)
				socket.removeEventListener('close', onClose)
				socket.removeEventListener('error', onError)
			}

			const fail = (message: string, error?: unknown) => {
				if (hasSettled) return
				hasSettled = true
				cleanup()
				reject(new CodeClientError(message, error))
			}

			const resolveSuccess = () => {
				if (hasSettled) return
				hasSettled = true
				cleanup()
				resolve()
			}

			const onMessage = (event: MessageEvent) => {
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
			}

			const onClose = () => {
				resolveSuccess()
			}

			const onError = (error: Event) => {
				fail(
					'Failed to connect to CodeClient API. Enable the API in CodeClient settings and make sure CodeClient is running.',
					error
				)
			}

			socket.addEventListener('message', onMessage)
			socket.addEventListener('close', onClose)
			socket.addEventListener('error', onError)

			try {
				socket.send(giveCommand)
			} catch (error) {
				fail(
					'Failed to send command to CodeClient API. Ensure the CodeClient API connection is open.',
					error
				)
				return
			}

			responseTimeout = setTimeout(resolveSuccess, this.giveResponseTimeoutMs)
		})
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

	return (
		'give ' +
		`{count:1,id:"${itemId}",components:{"minecraft:custom_name":[{"text":"${displayName}","color":"#6DC7E9","italic":false}],"minecraft:custom_data":${serializedCustomData}}}`
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
