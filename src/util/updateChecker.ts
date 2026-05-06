import { PACKAGE } from '../constants'
import { localize as translate } from './lang'
import { compareVersions, extractVersion, isPrereleaseVersion } from './version'

const RELEASES_API_URL =
	'https://api.github.com/repos/NineOfGaming/animated-java-df/releases?per_page=100'
const IGNORED_VERSION_KEY = 'animated-java-ignored-update-version'
const CURRENT_RELEASE_VERSION = PACKAGE.fork_version ?? PACKAGE.version
const CHECK_PRERELEASES = isPrereleaseVersion(CURRENT_RELEASE_VERSION)

interface GitHubRelease {
	tag_name?: string
	name?: string
	html_url?: string
	prerelease?: boolean
	draft?: boolean
}

interface ReleaseInfo {
	version: string
	url: string
	prerelease: boolean
}

function extractReleaseVersion(release: GitHubRelease): string | undefined {
	for (const candidate of [release.tag_name, release.name]) {
		if (!candidate) continue

		const version = extractVersion(candidate)
		if (version) return version
	}

	return undefined
}

function getReleaseInfo(release: GitHubRelease): ReleaseInfo | undefined {
	if (release.draft) return undefined

	const version = extractReleaseVersion(release)
	if (!version) return undefined

	const prerelease = release.prerelease === true || isPrereleaseVersion(version)
	if (prerelease && !CHECK_PRERELEASES) return undefined

	return {
		version,
		url: release.html_url ?? 'https://github.com/NineOfGaming/animated-java-df/releases/latest',
		prerelease,
	}
}

function pickLatestRelease(releases: GitHubRelease[]): ReleaseInfo | undefined {
	return releases.reduce<ReleaseInfo | undefined>((latestRelease, release) => {
		const releaseInfo = getReleaseInfo(release)
		if (!releaseInfo) return latestRelease

		if (!latestRelease || compareVersions(releaseInfo.version, latestRelease.version) > 0) {
			return releaseInfo
		}

		return latestRelease
	}, undefined)
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

	const releases = (await response.json()) as GitHubRelease[]
	if (!Array.isArray(releases)) {
		throw new Error('Could not determine latest release version')
	}

	return pickLatestRelease(releases)
}

function showUpdateAvailableMessage(
	latestVersion: string,
	releaseUrl: string,
	prerelease: boolean
) {
	let translatedMessage = translate(
		'update_checker.dialog.message',
		CURRENT_RELEASE_VERSION,
		latestVersion
	)

	if (prerelease) {
		translatedMessage += `\n\n${translate('update_checker.dialog.prerelease_note')}`
	}

	Blockbench.showMessageBox(
		{
			title: translate('update_checker.dialog.title'),
			message: translatedMessage.replace(/\r?\n/g, '<br>'),
			cancel: 1,
			cancelIndex: 1,
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
		if (!latestRelease) {
			if (manual) {
				Blockbench.showQuickMessage(
					translate('update_checker.quick_message.up_to_date', CURRENT_RELEASE_VERSION),
					2500
				)
			}
			return
		}

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

		showUpdateAvailableMessage(
			latestRelease.version,
			latestRelease.url,
			latestRelease.prerelease
		)
	} catch (error) {
		console.error('[Animated Java DF] Failed to check for updates:', error)
		if (manual) {
			Blockbench.showQuickMessage(translate('update_checker.quick_message.failed'), 2500)
		}
	}
}
