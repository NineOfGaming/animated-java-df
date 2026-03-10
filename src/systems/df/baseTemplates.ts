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
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rig","version":1,"code":"H4sIAAAAAAAA/+1YbW/bNhD+KwKHAPGgubXXppjQFsjysgZoimAJtg91YNDiSSJCkQJJpXEN//cdJVuR31TLToqh6IfAEl/uuXvuuROZCRkJFd4ZEnyeEM5IUL4Tf/YbkCiXIb5SHeMiXGMhna3Gp2LE7SpefMKopfNVODo5PR9++vMmeHX0pueHKs2UBGlNMBmQlEsINY1sEObGqnQoaQoD3AsPVlO0HyqhdDAgvxydnrw5+2NAfItTOHAhufX+5vGATG99bqngYfByNJ/FUb9uHY04s58nIyWYWze3+yVBJ9HqMl6s6XgRjCPEVzCeTcAzGYQ84sA8zWOPSuZxa/CXp9RyJU13ySs1inITUgsFtrGa34FNtMrjZMFpP5cMtEC33cLp7RT9zKUNej5nQT0eI3kUgR5C7Agg06lPjFCWBC+n/lJOMjkEUUuKY9iliuGYHWfu2T5YfMlErqkgQUSFAZ+ozIVSDTxC9FYgRmJoaVzDKPfizLnb6oBwOiAXxvvAGQPplBTOlrAxesTDZa094vWPHBEz2wQJ73JMRxcfSOHJOrmGVIjhdpq9p3qVHYdygDOHnHW6UjEwuMaEqqArl4beA2tkfa3VSiA1Yy7ZpE7uuljnrmwOmEfDEvK7ROt8rBL4DxU5XJizNLPjmoOahihyB8Y1hLgNVVFkfiY6qXTakEAlrVbi2wG5frIa0SUGIby3RXW/n4fmvdVgwL5nCstYKuslGBhW7dgrYu42JnSzxk/hHgTGpiudX4FOuTFloiuerjSX9hRGebwmzprc+y2wjxnzrjMaFhkrwW+wmXhFTrxL0DGX8S5O/N7CiU/Yzyv4DzxOBP7ZHYFftWI+ormwFfY1Nku2C+jrFqD/Ui3L2ErQSzCGxuBd27GAXcCPFsuptq2pmEKhys66TTXt1R226Fo/Xkeofct/toWfbeHHbAso/ac8NQw5a3VwONGAR+KP3NjNLmrIcNGOHjqnmprWVoe2loejNqfjG50/VsixEOqL59jwThIq4wKn4upc6TMaJqvMbFbMfMv2DXhu8nn04rjrFteO/RLSnNVV/svbzer1p8bcInF/gb1AAze04YLx/Utna24aOe4thnqcoQBY8Vlo01a+JZS9qtZ9eov/A+ytlMISfgbvsBG3Ucyux6D+2gI8w9be5hj0vFW4ID0XU/lWkd7pCpCxTZ7qvrsL/zJPV431NhN9pTLXN5dl/KS8rbDyvJJciM8F97HEf56S423iWpudA6yN5LCQUslU50W/szmiSzyf8Uw0N53/V1kccMng4bCeQL8WNe/82v+t1+m0rJu1H6ctoDoN5L7bq5VvveN2+h+uYAj1NxYAAA=="}'`,
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
		description: 'Spawns an instance of the rig at the specified location.\nAutomatically applies animation "default" at tick 0 after spawning.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.spawn","version":1,"code":"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"}'`,
	},
	{
		templateName: 'RigAnimate',
		displayName: 'Animate',
		functionName: 'RigAnimate',
		description: 'Sets the rig to the specified ticks pose.\nResets the selection and restores your previous selection.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate","version":1,"code":"H4sIAAAAAAAA/9VWS1PbMBD+Kx716mGAUph6poe2gWkOpR0IvRDGo8hrR0WWPNKaNs3kv3dl5+EkTjBQDr0Ea7Xa79s3UzZSRtw7Ft1OmUxYVJ9ZOP8bsbTUgo7cZqREOgj5XJu+Kol/VR1ClnDkCy2STnsX8eWnQXRyenYUCpMXRoNGF02HLJcahOUpRqJ0aPJY8xyG9BZ+o+VkXxhlbDRkb057n8/O3w9ZiHRFgo9a5hwhuJLZkM3uQolcSREdjhYKJA2bAKDFmGvMCTrOlKRf8wDWysTj0bOmLmF66e10ZFTiLxc0fo3JJyKxSS+zfLLidg3oAhxDYGUWoKk+XQFCphKSACVFOiiMg4MN5maUlk6QVxWmQyvvAcfWlNl4zbGw1AlY8qFSnIXPpHkFbkHUgQKB0uiA6ySwQLmgn2BiShsUFh6kKd1K6R/xvpsR4VJjdBzKJGrG32mZpmBjyHxy2WwWMqcMUp7I2fWSK3QMqlFzvoB8JSYkw0nhv7me0KFQpeWKRSlXDkJmCu9JQ5CAE1ZWUnpzrlHiJOj3GuBHXcFzk1TiOT7+xifjf/Um1uGPu8Jzao2XodfN5cthjcHbrgxwBa/L/MnwA5lDIHXdKQ38k87Z1wi22CSRQMpLhfEDVyUsTczv1g0cVag7WaMtt0j3K0yj6ri1sH+3xX6kYuRZA90sjF14RM+frsm0C77IJAHtJ7CYqyQT4irF5oxu1Mup77C5bUaj6IDXM5NVRNqmPM0Dio59fNDXShtBW84HunLCVJH3zb63fzOfjoatecaulwNpQFQAg5ubfs9VEfFH0ujV2VzrT+/vMkAfdvspuFJxt5XW6mk1XTq72GpiMSN2WNmeNa1W5q2+w8j2xGg1grstbHd8ezwW/bbDzMmOSjzQfs1QOvdUpK+D2Ix+tqRqLd1X+w3J9LUre43NDz9j+u48L9AvH460FEcl+oeX3wYNmpYLWpYeUlrCIBGZ143RZWz+zPC8jmffFZ+AvfTPXxzsR5v/Wv6B/U2/3W6tA/2w25z4H7LRfYsMaE2tlkjmmy24IA+oGqXOmsuk/nenSmqrO1tbpe3lvjAKZeqF1hrHjvp3s78i6Uf0qQwAAA=="}'`,
	},
	{
		templateName: 'RigAnimateNoReset',
		displayName: 'Animate No Reset',
		functionName: 'RigAnimateNoReset',
		description: 'Sets the rig to the specified ticks pose.\nKeeps the rig-entities selection active after animating.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate.noreset","version":1,"code":"H4sIAAAAAAAA/+1aYW/bNhD9K5yGAjXmGU3XpZjRFMhiZwm6ZEUcdB+awKCls8yVIgWSSuMF+e87UrYi2ZYtKe6SAv6QWKZI3rvj3eOT6DtvxKX/RXvdz3ceC7xu+t1rzz673jgRPn6lKsRO2MdANOuNV67FjnJf2l5ADZ33wta73vHw/PfL7pv9t3ttX0axFCCM7t5deRET4Cs6Nl0/0UZGQ0EjuMKxcGsUxfl9yaXqXnk/7veO3vZ/u/LaBm9hw6FgETVALlhIziW5AA3myru/bjNDOfO7r0bzntjazlsC4U+oMBFiGIac4X95A0qxwBrGYfm+aNy2fr4bSR7Ym3M8XyfoHKJZxBkqOn0AOQCjiZkAUYjSSHepY/DZmEFADMOQk1hq6Cwgl6Nxon10z9nURrEvYCZKJuGk4Fg7EQEo9MF1vG83hPkBIM5w/oxxYYaBJho4+IZJQSh+3ADBiIAi1EWeiXBLqK/vEW4iTPd1mwXdfPS1YOMxqCGEIZry7u/bnubS4Cqhq8XMi8UQeC71bB7ZhAywzUxje03FFL/EPFGUe90x5Rranoytg7mGALSvmGvFMX0biyk57eWM71U1HsnANc/sm1tT2/6ZnaJo/nVV83adHmc9rTGbAAUEv1RFYB7MiySqbf6SRUCYSOskZ/9N5dUXmK/xIogAxjThZnhDeQLZFLN7xQn2nNVS1EYlS6BPnU3J07itQP/rEvoRHxoa5qzL+WTH1qLFj7dxak1OWBCAsETsz7oEU8TK/EWqzuXLvq2w2dweFngnLWDoCCQ3ZE3PAVpF+myMQVKbaT/ttBA7a+kF3nnpyqCF1gIYskBjT+1Ltx6J0PQGgkJhW6yZc5+o6t8ybewgapBQRomxA8//usyhVtRHorEImELCwiacXuSWXaqo3ElfCqMk3+yl3bmW3Uwr9J0j2vc5f8k7F9z3gUQmFdIQsI501pJYeSL04AY4eqWyZPgIKmJa29u5gH1UmPM9GCXhCg9zObFMIuW2D4OADGLqg86MXyKVk0+2fsgZqBD3giYglnmkHMQ5aobM/AkLJxz/TEPDywSyLvKOLTLbA9yqgiZG69R9Xyn5sNRnoDUNgQzMlEMT0/vFqsoNa1AVhakuwCRKrK1Fn8uUw6oU4zNgHEzqU92PYjP97ihmQq1IE1NiPdc7rtlxzY5rys1i6TyCbKyIck+rOXaxjzRri650pvJJ9orxPPhG3LkexLIn6ePEikmc7u04guqsfWiqrHpDq1PJEdWFfBwYqoz+m5nJcgjK07Ew6lspyscn1v+7Eg1g1OH0c0l0HUof4KqIcEU81y2rG7I1agCbgM8nHbbHMxtmWs6NutlVJzF6TNMRf6j0CwgTThXp38YobKzc0F6B/yN5Aw2yozDweUpVG9G0wV61OhxE6DjqWT0qP/0OM3t3U74//nDwvar2+au2/IisZFuzQTtNv9P0O02/PRJXEAM1DRnNPmU/eldu9NKijpq+VMlD5h9yLr+SP3GfIEcTKkIo7LDHUvWpP1mOT3kuzIdUJ935lKWZQzkfVjtuXBlQF0wbxdaj12Z+gFNZLW1FSTfItWUmXHmc8QK3mMlLFyDTeuE+qwmR1k97rcIBzMKJApc0GGZbWJ3y3JQN6RnkUI7+2ZwOKxWD8wsLqv7qu7PDak/l/dmR6ZF03K6T0eH81gnVR+5o+5Kuocs6bjZJ1QWxeMy4AWXRMpMqgPqQq4rB0B605QDPFn6QHS4P2L8pQakQTG7HXLdgK9P7VbXXJk+qCk+FNlT4UJB5LMhUoRyTaHeitFOEO0W4rVc57hccw9n8DSVFkrCAbEXubZQUhWD8AeaBiXMUmZHnN9w4HfOk/zL3W636j+yv1iqmjUT+us7OdbD25ce2I8SpXr9LNYvrXuO9uobzNcviCf0fNK+BbdR+9huiasqqx3Rc+AnQE0BeDG4t8JxOzygm0W0J8Ov7/wCnj08JLSoAAA=="}'`,
	},
	{
		templateName: 'RigRemove',
		displayName: 'Remove',
		functionName: 'RigRemove',
		description: 'Removes the rig instance.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.remove","version":1,"code":"H4sIAAAAAAAA/61UTW/bMAz9K4F2NYpmGFLMty0faA/boSt2aQpDlmhHqywFEt0lCPzfRyn25jhJGwy9JBG/3uMjmR3LtRXPnqWPO6YkS/dvlrTfKStqI+jJXUlBFINQtdH0K1pCVnwkTHLkXRRZd7NF9v3rQ/ppcjNOhK3W1oBBn+6WrFIGhOMFpqL2aKvM8AqWlAsbdJzqC6utS5fsw2Q2vZl/XrIEyUWGe6jsC4zuVblkzVOikGsl0uu885M16dcHI1bcYEXIWakVfVK6c0oGOErrxxJksD7ucqtlcHYsfq+oJeIwZFc6vh1S8yNcwcipcqSMR24EXA2Y2ryoveAIEcOjU8+AK2frcnXQSFIbCY44x8DmqSE+tcF0nCiZ9nl7o4oCXAZlEIU1TcK8tkj9NclgUmuTge6NKugeBijJhtt1+M3Nlh5rXTuuWVpw7SFhdo3Kmp5BghdORSvlzA0q3I7uZj3w8aXglZXR3OLjBl/DR1cfwX8LFQ7RPx6h5zpDXvbgbZe+CBiBALlTdudHt0pKMGHvRRsit0RWieFl9PAmYUBtbUbjv3JxHVjkceq0PGgQtI75r7cPbK/JKd0y8r828BfuzozbCxv1Dgt2MLbQx9/G42QV+Kk1ManOv3SuW+6n8XofSLezbaoi23N4o8WTRLvVOMP1+pDrT+7mG+XR99g4Lui6QmXlSG4yUSXzb9uMddX7zOgdGlgojeCC1CpaLtL7uEOh7X6fL2kR4ulmLYfjLg8I7v/i4qm4EgLWj6hQ8P6fiIPynoqSJn8AMyByiJkGAAA="}'`
	},
	{
		templateName: 'RigLoadAnimation',
		displayName: 'Load Animation',
		functionName: 'RigLoadAnimation',
		description: 'Loads the pose of the specified node for the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.load_animation","version":1,"code":"H4sIAAAAAAAA/7VUUU/bMBD+K5GnSUOKqhUYiLxtAzYkYC+IF4oi176kFo4d2ecOVPW/75w2JQ0wMtBe2vh8d9/33Z1vwabaijvPspsFU5JlqzNL1/8ZK4IRdOSuJCfyQajW3vTVWGJUc0iZ5MhbL7Iujk/zy29X2f7B4TgVtqqtAYM+W0xYpQwIxwvMRPBoq9zwCiYUC/foOOUXVluXTdiHg+PvhydHE5YiXZHh3HKZfDWq4qismbDlbaqQayWyz9PWh6xpFwOMmHGDFaHnpVb0a+fgnJIRksK6vgQbrTeLqdUyXrZMfs9IFvHoMywdf9im5xOcQVJbD4ktmm9fg1CFApkYKyEprFuZQYNAsvJWz6gnyE6L4AUnn3jy6NQd4MzZUM629KbBSHAkrXFc3i6JdjCY7aVKZl153qiiAJdDWRIUWy5T5rVFKsMy7TW1NjnoTldji8jswAeNZMeHOp7n3NGh1sFxzbKCaw8ps3VUszE8woyHwlRUKP2Igvf4KgrlAC+caqwUcxFTJGfHHZW7Q+FjR96HvpnRbQZ7QxnESfk3Bo8g+0NBChf/NygmNM8YCk4tzudcB9hkWN9tx48bZS/SQhc6rL48YTXVOfKyk9a21TuNqSIxus7YmU9+KinBxFUk1i7ygUgo0V9WnWYfxIewzs2cKkeaXme+eWys4fPc1lNFvhrrV/beyqn/QAjoI918akZ4ZyRWpwi7s/qMrd2hQC9sU/ZgPJ+D3HqNkflG6jV3J/fKo4+UkLbANGAMvPx11RHhuKDtEAkpR3uFTJTedLprXfWyZsG1zoet+/8ouz8hg6AixhvQxv3xkCAo6IJTgQX4v1ZWaOthaGk94HvmqV24rZK45t9ftLf05+n2fhaq3SovEN7dHu4fgOc029fNtqGrPxz+N6+VCAAA"}'`,
	},
	{
		templateName: 'RigDecodeMatrices',
		displayName: 'Decode Matrices',
		functionName: 'RigDecodeMatrices',
		description: 'Decodes the matrices of the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.decodeMatrices","version":1,"code":"H4sIAAAAAAAA/81YUW/bNhD+KwKLAnGrtKbEyI7elmRZC3R7WLO91IFBS7RMRCIFimqTGv7vO8mOI8sxTbsysJckpO54330feUdmjiapjB4KFH6bIx6jcDlG7up3iKaliGBIVQJGYKNZtrKGv+qZyqseuCimmj5bwez85nb819VdSIIBdiOZ5VIwoYtwPkIZFyxSdKrDqCy0zMaCZmwEvuxRKwrrRzKVKhyhN8HN9eD3yxFyNXyCiRsWyZg5f1KteMSKEVrcu1zTlEdhf/JsBLNuMwgT0YwKnUH4cZJy+Cm/M6V4XMUEt6YtxK1mv80nMo2rj89QfswgLwDShpgo+tTGVzh6xpxsBdKR03pcsJRFmsUOFRy+cSk+tPDLybQsIgo21agA9wemZ0qWyWwjPbcUMVOQSW24uF8AylLo0Hd5HDazKQSfTpkasySBUGixcFGRSg1ZL9yWiLkYs7ShYiUJTCtWlKmGef2UV+PvVMEgT0tFUxROaVowF8m8ymY98RIG24ZZU3JTza+j6Ud9QDRvK9okHWuaNMItfeHLbeVaBYLPIfpcOJ94HDNRbfZoZRI/ATgetY9DI15QUb9aGymefIhr+Z93J6rxvHauCqbHSyb3HK2lUYusyZOGxQFFJGuWqo1g1PbVVdqU71htW8LdpP5zd3s+XJN6PaMKEm1S+hWIEcmdvFpl0Oajwe3FAXHvVPmi5VeewLk4MupS0R2ep5IzIL8s5p4tcYiIe8i8ogULyLLOHcTlhuP/+mQYBemQyj9+8rziI8uhyh62MVuuJ6IzrQviiXfmRl5feKG/MJHo2alyWje0nWltALpWDPpxBWs3IMVyMDoSDz+EYVFm2yv0jbvzVZe3UPlnZ28B0Blo3PtIhue419xumyQ4f1ORMKfBgKLRQ13aY67gUgNTkIF4adwrSk6kYX2zevxl4lYscLhMPZ7V+9RtEMN778jwveP3eu+wN3y/x8yzM8O93jnuXwRD3/uI+/1+72jtzHECOzgXdmbEgHr70nU86ks7OEM7s4EBtd8damwnPcZ2Zn0DatIhajvpMbEz8w2ot29yx6O2kx4P7MwCA+qgO9SenfRe3w71pQH1oEPUdtJ7dgXS8wyohx2itpPesyuQ3oUB9WV3qH076T27AukNTV2mw+bo22nv21VI39gcO+yOvp34vl2J9E3dEXfYHn079X27Gumb2iPusD8SO/WJXZEkpv6IO2yQxE59YlclialB4g47JLFTn9iVSWLqkDg4/Kl06reb1ZN03/Oh9Sb9LYenTfwvTUtmfAFFqVz+S3HzCXS/+A/5y0ZPaBcAAA=="}'`
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
