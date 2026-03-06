import { sendTemplatesToCodeClient } from './codeclient'
import { textToGZip } from './compression'
import type { CodeBlock, CodeClientTemplateItem, CodeTemplate } from './types'

interface HelperFunctionItem {
	item: {
		id: string
		data: any
	}
	slot: number
}

export interface DFHelperTemplateDefinition {
	templateName: string
	displayName?: string
	description?: string
	functionName: string
	codetemplateData?: string
	author?: string
	version?: number
	itemId?: string
	itemSnbt?: string
	hidden?: boolean
	functionItems?: HelperFunctionItem[]
	extraBlocks?: CodeBlock[]
	customData?: Record<string, unknown>
	publicBukkitValues?: Record<string, string>
}

function createFunctionBlock(definition: DFHelperTemplateDefinition): CodeBlock {
	const items: HelperFunctionItem[] = [...(definition.functionItems ?? [])]

	if (definition.hidden !== false) {
		items.push({
			item: {
				id: 'bl_tag',
				data: {
					option: 'False',
					tag: 'Is Hidden',
					action: 'dynamic',
					block: 'func',
				},
			},
			slot: 26,
		})
	}

	return {
		id: 'block',
		block: 'func',
		data: definition.functionName,
		args: {
			items,
		},
	}
}

export function buildHelperTemplate(
	definition: DFHelperTemplateDefinition
): CodeClientTemplateItem {
	const template: CodeTemplate | undefined = definition.codetemplateData
		? undefined
		: {
				blocks: [createFunctionBlock(definition), ...(definition.extraBlocks ?? [])],
		  }

	return {
		template,
		codetemplateData: definition.codetemplateData,
		templateName: definition.templateName,
		displayName: definition.displayName ?? definition.templateName,
		description: definition.description,
		author: definition.author,
		version: definition.version,
		itemId: definition.itemId,
		itemSnbt: definition.itemSnbt,
		customData: definition.customData,
		publicBukkitValues: definition.publicBukkitValues,
	}
}

export const DF_BASE_HELPER_DEFINITIONS: DFHelperTemplateDefinition[] = [
	{
		templateName: 'RigInitRig',
		displayName: 'Init Rig',
		functionName: 'RigInitRig',
		description: 'Initializes the specified rig and its animations.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rig","version":1,"code":"H4sIAAAAAAAA/81WbU/bMBD+K5EnJDJlHa020CLtA+NlQ2LTNKF9oShybSexcOzIdoCuyn/fOWlL2rRZS2HiU2L7fPfcc89dMkEjocitQeH1BHGKwnqNgukzRHEhCSyxTsAIbCzLptbwVu24W9UiQBRbPLOC3cnpefTjy1X44fCoHxCV5UoyaU04GaKMS0Y0jm1ICmNVFkmcsSHcZQ9WY/BPlFA6HKI3h6cnR2efhiiwcAQbF5Jb7xdPhqi8CbjFgpPwYDQ7hd2g6R2cOLfXk5ES1NnN/N6nABK8LsdLNB4vBuMQ4g8znk2ZZ3JGeMwZ9TRPPCypx62BJ8+w5Uqa3hIqNYoLQ7BlVWxjNb9lNtWqSNIF0EEhKdMCYDvD8qYEnIW0YT/gNGzmYySPY6YjljgCUFkGyAhlUXhQBks1yWXERKMojmFXKgp7dpy7d/tgYZGLQmOBwhgLwwKkcpfKfOMxRL8VIuXSNstOp4JxDhrYBh9bN0cisjhp3K2jwsm5C+ogwnGILoz3jVPKpNMgmZrQMeTCybJKGwEPHYVT3whK1eNQyB68oArJKqETLES0mdrvsG7z6qLswck+p35PKsoM2BiiKqILafAdo531Wul1Lq2GMycT1CzLqlxnUNYnbJiN6pjPkm7E6b8ydjjnRTzRDPrikhu7HqJmORg9EaEDtZ61DfnfsqrtFlkv9CtdPOr8WAh17zk2vJMUy6SKM+fqXOkzTNI2My3Jt648cqsxgeHjkHDNCFwBKFVfTYfBzOXL6MVx16tmz24F6a5qm/96xLVnYIO5ReK+MnsBDq5wx6z4/62zMTedHPcXUz3OQQD0NxYgxC6dEKHqkbyZUHbqWjfwqp+BnZVSecohGZxspZinzuHBygY8k1aPX00XLkjP5VSv5qT7PcFkYtPn+nQ9hX9ZZG1n/fVE/1S5m5vLMn5W3lqsvKwkF/JzyV3W8V+m5fg2ea2szh70RrpfSalmyn8/8Ndn9L0Qlueie+i8rrbY4/CD/rDfLGDQyJr7bwfv+r6/Zd+s/DhtEMrvIPfzTqN84xs35V+YPmC9PA4AAA=="}'`,
	},
	{
		templateName: 'RigInitRigs',
		displayName: 'Init Rigs',
		functionName: 'RigInitRigs',
		description: 'Initializes all specified rigs and their animations.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rigs","version":1,"code":"H4sIAAAAAAAA/51UTW/bMAz9K4Z2NYJlGFJMt61tsALDDkNvTWAoEm0TlSVDottmgf/7KCdZnKTpPi62+fkeH5lsxMp6/RiFfNgINEJubZHv3lKUndNsqlBxEucQNLts/ho8qWowcmEUqX0Wezc38+L7l3v5cXY1zbVvWu/AUZSbhWjQgQ6qJKm7SL4pnGpgwbXwQkFxf+2tD3Ih3s1urq9uPy1EThxix51Dyn5gFReiX+ZIyqKW71f7MHvzcXtwulaOGgYuKov89E8QApqExmXjXEZM3ofNyluTgnsSzzVPxBROyVVBrY+ZIdP5CTFT1maxBY0lgskC082UMxnVgIG/sFGE3sXJyRB+VXZRK4IBPlLAR6A6+K6qj2bMO2cg8DhDYr/smWrnSE5zNHI8UnRYlhAKqCqGEn2fi2g98eh9frLD1hVgR0tMG0mrNZGdtG6TQS/ERmu7oKyQFDrIhW/TKMkulY1wgJieQaxsQaoaYWxrOTJPpQmHw1LcxewrGgMuXZ7epZg1M0J9epsHvA+zJMSut2DNJ8gbmSTxxUDltfsO0IKiP1/4kwqvacO+qP2gTdrGmwJfaBEv9/gXBe95Gb8F/Gytf86+YaTsms+/gjhWcu7DrdL1uQpnWp6VHHQMSvNtJiYYQHMJUxkWtjuVfctLwmv+iRR/9+/yH9pfOIQ3+Wvrtzd4PMCy/wWUJNDdJgUAAA=="}'`,
	},
	{
		templateName: 'RigSpawn',
		displayName: 'Spawn',
		functionName: 'RigSpawn',
		description: 'Spawns an instance of the rig at the specified location.\nYou can create an animation called "default"\nwhich will have its first frame used for the spawn pose.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.spawn","version":1,"code":"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"}'`,
	},
	{
		templateName: 'RigAnimate',
		displayName: 'Animate',
		functionName: 'RigAnimate',
		description: 'Sets the rig to the specified ticks pose.\nResets the selection.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate","version":1,"code":"H4sIAAAAAAAA/61Vy27bMBD8FYG9Ckadug6qW1onaA7tIc0tNgSaXMlsKFIgV2kMw//epR6JbEuF0/Zik8vlzCz3oR1baysePUsedkxJljR7Frf/CcsqI2jLXU5O5INQtN60qi3hVr2JmeTIOy+y7hY36ffP98lsfjmNhS1Ka8CgT3ZLVigDwvEME1F5tEVqeAFLugvP6DjhC6utS5bs3Xzx5fL605LFSEdkuDKq4AjRncqXbL+KFXKtRPJ+3TmQNe4TgBEbbrAg6jTXin7tEzinZOCja31f4gzWh93aahkOOxm/NhQTiTiWlzu+fdX2A9BHuIHIqTxCWy99CUJlCmSEil46Kq2HyZFyu84qLyiqmtOjU4+AG2erfHMQWFwZCY5iqB338V/KvAPfCfWgQaCy5j9JWu1JS2UwuYiVTPpP643KMnAp5CFvbL+PmdcWKQUUx2E1lSYF3SunUBuhyCTZcFuGNTdb2pS6clyzJOPaQ8xsGSLpGSR44VRtpTvXBhVuo9tFj3x6LnlhZW1u+fEZ38z/LUAc0l+cS8+p6v+NvekbWh8q+HCuAnylN1XxZvp7VUCkTNMEPf7Z2dk3CK48FiEh45XG9InrCl4g2rNDgGnNOqoaXXUi+rbmtLp5twH1H0/Ub0hnfxLKdobWiL3En95c6xR53rtrOxk3QWuInI5JlI++KinBhLEsWhe5pSiVOB7cPcJ56M0Wm9F8mvBmkLJayNDoF1zr9Lz5/8TdSL96Yet0hQnxx6YfhOi6bgTltHsHUdrmGQE57cFBEBxHOO2h4ffoKngEZjaSoYmhrxJN7PFMNVM8teufA6kKoC91ctcArfa/AafXpSb6BwAA"}'`,
	},
	{
		templateName: 'RigAnimateNoReset',
		displayName: 'Animate No Reset',
		functionName: 'RigAnimateNoReset',
		description: 'Sets the rig to the specified ticks pose.\nDoes not reset the selection.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate.noreset","version":1,"code":"H4sIAAAAAAAA/8VWUW/bOAz+K4YPBRacETS7rcMZuIde094GbB2w5m0pDEVmHN1kyZDorkGQ/z5Kjhs7cdIk67CXRKYk8uMnfpQW4URq/s2G8ddFKNIwrr7DaPUfh9NScfpkJqNFtAYhX62mkbe4Xf4jClOGrF5F1sXwJrn9dxS/uXg3iLjOC61AoY0X4zAXCrhhU4x5aVHniWI5jGkvPKJh5J9rqU08Dv+4GF69u/57HEZIU2S4VCJnCMEXkQW3OvgCFnAcLu8jgUwKHp9P6pVkjZqRQPEZU5gThiSTgn71AxgjUheYtjXXUnBn/bqYaJm6yRrP9xklR2g2cWaGzdcg7wBtgDMIDKFE7Ye2AC6mAtIABVEeFNpCfwO5nkxLyyk9H9OiEd8AZ0aX2ayVWFSqFAzl4BcuoxNhDjXYQGkMjGOxQgkSOAqtXgja/ZIwlQrj15FI4ybFVonpFEwCWUahwuUyCq3USEdB+bTLq1AJyEZ9uWJxVZeSDeeFGzM1p49ClobJMJ4yaSEKdeEyaRhSsNwIb6U91woFzoMPw0bwwaHBc5168yo+PuLR8T85F+3wrw8Nz0gGPxe9EhKN2wj+OhQBrsOrMj86/EjkEAhViaER/83Bp68QTLEJIoUpKyUmD0yW8ORiNdd2MPBRd6JGU26B/uBjalnx1oH+7Rb6iUyQZY3ounZ24yI6/DRNrm3wXqQpKNdt+WpJOiesgm/240a9XDiFrXyH1G36rOqPfaW9qEMPqKuzGyiA4fO9/YGZbe4UlS5ZLdeeeyf3vQrudOLgntHMK6+lXt85TURqG45LZdkDpHsFupvhER3hE8GXUurvwUdhMbiieyAD22T6Rptrxmfb/GxxvbVlzbBhnJqiQyIMdVEyURZqXaK1y11HwpmUyWE3biehnkzHYu+nz6Zubzu8bJ9Cp5dVl9rhZLvZnVBr2/2qU+xnJIrZK08Q9s78/2b5ObCVwY16fQkqw1nvz0Gv1Z429CY1SxNW99K9xcClrgR/WDVUV3GiJ/8/Xw7VBdB1hiSo40/f36w7j76lAn+JCrBXWvlN5eSynnrP7JV/3Y1IgC+S5imler6hWiGphzu0wltOgQz+4ZCsfJ6o1bIUafAiffRZrbYI+A9wnaJrjiYDV5139cvvF1akV1f185R+r7c3404/53tbUWcDOG81niNK4h+XK9J7d1Kic3T7efQLGZLM4vF8PMvr4GQRHJH8kbL4jfnfna6Bl9D+09P1sJY1FLZovTx/A+RNco8CL9n8E6MietwB/H75A6N9wgWJEAAA"}'`,
	},
	{
		templateName: 'RigRemove',
		displayName: 'Remove',
		functionName: 'RigRemove',
		description: 'Removes the rig instance.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.remove","version":1,"code":"H4sIAAAAAAAA/51TTW/UMBD9K5G5WhWL0Fb4Brut2guH0lu3ihx7kpg69sqelK6i/HfG3ixkUwoSlyTz+d68mQyssl49RSYeBmY0E0eb8ektWN07RaYMDSVRDkI3ZdNX9qSqbHCmJcpTFnmH7XX59cu9+Li+XHHlu7134DCKYcc640AFWaNQfUTflU52sKNaeMEgqb/y1gexY+/W283l1acd40ghctxB55+huDPNjo2P3KC0Ron31SlOXj7vD0610mFHyGVjDT2pPASjExyVzXMJMnkfhspbnYInFj9aGok4LNk1QR6W1GKBLRTBNIVxEaVTcLFg6qu6j0oiZIyIwTwBtsH3TXs2CO+dhkCcc+L4OBKf3qFYcaPFnHd0pq4hlNAkUdg4chatR5pv5ItN7V0JdraqpHtaoCYfHvbpG1+QjL3tg7RM1NJG4Mzv0Xg3c2iIKpjspZorhwYPxe12Br56BV7ZEmUzQ/en+uvUNFGgsGC3sbgxWoNLl6emFH0grkYtb/M33od1kmjqzWgBFyEvhGUefzruCBYUHUT1/d8nflRlIVvnNdiS4n+T/FmGNwSPymfF04rPhEtz/Bo8a2sgbrzLRX31+RS6kXGT/5970u3NMSEvp5wavp70DO14xHkVoQFiw75llVL0/4RctI/UlAb8CXXZKUx7BAAA"}'`
	},
	{
		templateName: 'RigLoadAnimation',
		displayName: 'Load Animation',
		functionName: 'RigLoadAnimation',
		description: 'Loads the pose of the specified node for the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.load_animation","version":1,"code":"H4sIAAAAAAAA/7VV30/bMBD+VyJPk4YUVSswEHnbBmxIwF4QLxRFrn1JLRw7ss8dqOr/vnPalDTAyEB7SXLnO3/f/cyCTbUVd55lNwumJMtWMkvX74wVwQgSuSvJiGwQqrU1fTWa6NUIKZMceWtF2sXxaX757SrbPzgcp8JWtTVg0GeLCauUAeF4gZkIHm2VG17BhHzhHh2n+4XV1mUT9uHg+PvhydGEpUhHpDi3XCZfjao4KmsmbHmbKuRaiezztLUhbdrFACNm3GBF6HmpFT3tHJxTMkKSW9eWYKP2ZjG1WsbDlsnvGYVFPPoMS8cftun5BGeQ1NZDYovm29cgVKFAJsZKSArrVmrQIJC0vI1n1AvITovgBSebKHl06g5w5mwoZ1vxpsFIcBRaY7i8XRLtYDDbS5XMuuF5o4oCXA5lSVBsuUyZ1xYpDcu0V9Ta5KA7VY0lIrUDHzSSHh/qKM+5I6HWwXHNsoJrDymzdYxmo3iEGQ+FqShR+hEF7/FVFLoDvHCq0ZLPRbwiOTvuRLk7FD5W5H3omx7dZrA3lEHslH9j8AiyPxSkcPG9QTGhGWMoOJU4n3MdYHPD+mzbf9xE9iItdKHD6ssTVjOaxe7ekOuN06SwU7WnnlOdIy87vrbN+2kkEUOi44yd+eSnkhJMXGJibSIfiL4S/TXXATyII7S+mzlVjjTNdb4ZU9bweW5fqiJfDcQrG3Nl1B8tAvpIJ5+a5t8ZiZUUYXdWn7EpdsjRC9sULBjP5yC35jgy34R6zd3JvfLoIyWk/TENGB0vf111gnBc0F6JhJSjjUQqut50+sK66uWYBdc6H/aj+I9h9ztkEFTEeAPauN8eEgQ5XXBKsAD/18wKbT0MTa0HfE8/tau6jST+IN6ftLfU5+nefxaq3UcvEN7dbu4fgOfU29fNnqKjPzG7kTPPCAAA"}'`,
	},
	{
		templateName: 'RigDecodeMatrices',
		displayName: 'Decode Matrices',
		functionName: 'RigDecodeMatrices',
		description: 'Decodes the matrices of the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.decodeMatrices","version":1,"code":"H4sIAAAAAAAA/81YTW/bOBD9KwKLAnGrtNZHZEe3TbLZFujuYZvdSx0YtERLRCRSoKg2qeH/vkNZcWQ5pmlXBvaShNSQ8+a94QyZBZplPHooUfhtgWiMwtUY2c3vEM0rFsEQiwSMwEaSvLGGv+oZtaoe2CjGEj9bwezi5nb619Vd6Acjx454XnBGmCzDxQTllJFI4LkMo6qUPJ8ynJMJrCWPUmDYP+IZF+EEvQlurke/X06QLeETTNyQiMfE+hNLQSNSTtDy3qYSZzQKh7NnI5i1204Ii1LMZA7up0lG4Sf/ToSgsfIJy9q24FfNflvMeBarj89QfqQQFwDpQkwEfuriKy2ZEitvQFp8Xo9LkpFIktjCjMI3ytmHDn4+m1dlhMFGjUpY/kBkKniVpBvh2RWLiYBIasPl/RJQVkyGnk3jsB1Nyeh8TsSUJAm4QsuljcqMS4h6aXdELNiUZC0VlSQwLUhZZRLm5VOhxt+xgEGRVQJnKJzjrCQ24oWKZj3x4sYxdbOm5EbNr73JR3mAN3fLWwpitzMzbnJabdBiw73YWjnLphInrbUrr/DlVjlVEOFziD6X1icax4SpYxI1JvEThEWj7kFqOQyUaM3eSNDkQ1wnznNeoxrPayeyJHK60mDPoVwZdWiePUnYHFBEvOZXpZA2K17dpSvWjt22xd9N6j93t+fjNanXKRYQaJvSr0AMS+74VRNBl48jxbwT1YuWX2kCJ+pIrytFd6w8lZyB/8ti7kmJQ0TcQ+YVLkngryrkQVxuLPxfnwytID1S+cdPWig+8gLq82GJ2Vl6IjqzuiCeODM34vpCS/mFsESmp4pp3Qp3hrUB6FoQ6OQK1m5AghRgdCQeegjDrMq3dxhqs/PVJW+h8qdnbwHQGWg8+OiPz51BO902SbD+xiwhVosBgaOHurTHVMB1CKYgAvbS8htKTqRhfSd7/GXiGhYoXMMez+o8tVvE0ME7f/ze8gaDd447fr/HzDUzcwaDc2d4EYw996MzHA4HR2un9xOYwbkwM/M1qLeva8ejvjSDMzYzG2lQe/2hdsykdxwzs6EGtd8jajPpHd/MzNOg3r7JHY/aTHpnZGYWaFAH/aF2zaR3h2aoLzWoRz2iNpPeNSuQrqtBPe4RtZn0rlmBdC80qC/7Q+2ZSe+aFUh3rOsyPTZHz0x7z6xCetrm2GN39MzE98xKpKfrjk6P7dEzU98zq5Gerj06PfZH30x936xI+rr+6PTYIH0z9X2zKunrGqTTY4f0zdT3zcqkr+uQTnD4U+nUbzejJ+m+50PnTfpbAU+b+F+cVUT7AooyvvqX4uYT6H75H+ibQKWiFwAA"}'`
	},
]

export function buildDFBaseTemplateItems(): CodeClientTemplateItem[] {
	return DF_BASE_HELPER_DEFINITIONS.map(buildHelperTemplate)
}

export function getDFBaseTemplateCount() {
	return DF_BASE_HELPER_DEFINITIONS.length
}

export function getDFBaseTemplateDefinition(templateName: string) {
	return DF_BASE_HELPER_DEFINITIONS.find(definition => definition.templateName === templateName)
}

export function buildDFBaseTemplateItem(templateName: string): CodeClientTemplateItem {
	const definition = getDFBaseTemplateDefinition(templateName)
	if (!definition) {
		throw new Error(`Unknown DF base template "${templateName}".`)
	}
	return buildHelperTemplate(definition)
}

export async function sendDFBaseTemplatesToCodeClient() {
	const templates = buildDFBaseTemplateItems()
	await sendTemplatesToCodeClient(templates, textToGZip)
}

export async function sendDFBaseTemplateToCodeClient(templateName: string) {
	const template = buildDFBaseTemplateItem(templateName)
	await sendTemplatesToCodeClient([template], textToGZip)
}
