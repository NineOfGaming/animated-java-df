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
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate.noreset","version":1,"code":"H4sIAAAAAAAA/+1abW/bNhD+K5yGADXmGUnWpZjRFsgSZwm2ZEVsdB+aQKCls8yVIgWSSuMF/u87UrYi+V2qgySAP9iWKJL33NvDo+gHr89l8FV77S8PHgu9dnbvNSe/bW+QigBvqYqwE/YxEE9645VrsaPcTdMLqaHTXtj6cHrmX/3ea789enfQDGScSAHC6PbDjRczAYGiA9MOUm1k7Asaww2OhXujKM4fSC5V+8b78ej05F3ntxuvafARNhwLFlMD5JpF5EqSa9BgbrzxbZMZylnQ3u9Pe2JrsygJRDCkwsSIwY84w295B0qx0ArGYcW+KNy2fnnoSx7ah1M834aoHKKZxRkpOnoE2QWjiRkCUYjSSHepEwjYgEFIDEOTk0RqaM0gl/1BqgNUz8nURrGvYIZKptGwpFgzFSEo1MF1HDdrwvwTIMlx/ox2YYaBJho4BIZJQSj+3AFBi4Ai1FmeiWhLqG/HCDcVpn3YZGG7aH0t2GAAyocoQlHeeNz0NJcGvYSqliMvET7wQujZOLIBGWKbGSX2mooR3iQ8VZR77QHlGpqeTKyChYYQdKCYa8UxHWuLEbk4LQg/2FR4LEPXPJFv7k1l+Zd2irL4w03FWz99n/Qsx2wAlBD8sikC8yhepHFl8T0WA2Eiy5OC/Lcbe19gvCazIEIY0JQb/47yFPIpJs/KExw4qUtRG5XOgb5wMiXP7LYA/a9z6PvcNzQqSJfTyc6sRIsfH+PUmpyzMARhiTiYdAlHiJUFs1RdiJcjm2GTuT1M8FaWwNASSG7Imp4DtIj02QCNpNbTftZpxnZW0h4+eePSoIHSQvBZqLGnDqTzRyo0vYOwlNgWa67cZ6o690wbO4gaJJR+auzAq797BdSKBkg0FgFTSFjYhNOLgtulipcrGUhhlOTrtbQr17yaWYa+d0T7saAvee+M+zGUyKRCGgJWkdZKElseCKdwBxy1UnkwfAIVM63t44LBPimM+VPop9ECDQsxMU8iy2UfhyHpJjQAnQvvIZWTzzZ/yCWoCNeCOiDmeWQ5iCusGXLx5ywacvyYmoLnCWSV5R1b5LK7uFSFdYRWyfuOUvLR1ZegNY2AdM2IQx3RR+WsKgyrkRWlqa7BpEqszMWAy4zDNknGF8A4GNQXuhMnZvTqKGZIbZEmRsRqrndcs+OaHdc8EddMiuspr9jNzMp0y8rvBZO4OrHlErq1cpOxcZUY2bqOnFBd8l/XUGX0P8wM502w3H2lUU9VgSGHvSpP1IBRhQOvJNFVKLCLXhHRAnuucqsb8jJSaXbZtpbMGuxVo8VBRC7+XtS24fnZY7KPLYVqyQw/fHitFcz0tUNxhAuGSf9dabMrbXalzfb4W0EC1NQkM7vZqEJm29u7VSmSeip9jPxjzuU38hcuEeRkSEXkcjL3xplUHRoM5+2zPBamQzbn2+mUSyOHcu5vduqy0KDOmNaKje/2zfQ99pJZnqhAqhFr80y48K3uHq4uwzfOQKax5343q0EaPx00Su+hZ16scklDP1+9qqTnumjIjmJ82f93fTgsLBacXphQ1b3vjlCWur6UBZ3JydGJdNyu0/7x9NE51SfuhK9HV9BlFTXrhOpMnXjGuAFl0TKTVQDVIW9aB0b2vKEAeOL4bn7G1mX/ZQSlIjCFFXOVwxaG9/5yB72YgvBCaENFAKUKj4V5QSgHJN69WN9VhLuKcEsVnjvUH/mT+WuWFGnKQrKVcm9tSVEyxh9gHpm4QJE5eT7hwumYJ/vK1W80qu/W91dWTGuJ/LDKyvVh5XuPbVuIU716lapn14Paa3UF5SumxTPq362fA9vI/fyvFJtVVqdMJ6V/QjwD5FnjVgLP6eiSYhDdLwF+O/4fD6UusjQnAAA="}'`,
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
