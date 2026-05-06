type VersionIdentifier = number | string

interface ParsedVersion {
	core: [number, number, number]
	prerelease: VersionIdentifier[]
}

const VERSION_PATTERN =
	/(?:^|[^0-9A-Za-z])v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z.-]+)?)(?=$|[^0-9A-Za-z.-])/i

function parseVersionIdentifier(identifier: string): VersionIdentifier {
	if (/^(0|[1-9]\d*)$/.test(identifier)) {
		return Number.parseInt(identifier, 10)
	}

	return identifier.toLowerCase()
}

function parseVersion(version: string): ParsedVersion | undefined {
	const normalized = extractVersion(version)
	if (!normalized) return undefined

	const buildIndex = normalized.indexOf('+')
	const withoutBuild = buildIndex === -1 ? normalized : normalized.slice(0, buildIndex)
	const prereleaseIndex = withoutBuild.indexOf('-')
	const coreVersion =
		prereleaseIndex === -1 ? withoutBuild : withoutBuild.slice(0, prereleaseIndex)
	const prereleaseVersion = prereleaseIndex === -1 ? '' : withoutBuild.slice(prereleaseIndex + 1)
	const coreParts = coreVersion.split('.').map(part => Number.parseInt(part, 10))

	if (coreParts.length !== 3 || coreParts.some(Number.isNaN)) {
		return undefined
	}

	return {
		core: [coreParts[0], coreParts[1], coreParts[2]],
		prerelease: prereleaseVersion
			? prereleaseVersion.split('.').map(parseVersionIdentifier)
			: [],
	}
}

function compareVersionIdentifiers(a: VersionIdentifier, b: VersionIdentifier): number {
	if (typeof a === 'number' && typeof b === 'number') {
		return Math.sign(a - b)
	}

	if (typeof a === 'number') return -1
	if (typeof b === 'number') return 1
	if (a > b) return 1
	if (a < b) return -1
	return 0
}

export function extractVersion(value: string): string | undefined {
	const matched = VERSION_PATTERN.exec(value.trim())
	return matched?.[1]
}

export function isPrereleaseVersion(version: string): boolean {
	return (parseVersion(version)?.prerelease.length ?? 0) > 0
}

export function compareVersions(a: string, b: string): number {
	const aVersion = parseVersion(a)
	const bVersion = parseVersion(b)

	if (!aVersion && !bVersion) return 0
	if (!aVersion) return -1
	if (!bVersion) return 1

	for (let i = 0; i < aVersion.core.length; i++) {
		const difference = aVersion.core[i] - bVersion.core[i]
		if (difference !== 0) return Math.sign(difference)
	}

	const aIsPrerelease = aVersion.prerelease.length > 0
	const bIsPrerelease = bVersion.prerelease.length > 0

	if (!aIsPrerelease && bIsPrerelease) return 1
	if (aIsPrerelease && !bIsPrerelease) return -1

	for (let i = 0; i < Math.max(aVersion.prerelease.length, bVersion.prerelease.length); i++) {
		const aIdentifier = aVersion.prerelease[i]
		const bIdentifier = bVersion.prerelease[i]

		if (aIdentifier === undefined) return -1
		if (bIdentifier === undefined) return 1

		const comparison = compareVersionIdentifiers(aIdentifier, bIdentifier)
		if (comparison !== 0) return comparison
	}

	return 0
}
