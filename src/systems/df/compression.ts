export class DFCompressionError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message)
		this.name = 'DFCompressionError'
	}
}

interface PakoApi {
	gzip: (input: unknown, options?: unknown) => Uint8Array | string
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

export async function textToGZip(input: string): Promise<string> {
	try {
		const pako = await getPakoApi()
		const uint8array = pako.gzip(input, { to: 'string' })
		return Buffer.from(uint8array).toString('base64')
	} catch (error) {
		throw new DFCompressionError('Failed to compress DF export payload.', error)
	}
}

