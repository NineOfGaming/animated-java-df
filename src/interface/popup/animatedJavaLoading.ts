import { mountSvelteComponent } from 'src/util/mountSvelteComponent'
import { SvelteComponentDev } from 'svelte/internal'
import AnimatedJavaLoadingPopup from '../../components/animatedJavaLoadingPopup.svelte'
import { Valuable } from '../../util/stores'

const LOADED = new Valuable(false)
const OFFLINE = new Valuable(false)
const PROGRESS = new Valuable(0)
const PROGRESS_LABEL = new Valuable('')

let mountedPopup: SvelteComponentDev | undefined

export function showLoadingPopup() {
	if (mountedPopup) return
	LOADED.set(false)
	OFFLINE.set(false)
	PROGRESS.set(0)
	PROGRESS_LABEL.set('')
	mountedPopup = mountSvelteComponent({
		component: AnimatedJavaLoadingPopup,
		props: {
			loaded: LOADED,
			offline: OFFLINE,
			progress: PROGRESS,
			progressLabel: PROGRESS_LABEL,
		},
		target: document.body,
	})
}

export function hideLoadingPopup() {
	if (!mountedPopup) return
	LOADED.set(true)
	setTimeout(() => {
		dismissLoadingPopup()
	}, 2000)
}

export function showOfflineError() {
	if (!mountedPopup) return
	OFFLINE.set(true)
	// FIXME - Change this into a X button instead of a timeout.
	setTimeout(() => {
		dismissLoadingPopup()
	}, 10000)
}

export function dismissLoadingPopup() {
	if (!mountedPopup) return
	mountedPopup.$destroy()
	mountedPopup = undefined
}

export function updateLoadingProgress(progress: number) {
	PROGRESS.set(progress)
}

export function updateLoadingProgressLabel(label: string) {
	PROGRESS_LABEL.set(label)
}
