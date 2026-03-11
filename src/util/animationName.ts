export const RESERVED_ANIMATION_NAMES = ['nodes', 'animations'] as const
export const ANIMATION_MODEL_PREFIX = 'animation.model.'

const RESERVED_ANIMATION_NAME_SET: ReadonlySet<string> = new Set(RESERVED_ANIMATION_NAMES)

export function normalizeAnimationName(name: string): string {
	const trimmed = name.trim()
	if (!trimmed) return ''

	if (trimmed.toLowerCase().startsWith(ANIMATION_MODEL_PREFIX)) {
		const withoutPrefix = trimmed.slice(ANIMATION_MODEL_PREFIX.length).trim()
		return withoutPrefix || 'animation'
	}

	return trimmed
}

export function isReservedAnimationName(name: string): boolean {
	return RESERVED_ANIMATION_NAME_SET.has(name.trim().toLowerCase())
}
