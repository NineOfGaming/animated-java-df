import { PACKAGE } from 'src/constants'
import { translate } from './translation'

const RELEASES_API_URL =
	'https://api.github.com/repos/NineOfGaming/animated-java-df/releases/latest'
const IGNORED_VERSION_KEY = 'animated-java-ignored-update-version'
const CURRENT_RELEASE_VERSION = PACKAGE.fork_version ?? PACKAGE.version

interface GitHubRelease {
	tag_name?: string
	name?: string
	html_url?: string
}

function toVersionParts(version: string): number[] {
	const normalized = version.trim().replace(/^v/i, '').split('-')[0].split('+')[0]

	return normalized.split('.').map(part => {
		const parsed = Number.parseInt(part, 10)
		return Number.isNaN(parsed) ? 0 : parsed
	})
}

function compareVersions(a: string, b: string): number {
	const aParts = toVersionParts(a)
	const bParts = toVersionParts(b)
	for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
		const aPart = aParts[i] ?? 0
		const bPart = bParts[i] ?? 0
		if (aPart > bPart) return 1
		if (aPart < bPart) return -1
	}
	return 0
}

function extractReleaseVersion(release: GitHubRelease): string | undefined {
	const candidate = (release.tag_name ?? release.name ?? '').trim()
	if (!candidate) return undefined
	const matched = /\d+(?:\.\d+)*/.exec(candidate)
	return matched?.[0]
}

async function fetchLatestRelease() {
	const response = await fetch(RELEASES_API_URL, {
		headers: {
			Accept: 'application/vnd.github+json',
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch latest release (${response.status})`)
	}

	const release = (await response.json()) as GitHubRelease
	const latestVersion = extractReleaseVersion(release)
	if (!latestVersion) {
		throw new Error('Could not determine latest release version')
	}

	return {
		version: latestVersion,
		url: release.html_url ?? 'https://github.com/NineOfGaming/animated-java-df/releases/latest',
	}
}

function showUpdateAvailableMessage(latestVersion: string, releaseUrl: string) {
	const translatedMessage = translate(
		'update_checker.dialog.message',
		CURRENT_RELEASE_VERSION,
		latestVersion
	)

	Blockbench.showMessageBox(
		{
			title: translate('update_checker.dialog.title'),
			// Blockbench message boxes render HTML, so convert line breaks explicitly.
			message: translatedMessage.replace(/\r?\n/g, '<br>'),
			buttons: [
				translate('update_checker.dialog.button.download'),
				translate('update_checker.dialog.button.later'),
				translate('update_checker.dialog.button.skip_version'),
			],
		},
		result => {
			if (result === 0) {
				Blockbench.openLink(releaseUrl)
			}
			if (result === 2) {
				localStorage.setItem(IGNORED_VERSION_KEY, latestVersion)
				Blockbench.showQuickMessage(
					translate('update_checker.quick_message.ignored', latestVersion),
					2500
				)
			}
		}
	)
}

export async function checkForUpdates(options: { manual?: boolean } = {}): Promise<void> {
	const manual = options.manual ?? false
	try {
		const latestRelease = await fetchLatestRelease()
		const comparison = compareVersions(latestRelease.version, CURRENT_RELEASE_VERSION)
		const hasUpdate = comparison > 0

		if (!hasUpdate) {
			if (manual) {
				Blockbench.showQuickMessage(
					translate('update_checker.quick_message.up_to_date', CURRENT_RELEASE_VERSION),
					2500
				)
			}
			return
		}

		if (!manual) {
			const ignoredVersion = localStorage.getItem(IGNORED_VERSION_KEY)
			if (ignoredVersion === latestRelease.version) {
				return
			}
		}

		showUpdateAvailableMessage(latestRelease.version, latestRelease.url)
	} catch (error) {
		console.error('[Animated Java DF] Failed to check for updates:', error)
		if (manual) {
			Blockbench.showQuickMessage(translate('update_checker.quick_message.failed'), 2500)
		}
	}
}
