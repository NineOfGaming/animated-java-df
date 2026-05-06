import { describe, expect, it } from 'vitest'

import { compareVersions, extractVersion, isPrereleaseVersion } from '../util/version'

describe('version utilities', () => {
	it('extracts stable and prerelease versions from release labels', () => {
		expect(extractVersion('Animated Java DF v4.0.0-beta.6')).toBe('4.0.0-beta.6')
		expect(extractVersion('release-4.0.0')).toBe('4.0.0')
	})

	it('orders prerelease identifiers and numeric suffixes', () => {
		expect(compareVersions('4.0.0-beta', '4.0.0-alpha.9')).toBe(1)
		expect(compareVersions('4.0.0-beta.10', '4.0.0-beta.2')).toBe(1)
		expect(compareVersions('4.0.0-beta.1', '4.0.0-beta')).toBe(1)
	})

	it('treats the stable release as newer than prereleases for the same version', () => {
		expect(compareVersions('4.0.0', '4.0.0-beta.99')).toBe(1)
		expect(compareVersions('4.0.0-alpha.1', '4.0.0')).toBe(-1)
	})

	it('compares core versions before prerelease labels', () => {
		expect(compareVersions('4.0.1-alpha', '4.0.0')).toBe(1)
		expect(compareVersions('4.1.0-alpha', '4.0.9')).toBe(1)
	})

	it('detects prerelease versions', () => {
		expect(isPrereleaseVersion('v4.0.0-beta')).toBe(true)
		expect(isPrereleaseVersion('4.0.0')).toBe(false)
	})
})
