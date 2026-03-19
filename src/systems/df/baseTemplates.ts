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

export type DFBaseTemplateCategory = 'required' | 'optional'

export interface DFHelperTemplateDefinition {
	templateName: string
	displayName?: string
	description?: string
	functionName: string
	category: DFBaseTemplateCategory
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
		functionName: 'rig.init.rig',
		category: 'required',
		description: 'Initializes the specified rig and its animations.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rig","version":1,"code":"H4sIAAAAAAAA/+1YbW/bNhD+KwKHAPGgubXXpZjQFkjjZA3QFMESrB/qwKBJWiJCkQJJpXEN//cdJVuVbVmR7CQoin4wLFLkPXfPvfCoGRoLRW4NCr7MEKcoyMfIX/wHaJJKAkOsQ1gEayyLF6vhKZtxu7KBjyi2eLkKZmeDs9Gn99fBq6PXPZ+oOFGSSWuC2RDFXDKi8cQGJDVWxSOJYzaEvezeagzyiRJKB0P029Hg5PXp30PkW3gFE+eSW+9fHg7R/MbnFgtOgpfj5VuY9cvSQYgT+2U2VoK6dUu5XyNQEqSu44UaT1fBOEB8Y8azEfNMwgifcEY9zUMPS+pxa+Cfx9hyJU13TSs1nqSGYMsybGM1v2U20ioNoxWl/VRSpgWo7RbOb+agZypt0PM5Dcr2GMknE6ZHLHQEoPncR0Yoi4KXc3/NJ4kcMVFyimPYuYrCnJ0m7tneWxgkItVYoGCChWE+UokzpTRBmSGaZ7Ow53xQQu1toI7FyOKwBKuWG8+cNIcNr0GM8T5wSpl0wUUWS+gUlORkPfy+4/WPHDcL2Qh80OXgoS48oEyTqggmWIhRszC+w3qTMIdyAG8OOe10pQI2YI0hKmMwlQbfMVrriEqpRcyUhDn/15JbKQkmOYa02i6oX0na0qbtzPHJKEd8FtqcjkUk/IdFys7NaZzYaUlBjQkkkAPjmhHYBuGVhdAioKXScU0kKGm1Eg8b5GrVpkUXYITw3mSV493SNO+NZobZd1RBiZDKehEYBhVh6mU2d2sjY3uyDNgdE2CbLhLmkumYG5NHTMHTpebSDtg4DSvsLEVAvwX2MaXeVYJJ5rEc/BoKlZf5xLtgOuQy3EWJP1so8QnOigL+Aw8jAT+7I/CrVsxPcCpsgX0FhZjuAvpXC9DPWMvcthz0ghmDQ+Zd2algu4AfraZTaVtdMhGh8hLdJJv2qg4Nyt/PVxFKfcKvsvCrLPycZQFC/7G6horOZud+6+EuqbfKzdtnMdE1CSNOW/VGJ5rBjeIjN3a7ipolsGhHDZ1SdXW5EeEt+782N4lrnX4vAsdCqK+eY8M7ibAMM5yCqzOlTzGJNpnZnhTLLc3PmKXIp4kXx103u7Xt55B6r27yn18ON2+P6/eKgrh/mD0HAde45jL2/KnTmJtajteKw3ECAUCzk69N5XwoUPbKWtddZJ9R9o6UTBKc9Ldw1ux9PW3Q6fUrE/AUTq82nd7TZuFK6Dmb8lFBeqcrmAxt9FjfBnbhX6bxprDedqIvVeLq5noYPypvG6w8bUiu2OeM+5jjP03K8TZ2VXrnAHIjOsxCKWeq86Lf2W7RBbSgPBH1RefHSosDLim7Pyw70C9ZzTu/9//odTot86bycGoA1akh9+1epbzxjpv5/+SRwOx2FwAA"}'`,
	},
	{
		templateName: 'RigInitRigs',
		displayName: 'Init Rigs',
		functionName: 'rig.init.rigs',
		category: 'optional',
		description: 'Initializes all specified rigs and their animations.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rigs","version":1,"code":"H4sIAAAAAAAA/51UTW/bMAz9K4Z2NYKmGFJMt61psALDDkNvTWDIEu0QlSVDottmgf/7KDdZnaTpPi62SfHj8T3KW1Farx+ikPdbgUbIF1vku7cUVec0myrUHMQxBM0umr8GT8oajFwYRWofxd7tfFF8/3InP86uprn2TesdOIpyuxQNOtBBVSR1F8k3hVMNLDkXnikorq+99UEuxYfZ/Prq5tNS5MRH7Lh1SNkPrONS9KscSVnU8qLcH7M3H5cHp9fKUcONi9oiP/0jhIAmdZuWB7HcMXnvt6W3JtXcg3ha80QM4RhcHdTmEBkynJ8QM2VtFlvQWCGYLDDcTDmT0Row8Bc2itC7ODkawpdVF7UiGNpHCvgAtA6+q9cHM+adMxB4nCGwX/UMtXMkpzkaOR4pOqwqCAXUNbcSfZ+LaD0JedHnRxq2rgA7EjEpkqQ1kZ20aZNBz8RGa7ugrJAUOsiFb9Moya6UjewwEHXAwcspt/M4ajs9aVvaglQ96uv3mYtULvXmY64Ts69oDLi0jXoXYjaMEvXxvr72u5wlcna1BeswQVZpkgQRA5S3dj5AC4r+vPWPKrzFF/ui9gNfSaF3ST9TIp6v8S8M3rFAvwn8bK1/yr5hpOyar0QNcczkwocbpdenLJxweZLyymNQmvc1IcEAmlMYyiDYbn32Jc8Rr/naFH/3x/kP7s8swrv4tfUvO3g4wKr/BQIsH6E6BQAA"}'`,
	},
	{
		templateName: 'RigSpawn',
		displayName: 'Spawn',
		functionName: 'rig.spawn',
		category: 'required',
		description: 'Spawns an instance of the rig at the specified location.\nAutomatically applies animation "default" at tick 0 after spawning.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.spawn","version":1,"code":"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"}'`,
	},
	{
		templateName: 'RigAnimate',
		displayName: 'Animate',
		functionName: 'rig.animate',
		category: 'required',
		description: 'Sets the rig to the specified ticks pose.\nResets the selection and restores your previous selection.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate","version":1,"code":"H4sIAAAAAAAA/9VWTVPbMBD9Kx716mGAUph6poe2gWkOpR0+eiGMR5HXjooseaQ1bZrJf+/KToKdOMFAOfQSrNVq39td7RMzNlZG3DkW3cyYTFhUr1m4+BuxtNSCltxm5EQ+CPnCm74qiz9VLUKWcORLL7LOBmfx+aer6Oj45CAUJi+MBo0umo1YLjUIy1OMROnQ5LHmOYzoLPxGyym+MMrYaMTeHA8+n5y+H7EQaYsMH7XMOUJwIbMRm9+GErmSItofLx3IGjYBQIsJ15gTdJwpSb/mHqyVicejY01fwvTWm9nYqMRvLmn8mlBORGKdXmb59IHbJaALcAKBlVmApvp0BQiZSkgClFTpoDAO9taYm3FaOkFZVZgOrbwDnFhTZpNWYmGpE7CUQ+U4D59J8wLckqgDBQKl0QHXSWCBekE/wdSUNigs3EtTugenf8T7dk6ES43RYSiTqFl/p2Wago0h881l83nInDJIfaJk21eu0DGoxp3zF8jfxIRsOC38N9dTWhSqtFyxKOXKQchM4TNpGBJwwsrKSmdONUqcBsNBA/ygL3huksq8wMff+GT8rz5EG/6wLzyn0XgZej1c/jq0GLztywAf4HWZPxn+SuYQSF1PSgP/qHf3NYIt1kkkkPJSYXzPVQmrEIu9doCDCnUra7TlBulhhWlUXbcO9u822I9VjDxroJtlsDOP6PnTNoV2wReZJKC9AouFSzIlrlKsa3Tjvhz7CVvEZiRFe7zWTFYR6VJ50gOqjn1c6GuntaKt9IG2nDBV5f2w75zfzLejEWvRscuVIF0RFcDg+no4cFVF/JI8BnU3W/Pp810V6MP2PAVXKu73pHVmWqlL7xQ7Qyw1YkuUTa3pjLIY9S1BNhWjMwhuj7A58d31WM7bljBHW27injbVI7TrRvp7EJvxz45Wtdr9SCCZvvbNbrH54TVm6E7zAv3jw5EexXGJ/uD5t6sGTcsFPZYeUlrCIBOF1w3pMjZ/ZnleJ7Pvik/BnvvjLy72o8N/Kf/A7qHfHLdOQd/vpxP/XTfq/1O8OO7MQihTvyedafT0v53/BUkWducoDAAA"}'`,
	},
	{
		templateName: 'RigAnimateNoReset',
		displayName: 'Animate No Reset',
		functionName: 'rig.animate.noReset',
		category: 'required',
		description: 'Sets the rig to the specified ticks pose.\nKeeps the rig-entities selection active after animating.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate.noReset","version":1,"code":"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"}'`,
	},
	{
		templateName: 'RigRemove',
		displayName: 'Remove',
		functionName: 'rig.remove',
		category: 'required',
		description: 'Removes the rig instance.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.remove","version":1,"code":"H4sIAAAAAAAA/61VW0/bMBT+K5GnSUOKEExb0fK2FRA8ME0M7YWiyLFPUg/H7uwTRlX1v3PsJiO90iFeWvvcvu/cnBkrtBX3nmW3M6YkyxZ3lrb/GSsbI+jKXUVGZINQt9Z0ipLgFS8pkxx5Z0XS2el5/v3bTfZpcHKcCltPrAGDPpuNWK0MCMdLzETj0da54TWMyBce0XGKL6y2Lhuxd4PT4cnZlxFLkVQkuIbaPkByraoRm9+lCrlWIjsqOj1J0358MGLMDdaEnFda0S+5O6dkgCO3vi1BBuntrLBaBmXH4u+YUiIOq+wqx6er1HyCY0icqhJlPHIj4HCFqS3KxguOEDE8OnUPOHa2qcZLiaSNkeCIczSc382JT2MwO06VzPq8vVFlCS6HKhSFzecp89oi5TdPVzo1MTnoXqtC3UMDJclwOglnbqZ0mejGcc2ykmsPKbMTVNb0BBK8cCpKyefMoMJpcnnaAz/eF7y2MopbfHzEXfjomjX4qxBhGf3jGnqhc+RVD9527ucBIxAgdcYufXKhpAQT5l60JnJKZJVY3Ywe3iA0qI3NqP2HLo4Dizw2rZYHDYLGsfj98oItarKpbjnpdzX8gbst7fbCxnqHAVtqW8jjX+Kxswr80Jro1BRfO9UF98O4vTdUt61pqjJfcHghxY1Eu9HYwvVomesv7s4elUffY+O4oO0KkZWjcpOIIpnnaTPW1W/TozdI4FxpBBdKraJkr3qvZyi0XczzPilCXN285bCe5RLBxRMXV8VVELB+xgoF7euKuBLeU9AdgXC/Wdq4LmEn35P7h9iTg8VZyYNDaEd85x5tfz3ChjhIIkr3hlxxFOPkGv40pArfnv5b8qOh2tGs+g2p9R6Uz69/wSpqOSRDHmX/iztYnslnL5I/ARmJu1UxCAAA"}'`,
	},
	{
		templateName: 'RigSelectNodes',
		displayName: 'Select Nodes',
		functionName: 'rig.selectNodes',
		category: 'optional',
		description: 'Selects the specified rig nodes.\nIf no node IDs are provided, selects all nodes in the rig.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.selectNodes","version":1,"code":"H4sIAAAAAAAA/+1X0U7bMBT9lcgTEkgRomwCLW+sFFFp42HAXiiKHNtJPRw7sx2gq/rvu3ZSSNoGWmDaJu0F4ptrn3Ovz3HcKUqEIjcGRVdTxCmKqjEK6/8RSktJYIh1BkmQY1leZ8OTj7hZfhAiii2eZ0F0enwSn326iD4cHPZCovJCSSatiaYjlHPJiMapjUhprMpjiXM2grns3moM6xMllI5G6N3Bcf9w8HGEQguvIHDOBCM2OFOUmRGaXYfcYsFJtJfMMyAaNhGYJGMsbQ7YcSY4/FW3TGtOHWAvaeUCqIteTRMlqFtzzuNuDEUBi0V+mcaTRXImsGMWmIIRnnJGA82zQDq+uwuEVZKWhmDLPJSxmt8wO9aqzMatesJSUqaBuk+chS9kN0yBhmcSDI9NgDULCq1uoRE0DExNHQtRkQ249HUA+zfifT0DwqW00X7IadRsu5E8TZmOWZYBFJrNQmSEsijag2LbUitkzERDa044ToEUYnZSuGcsJzAoRKmxQFGKhWEhUoXlSjYCUCLR3EdhzkBabifQlwZ4b13wHPolHvHtvd0Y/4tbog2/vy68264hNV0ErC5b+NW4DX9Wi6IB/34JPhGxxVkDX82nn7iSHD68jtDQBKecUibdwUHqFDoBtpwsHi2Ncg+cQOq1kVNdJUnvdOTJrDqgeBrfYv38EVUldXbOEOVb58Ta0p/j9FDEZ27sOf/JBj9KqLhBSmMCFnAAXANnCMFy8nFHpNJ5dw1VobFKvj9fR7W3qwQYw/unnLOyA943HcX32sV7i3Bm+kr6SWVyNH91ik3fn+MXIIA3KXMl2bnP1tusEy4s044t95GXUCZKWq3ECr4tqK/Mllo+qQciVGWRdQTxu0W9KA1Z5svr9Lql8N8Hf7cPFkte2awtDl/n++1aLmFvp7vkf9hKhtlXemn9z0NfM7gUOXN089GsgKRXWXuTnX/ZCbF88+n+9l/AdeLh038khLoLXAeCPly6M9+8RxkpPcBkvNyNpVvA0pT1j5j5kn9IEOtZD36L6Mm2u+RsAcy2N/RO9czpzi6rj5jQR6rt2nnCn0cFtIB+wwK2YgPnPN+qVx5Um9mnuoNfXrpb8PXsF9ygQXCcDgAA"}'`,
	},
	{
		templateName: 'RigSetVariant',
		displayName: 'Set Variant',
		functionName: 'rig.setVariant',
		category: 'optional',
		description: 'Applies the specified variant to the rig instance.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setVariant","version":1,"code":"H4sIAAAAAAAA/+1abW/bNhD+K5qGASsgBE3WpZjQFchiZzWwZMVs7EsTCDR5lrnQpEBSaYzA/31HSrIlO36Nk3adPySWqCOfe32OlP0Q9oWityaMPz2EnIVxcR9G5WccDnJJ8ZboFIVQxsKolMYrP+Jm+ZsoZMSSSgpHH1oXydVvvfjN6dvjiKpRpiRIa+KH63DEJVBNBjamubFqlEgygmucC/dWE1yfKqF0fB1+f9o6f9v+5TqMLD7CgS7Y4G+iOZH2OpzcRNwSwWn8ul8J4GhUBwBJhyg8QugkFRz/qzvQmjOHd9xvyCKmG/300FeCuTUrNT4P0SZUYl69VJPxTLezLBMcTGCHEJgMKB9wYMFdoW1glX+geRpwaSyRFI7mTFD9QW4oseDBjdX8FuxQqzwdNiyMcslAozFecHIzQUVzaeOTiLO4bpCRfDAAnUCaIlQ4mUShEcqG8etJNBfDTCYgakF0EXGhZThmx5m7JnKMN5nINRFhPCDCQBSqzHIlawMMDNXcj+KctrTcjoNOqwZ+vCn4SDE/XOLbe7s1/qVbogl/sil8Gbl5BRgMSC5sckdEDtM1ymfNFUpRD75Ub6vzBbXLFK9p/dOC1n2RWJLWQFU1+8JBOLXxcRx2TPCBMwbSFTItRdgYVeR0vtRrXjp1eVWuHWLWHhmwU7WiJXzBB+gWvZ4xCqE5bzmQH/DJjz7ur44kfhgUM1R59+fSkDtgjTR2Ok6NQvXa99xYN4lYLJ9+bt3Eqz97NZU1oVhWDp5roLgKOs47p4yyVHq03EKqpNVKrDfRMd6ijUU+vvOE8r5mbPBOAzr4PVNIIFLZAJwhRytLdnkCtOAOBFqlp0nwEfSIG+Me1xz2USMhtqCfp49YWMuFxZJZjn3GWNDNCPWhK8B7SFzI2lguwSXolMt0FyW2qYAr7DVT+A88HQr8szsCv9nK80XFV9hdJGa2C+jPW4C2tVazUF+CMSSFoGvHAnaBPm1WVW3aDlXRWOovsLmWK2uRClVw1ybF+KXpBjO6Y9qjzI7/c/wyRNsC7OiBN/tANAeiORDNCxGNv+bs1RG4zTH/5vY4nfJ406AhtLfiIDUIRodt0IGdDuz0NbDT7JRbcZB7sbCy4taedatzfsPq737dG0EhRTzd4qu5/d5aszci93Lx1Zy++AZkt9CcND38O9gWp9ZTzPNmy1rffWMb5eolXl2+HJu1NT0VGxI3NyDYaVIJ7LDHPnSxQxdbKOgndj1wLzn/Bx3FkUfC2bqO0ojN6la7lZs1ZEDsjo5xuj+LQ7btr8vrrafzGbucCaE+B3/gmSM4HxKZepypVy+UbhM6XHTO8nqrpmyep9WSz5Op3oU9h/TUqKwO7WIEHt00eptX7Wc6uESPrCCrJ+1mdvLGo4YUX1W9xN53Q3bu3vJsfyTwtKRzqdJhX0fGcfYF822vfWKdV7chwQ+4YT2T42JfN2XD8yHQ2+CycPvUS44dzzEJCZdm0THLqbAxb1/VcDj6vnw/3rYO93K27YL1R7YWLtO1enUGbcltAmclqv/Peqcu5/6Es+09yVeWb8P+dvmuGCvIT8r7Z3RWvOf+ZzQriWsbM5c3yxdgrf2a7d+xj5NyweepmobGnRY3mSDjTvGjKIuAYH0CO/87md1CNHf2Qh54zqNXtQu9mfwLg2Ra0iUmAAA="}'`,
	},
	{
		templateName: 'RigMove',
		displayName: 'Move',
		functionName: 'rig.move',
		category: 'optional',
		description: 'Moves the rig instance to the specified location.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.move","version":1,"code":"H4sIAAAAAAAA/7VUUU/bMBD+K5H3GqHCEGh521oQaGOaGG8URY5zST0cO7IvjKrqf9/ZTUpSWtai7aWN7873fZ99nxcsU0Y8OpbcL5jMWbJas7j9T1jRaEFLbksqohqEqq2mrxDxu8IiZjlH3lVRdDG5TL9/uUtOz86PY2Gq2mjQ6JLFlFVSg7C8wEQ0Dk2Val7BlPbCM1pO/YVRxiZT9uFsMj6/+DRlMVKKAjfmCaJbWU7Z8iGWyJUUySjrshSN+91BixnXWBFuWipJv7TdWpl7sONsUEuAPnq/yIzKfc+Ow+8ZCSIGm9xKy+dDYi7CGURWlpHUDrkWEKEJMVeDkIWEPKKD5SiNPtpQYLKicZSCgO3QykfAmTVNORsIjBudgyUtoXD5sCSejcbkJJZ50tfjtCwKsCmU/rDYchkzpwyyZLSMN+6v1imo3gX62/DXmlMM57X/5npOi1o1liuWFFw5iJmpvZJeIAcnrAxR2nOhUeI8up70wI/3Ba9MHsItPj7jW/hom1fwN77DEP1kX3S6pRfs1eIw7d/aa+6Bf9wXHEFBbSxOCDD0WDPRTfAZFLxRmD5x1cC6WZsbthoF/IOO7a5Fj9bwLxJOX0nIVIq87AGbrs+lB/PUKZ2waxddyTwHL4aLtiSfE00pNt+b3n2d+QFvezMy1lFFNmOBxbbnyhF3QSbPfv390VpN1LapSyn/ll2euN1hFifMamLIhYOh9yrWsoMvJLix0WFTk33uUlfcjcOLeEen9k9kbiXbmWsH39GQ76VUCNazle04Hk4ZwluQtj3fx3qLL/YTMJGuvvvRtxPBA9Wxn+Ekw5D/T+arF2Qn2fea6itAHY0ba4ljdGuwk7cW3nl5p5xXVtu29ZDTenM0BwC34Kgpgf4BrRi104YIAAA="}'`,
	},
	{
		templateName: 'RigLoadAnimation',
		displayName: 'Load Animation',
		functionName: 'rig.loadAnimation',
		category: 'required',
		description: 'Loads the pose of the specified node for the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.loadAnimation","version":1,"code":"H4sIAAAAAAAA/7VVbU/bMBD+K5GnSUOKqhUYaPm2DdiQgEkT4gtFkWtfUgvHjuxLB6r63zknTZsG2DKqfUly57t7nvO9ZMGm2op7z5LbBVOSJY3M4tU7YVllBInc5WRENgjFypq+ak3wqoWYSY68tSLt4uQsvfp6nRweHY9jYYvSGjDok8WEFcqAcDzDRFQebZEaXsCEfOEBHaf4wmrrkgl7d3Ty7fj084TFSEekuLBcRl+MKjgqayZseRcr5FqJ5OO0tSFt3MUAI2bcYEHoaa4VPe0cnFMyQJJb15Zgg/Z2MbVahsOWye8ZpUU8+gxzxx+36fkIZxCV1kNks/rblyBUpkBGxkqIMusaNWgQSFre5jPqJWSnWeUFJ5sgeXTqHnDmbJXPtvKNKyPBUWq14fJuSbQrg8lBrGTSTc8blWXgUshzgmLLZcy8tkjXsIx7RS1NCrpT1VAiUjvwlUbS42MZ5Dl3JJS6clyzJOPaQ8xsGbLpKCR44VStJZ9fTYwN+ngoekH3pzfg+ID/DH4ZQkTnJx34/aHwoVC7oa9bd5vBwVAGoYF2Y3AVImyQD4ciZy6819CmqkceMk6lTOdcV7COsDrb9h/XoK9yRVc9o3pWQ264fnrGdapT5HkHzK59A0CgS8cJO/fRDyUlmLDMxMpEPhI1JfrrrtMXR2GUVrGZU/lI03yvS8hqOi+tTZWlzVz8ZXE2Rv0JI5z3dPKhbva9kWik0Ht7zWdogj1y9MLWtaiM53OQW+MciK8zveHu9EF59IES0hqZVhgcr35ed5JwXNB6CYSUo8VEKgpvOiW3rng9Z8G1Tof9L/5j2v0GGQQVMN6ANu53hwRBTpecLliA/+PNCm09DL1aD7hLP7Ubu80k/Cd2v7S31Of5nn8Rql01rxDe327u74AX1Ns39Qqioycdmeeu1ggAAA=="}'`,
	},
	{
		templateName: 'RigDecodeMatrices',
		displayName: 'Decode Matrices',
		functionName: 'rig.decodeMatrices',
		category: 'required',
		description: 'Decodes the matrices of the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.decodeMatrices","version":1,"code":"H4sIAAAAAAAA/81YUW/bNhD+KwKHAnGrtJbEyI7emmTZBnR9aNO91IFBU7RMRCIFimqTGf7vO8l2IssxTbsysJckPB15330feUdmjiappA8Fir7PEY9RtBwjd/U7QtNSUBgSlYAT+GiWrbzhr9pSzaoHLoqJJmsvsM5vbsefr+4iHA48l8osl4IJXUTzEcq4YFSRqY5oWWiZjQXJ2AjmsketCKxPZSpVNEK/hTfXg98vR8jV8AkMN4zKmDl/E604ZcUILe5drknKadSfrJ3A6jaDMEFnROgMwo+TlMNP+YMpxeMqJkxr+kLcyvp9PpFpXH1cQ/k5g7wASBtioshTG1/h6BlzshVIR07rccFSRjWLHSI4fONSvG/hl5NpWVACPtWogOkPTM+ULJPZRnpuKWKmIJPacXG/AJSl0FHg8jhqZlMIPp0yNWZJAqHQYuGiIpUasl64LRFzMWZpQ8VKEjArVpSpBrt+yqvxD6JgkKelIimKpiQtmItkXmXTMAAFVPHaCnO+LNd4ie7ZRn9m6qayP4PQj/pgEB/XSzl1jBcw/haYSTrWJGmgketFbquVKxzwOUJ/Fc6fPI6ZqI4IXbnET4Cd0/YhasQLK8FWayPFk/dxvWnWexrVeF47jQXT4yX/ew7k0qnF5eRJw+KAgsqaxGr7GHfEq6u0Fdmx2rbCu0n9dnd7Pnwm9XpGFCTapPQrECOSO3m1yqDNR4PbiwPi3qnyRcuvPIHTdGTUpaI7Zp5KzhD/sph7tsQhIu4h84oULMTL6ngQlxsT/9cnwyhIh1T+8S/PKz6yHGrzYRuzNfVEdKZ1QTzxztzI6xMv9CcmEj07VU7PbXBnWhuArhWDLl7B2g1IsRycjsTDD2FYlNn2Cn3j7nx1yhuo/LOzNwDoDDTufcDDc6+30Uk3SHC+EJEwp8GAIvShLu0xV3AVAhNkIF76+oqSE2lY38cef5m4FQscrmCPZ/U+dRvE8N5bPHznBL3eW88fvtvj5tu5eb3eude/CIeB/8Hr9/u9o7Uzxwnt4FzYuWED6u1L1/GoL+3gDO3cBgbUQXeoPTvpPc/OrW9AjTtEbSe9h+3cAgPq7Zvc8ajtpPcGdm6hAXXYHWrfTnq/b4f60oB60CFqO+l9uwLp+wbUww5R20nv2xVI/8KA+rI71IGd9L5dgfSHpi7TYXMM7LQP7CpkYGyOHXbHwE78wK5EBqbu6HXYHgM79QO7GhmY2qPXYX/EdupjuyKJTf3R67BBYjv1sV2VxKYG6XXYIbGd+tiuTGJTh/TCw59Kp367WT1J9z0fWm/Sjzk8beJ/SFoy4wuIpnL5L8XNJ9D94j+2yIHTnhcAAA=="}'`,
	},
	{
		templateName: 'ApplyOffsetMatrix',
		displayName: 'Apply Offset Matrix',
		functionName: 'rig.applyOffsetMatrix',
		category: 'optional',
		description: 'Applies the specified offset matrix to the selected rig node entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.applyOffsetMatrix","version":1,"code":"H4sIAAAAAAAA/+1XW2/bNhT+KwSHAg0gBHWauZiAPXR12gZYkmJ291IXAk0eyUQpUuPFtWv4v+9Qsh3JidPYK4Y+5CEXHh6e833nRmpJJ8rwL46mn5ZUCpo2a5qs/6Y0D5rjktkClVDHQ7nWxv9qSTxVLxIqmGcbLZQuB2+z6z9G6Xn/VS/hpqyMBu1duhzTUmrgluU+5cF5U2aalTDGszD3lqF9bpSx6Zj+0h+8eXXx25gmHrdQ8Lqq1ILc5LkDT66Yt3I+pqvPifRMSZ6+mGwUUZq0HYHmU6Z9iRCyQkn8bWZgrRTRb2/S0UXfUfppOTFKRJsbOF+nyA3B7MIsLFt0MUpwxE+BuAq4zCUIYhrMZY2ZeNNsgwLucdfKgmgjgCA+6fH06Q4tM8mD4wx148qhkS/gp9aEYtphnQQtwCLBWnH1eYXgg/bpWSJF2ibptMxzsBkUBbqiq1VCnTKepi9WyU5+K52BaiU4ZgvFDaMmCbjrF1WUKuk8rioVLFM0zZlykFBTeWl0SyDAcStrKR66aQenhaV3B8tEZZ4VLTBmY+NtNBxx4HZKLx15L4UAHcuXr1XEAqFLvlvgt/7O+jFia9sUk3LKYsHdtJnWkO5rFplnM2a/3y6N0sPBdNyso6nhwdzoUN411ut3YhgpbWPwJ+ZnKL/BxT8BAxbRevQ5CT4evL4ZtfhZxrHIonlpsUwjyqoO6DrV2thyfzi40d4a9f14xNlwl8OlnmHti03DOIScEJhXTb+cz8/J817/5PTB4OwvlgHMQCEbuy2YD2BL6VzcbkXrg8VRMYBJKO5h1qqbswN8vxaCDCvGwW2dj7B9yd9MBSBXYAupi2NAvDwAxDVO463797KYKvzxRzo+PyjyOQvKb30PcTyJY5z+eoDTC2vNbaqvwDlWABn6hYJjXPe7LdU6dkQ3dEz9BT5Y/WAPcmWaOfeYJnzsTCpQrT3i18aH9f2E0MgIDeCE/vjxctCUbVy20tluww6juqov3UVZ+cXPMlvueUXcjhZsDGIsKfERcHs/d+/mp6HzNHSehs5et3WfLLK1/ePeQ89CiJc/tp065Dnk5/6urcbK3hfRO/Bv6s+QUZ3H7WjbDr//g6kUP4Zmhvs/N9M4Sg/henx5/Dj2eE/8h7d9/I54hjvPW6hP2hIpOssYoZPTPV8EQTs2A3F4yB73hbETs9/xK3T1L0qE4Y8oEAAA"}'`,
	},
	{
		templateName: 'ApplyOffset',
		displayName: 'Apply Offset',
		functionName: 'rig.applyOffset',
		category: 'optional',
		description: 'Creates an offset matrix from TLSR values and\napplies it to the selected rig node entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.applyOffset","version":1,"code":"H4sIAAAAAAAA/8VWUU/bMBD+K5b3alWUIdAi7WGjoCGxTSrlqa0iJ3FSD8eO7AvQVf3vO6fpSNIUuq3SpIrW5/N3332+O7OikTLxg6PBdEVlQoPNmrL6O6BpqWNccpuhE/qAyGtv/FVZ/KlqwWjCgW+90LoaXYffPk+Cs/OLIYtNXhgtNLhgNaO51CK2PIUgLh2YPNQ8FzM8K57BcsSPjTI2mNF356PLi6sPM8oAt9DwqSjUknxPUydgRtdzJoErGQcn0dYDrawZQeh4wTXkGDvMlMS/5lFYKxMfcBi1fDGot05XkVGJx9zyeFpgUsiiyy+zfPlC7tIKDsIRrompGJKcg5XPJLUmJ5PbuzF55KqsPJIOexOlpYvxeBXX4bEHAQtrymzRSo6VOhEW86gc1+wvqXLUUSIRCQQMgYUgTigRY3hiZUa0SQRBxSSg0+A4VOdr5FhqCE6ZTIKm7E7LNBU2FFmGoeh6zahTBmhwgvm1S63QoVCNWvOFg2ZMVTvFQRqNm7AsvFFJB7gqVGm5okHKlROMmsJ7eQPYEteJcLGVlRHPTFpA2oAHmj4zsmTk53xARiLlpQLnVZueMOI/80GD8vBQykqkMDZwBM63iETsC1SHNSNPe4gzMmxxPz2UO96+Ev9G+q6GeEPiIXLs0nx/KE2s5MWRNB57qKOIfLbDPlIh8KxB32yjXntqnjhuB/TGkS8ySYQPz+PaJVlisjLuzuzGpZ77zquxvSQD3/vLzQilFZm+yY+b4SO3bw//jVO3QKphslHKxaaWXYtXezvDgM1brK/rbotFJkgFh+r9/c3IVar4JXrUsre60Of8W6SPr+Xp0UMT/ehJtQUyFq8KhvWswsPey17JNi/G1+rB+BPVesHa83AP1u6o6sXqDKo9YLuzo78w6rbfg7Lb2r0o3cbeg3bWrfzqvxAnapH/riaOVv6t4rryb+3SV/b/r7D942Ir3Hz9C7a8HNg7CgAA"}'`,
	},
	{
		templateName: 'RemoveOffset',
		displayName: 'Remove Offset',
		functionName: 'rig.removeOffset',
		category: 'optional',
		description: 'Removes the stored offset matrix from the selected rig node entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.removeOffset","version":1,"code":"H4sIAAAAAAAA/81UbWvbMBD+K0KjsIIJTdlSpo/ry7YPe6Er+9IUo0hnW9SWMuncJQT/956UZHGysNJQxr7YvvfnuTvfgk9qp+4DF7cLbjQXS5lnq7fgRWsVidKX5EQ+CM3Km76SJkYlIeNaolx7kXZxcZV/eX8j3ozOhplyzdRZsBjEYswbY0F5WaBQbUDX5FY2MKZYmKGXlF+52nkx5q9GF+dnl+/GPEMykeIaGvcA7GtRBMAx7+4yg7I2SpxM1i6kzfolwKpKWmyoeF7Whp6UwXujY8XhZMuXqkbt7WLiah1zroH8qogVwdgFWHo530UXGFbAiJcHzVxCyhqJ3sxY4V2ztEINCsnuTcms08AInkEDYbDDyk2KNihJvlEKlOYesPKuLast0llrNXjilxy7u46wtxbFaWa06HMM1hQF+BzKkkrxrst4qB1ycdJlO4Od1DnKsjdaN0XjLFmuZB2ADNEs+KfAPhqtwcZdUSsXPaepGrW7TZt6p6OIcpWbUyMGPvVvOVye0OxbytSpeb4q9OR2PkjfYxA3jZRHbWs0a6jxNRmDctOojd37a0Nwhn/mWmbZhA0Trd99+AB4nrb8JrUSCS6xE/x7WoHo8w+Ykv1FaOZk/7+Zxp/pOVwPX4+XY0/rni9xPMF772Din3NE4a97qI/7GqO3xNih48HyMH1Od+nAI3BJQ/PAEoz1KaCEqmLX8LMlU7y5/ZPwraWe/JA+7OHeuwtvDz9EpaWry85l0j237mh7oJso0j8C5LGnGiwHAAA="}'`,
	},
	{
		templateName: 'RigComposeMatrix',
		displayName: 'Compose Matrix',
		functionName: 'rig.composeMatrix',
		category: 'optional',
		description: 'Creates a transformation matrix from TLSR values.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.composeMatrix","version":1,"code":"H4sIAAAAAAAA/+1ZbW/bNhD+KwKHAXWrBaHsOas+rmmxAVkHJPkWGwYtUTZRSvRIKk1q+L/vKNubZMmSbMlyAiQIbIm6l+fuHt6FyhJNufC+KeQ+LBHzkbu+R/bm20VBHHlwS+QMhEBG03AjDVfJitFKbmzkE022UrC6vP4y+fr7vTsYXmHbE+FCRDTSyl2OUMgi6kkSaNeLlRbhJCIhHYEufdKSgH1PcCHdEfppeP3p6vPHEbI1PIKFT8aOotZfREv2NEKrsc004cxzL6dbGVi10z5o5M1JpEPwPplxBp/ikUrJfOMSTzOy4NasPiyngvvG5hbJ9zmEBTh2Ec4keU7Bk5RoqixigVSkAiFDopmIrDDBawVShNb9zd2t9Uh4TNXFTgRiGsTKAxOJbwU636ieSxHP5pkA7TjyqYRYEsHVeAU440i7fZv5bjoeFbEgoHJCZzNwhVYrGykuNHIvV/ZOFRfRhPJUGU1NYNlUVj8vzOUjkXCz4LEkHLkB4YraSCxMgKkFnypPsmQVdG6pirlOOcZ1Hev/HXOmdJlnLeOc43tTAJ5kH1QjoY2hhyfberatH+ML65oGBJApSwvr4dK2zO/4IgXUqQuUNwN6QwNtSaH3QLWt73vQ2hbOAO7XBayaAb7zCKfVOcWAbxfioC5E2QziLZvN20nqrznEUz7RZJaCLLZevxhoBjg8dtGfyvqD+T417om3EfGfIUDm7bbYFOuGZjdvbCPJZhfeuuWtOx5K4BS1ahZM1vuzolmvhQr2mvLEJt8RLW0UURzmLfQzW9yE8F/MN1DAO/aDfv4nhgQZhBpCmcZJRb7+fZ+KSRIPGp6xziT1wBQkN0nghgsRNNT9KVBUnzUHl6VtrlIl33AqVfrZTK/Hj8l3aU49LtY8rZPURrzijXM6ePW8ap6Dc/CqlgrOtPaXTUX11uJayAE+nIr4cCriV9Ti5FuLayEHby2ujTqEjevwMxxU5+8ynwyOmk/vlI1779cr+Jf1t/N+84zbTi993csL9Hvp695eUzJlShaZkilTMjHV630oxOtsneTA4Cq0g2K0OSg4i/VDTmBQE2u/FtZ+3kUWq1MTa78or4NsMObn8E3ZMX+qKlIeZbfsKeB6Gi1uwvUO+ONkoZRzHef4U7NDvyT+VEbpnLf7OIfsaNwpe47hupPLbO/wcb2xoMFF6Wuno8lXVc7yFHU9+gq2ShpvQR2ObrWnGH5OFkr5VsGnG375l4Dn508Ho69F9pxn+LXGn4bDb/ja+NPO6Dtl9+lg+B3LnvaH39WBw89JK//WEfkqU1T+90EH576dgpZvlbrjpJ3Rd8xWcYpz2/bw+/gC+dPB8GuNPZ2MvlPyp+Hwwy2+euqGQCc6+LXWftqffS3Sp/3ph+u+e9qOv35G+4h3w7jmaTOjU/OQmdGpebDI/NdluP8t9Hj1L5vzkk3TJQAA"}'`,
	},
	{
		templateName: 'RigConvertDisplayData',
		displayName: 'Convert Display Data',
		functionName: 'rig.convertDisplayData',
		category: 'required',
		description: 'Converts display data into the rig helper format.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.convertDisplayData","version":1,"code":"H4sIAAAAAAAA/+VYW2/aMBT+K5GnSq0UVb2t1SLtZUDVadNeNu2lVJGxT4KFsTPbaYsQ/33HIbAQLuXSjnZ7gjjH5/J93zk2DElHatazJLodEsFJNH4mYfkZkSRXDB+pSdEIbRz0S2v8Vqz4XcVDSDh1dGKFq8Pmdfzt04/o4vLqNGS6n2kFytlo2CZ9oYAZmriI5dbpfqxoH9q4Fx6doeifaalN1CbvLpuNq9aHNgkdvsKFhlb3YFzQFDaTdBA0MWabjO5C4agULDrpTCxxNaxGQoc+xO2woyX3dpMYD11MGCPUY6eGDuYC24CXkX21gVBOB64LgRFp0AWZgQkSbfrUHdey0p0kt4w6KGJbZ0QPXNfoPO3OJB3mioORmLY3HN2NMM9cueg8FDyq1mOVSBIwMaQphiKjUUis1I5EJ6Owxk+mYpAVgjzauMzGJQH3IOJrN8j88j01+JDJ3FBJooRKCyHRmRNaVRY4WGZEsYp7GhNXBSyVZE7XTYbP5MAFcxsn0ZwNfTYXuiNjR9NKbD3Zeu39+fD4OiKfbXAjOAflpc9KEz7ATAWrN0cl3qVnq/RNUBDHJcClVsfphUs6zYKLx8g/0Wxjoxp6QmW5+wIDi68s0wWGXkMrZeEe3bwn26VcP8RUupUsLt4LEJearjmY52Khgw5lvRT3Kx4XXRibtFPxcr6eF28Rl21a2X2x3u5U6geh0loB7wtup2JoGMBW/iqseylGde6el9Kd6Nydys1p7GsO2LB+IGxL4j4JnDZ/McnWZnDb9p7ndGtZnS2CqqjjZaGaHkRLwdo4LwMZGm2ZVg8GOzN3T2UOO7PGV+JS4+tamxZl3ZZyZlBBxmBDQtEqwgBihlrIihOuPHJLqJZCKZJX0gwraTmdxcIHvKEW9b4BEgovcHuX+lpj7gA8yYcVdMMDDHuIEB0dbS6zJ8Ra09l3KCL+LDatQpdJPb5crQMv+IvYc3G1k2Y3bP/FpyBeA7tOgbWxRoqM4CvE+vF11L162KxZ+KTa+A8Cm19AnMlX6G8qvtavHK/v/2SDV/QzTm8/Pf02ELK9wevAByt0RssF+Mw664lsh8G546Dd+2z0d/S53wb/w0hcUvhaToo/Pv7+THwTit7TWNrmkvp6r2NP2k9+J9yNfgPpMZGEPxYAAA=="}'`,
	},
	{
		templateName: 'RigSetTextDisplayData',
		displayName: 'Set Text Display Data',
		functionName: 'rig.setTextDisplayData',
		category: 'required',
		description: 'Applies text display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setTextDisplayData","version":1,"code":"H4sIAAAAAAAA/+1ZW2/bNhT+KwKLAs2gBk62pqiAPqTxug7r5cHG9lAHAk0dS0QoUiCppYLh/95DWrbli+ykdtvEm19sUofn9n0fZVFjMhSK3RgSfR4TnpBoOiZh/R2RUSkZDqlO0QhtLOS1Nf7yM26VH4QkoZbOrHB23H0bf3zTj367eHkWMpUXSoK0JhoPSM4lME1HNmKlsSqPJc1hgGvhi9UU/TMllI4G5MlF9+rl768GJLR4CSd6YIM+/gy63BSCVkEXgw7I5DrklgrOos5wZoqzYTMUenQxPo+HSiTObhbkNsOMMcRq8FTTahH5sigEBxO4YZDU0V3JgVWBzSAwIIBZSAKskls0PV3JSw1HpWEUTdzIWM1vwGZalWm2lHZYygS0wMSd4eR6gpmW0ka/hjyJmhUZyUcj0DGkKYYik0lIjFCWRJ1JuAJRIWMQDYxcw3HaD0Niq8KPOLM4KkSpqSDRiAoDIVGF5Uo2JhIwTHM/i4scAI3QZ2uhhyK2NG3EVrOlb50/Fx4vR+RPE7zjSQLSEY7VJkmFmXK2SslFvPML16DaN9E8PTVgHUNqgkzTC1v4zUfxv1TvZvjUaHPzDFO+ew6wrRjYL3bdiUN9qX2umnn5XUTkHTV/QdWoQVOGxHGuuEbG4RQmIBcwSqXz9pI9O6u4DrGzcifc9ayfohddPXOznrcnWwtvZ0Bflw0CyAw0t0HPVgJMkwX9GkyHa2spDU68uEcKH1VgCsp8wGkefn/5m4oSgg+gUy7TfXK5WEZ0ZbnF9oODsOd3D792C9BMqKli7oL0zye3WxXf8sRmD5nissy3M3xRxjLPNwL7Ho3/8SUfO7oKZYN9ftTQ1jXcAddPdbXHjir+W0nlD8UUb9h7FD3Nd9+qm5zwHk/aW/D6YPRsvytdoSfQy7ekS5dXjhc23Y4u6za0ZYK943Qo4Juauft2Ngt/3NowGU3U7SMSR53wIdUxdfmT5YGs82Re0kdvVuwaO+dX9lNHWzd3y2OewJHrAyCun2gfk0gaWR9UKQu/D0wuPYDni4rX2QrQz3S5v162NfYOopmncdyqGWIBKXZJJrE/etp6mrLLAxVF1jyPOb/HozCqMriUVeCkOaPKVQbsJvigEiAbNWzWW9mObHPZobT/P37L+AkR1LA8EgDvucvt3HZX4dh+NrX5CTGnNnvW4tQjdPLLWaezZVf3e9ib+aLvvIeBO0f9jwjqgZ0w/Ag6dk7PXxwl1Q7R6ycd/zlCkX9v+xUwGBUivtsLv2+S/vprmj9AguZs6U3N9eQrZN1mSJYcAAA="}'`,
	},
	{
		templateName: 'RigSetItemDisplayData',
		displayName: 'Set Item Display Data',
		functionName: 'rig.setItemDisplayData',
		category: 'required',
		description: 'Applies item display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setItemDisplayData","version":1,"code":"H4sIAAAAAAAA/+VXUU/bMBD+K5GnSUOyELAJtEh72Ogo1TReQHuhKHKdS2rh2JHtDKIq/33nNG3TdikdhSG2p9aX833f3X13TSdkJDW/tSS8nhARk3B6JrT5DElSKI5HZlJ0Qh8HWeON32qLv1UfKImZYzMvtE56Z9HFl6vww/HJIeU6y7UC5Ww4GZJMKOCGJS7khXU6ixTLYIh34d4ZhvG5ltqEQ/LmuHd68vXjkFCHj9BwCS4YYPygJ2wuWRn0EHRIqhsqHJOChwejmStaaRsKI3qM68lIy9j7zUDuxsgYIVbBU8PKBfLnPJcCbOCzC+IG3accOB24MQQWJHAHcYBZCoeu+yu89CgpLGfo4k/WGXELbmx0kY6XaNNCxWAkEveO1U2FTAvlwvdUxGE7I6tEkoCJIE0RilQVJVZqR8KDiq60KFcRyFaPfMHRXB8pcWVenwR3eMplYZgkYcKkBUp07oRWLUMMlhtRW/GSb0AL+nANeiQjx9IWtp5dPfPxPDw+DsnABucijkF5wfHGJS6RqeCrklzgHR37AjWxiRHpvgXnFdIIZEqPduhbJNFPZh5W+NTp98WzXNfV8w3b2AN379aD1B7t8vls5un3sCPnzH6DspWDYRyF40MJg4pDExJQizYqbbLulLE8O+TcjPrWOT+icOsK2qZwR8uF64PztfvBZAHdtagntYyaW89TkSVag0aVg+klh4DgG3hZ7w7vs6nNXOrpvGzT55eXdqZjwNn3ZF+PwFukd83/LcrLlO+8lS7C7nUX49OTKbV7517gr/B85X73rIKrabJrIq2fNg+7eGANBRtJeHxR11b5Rh7/9sSkUt9F9evHX52YPxTXg2JfpLHXvQqb5vbR97TO+H9orlDpK9qFM8ZPuQibmC+8BVF89daaLcL+PNM5DfynsbDutv4669i9+5bQn3MuOJMy2u5v3qNGY/3lvA8KjOBL7+c31S/kAA5pjA4AAA=="}'`,
	},
	{
		templateName: 'RigSetBlockDisplayData',
		displayName: 'Set Block Display Data',
		functionName: 'rig.setBlockDisplayData',
		category: 'required',
		description: 'Applies block display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setBlockDisplayData","version":1,"code":"H4sIAAAAAAAA/+VWUWvbMBD+K0ZjsIIobTdSJtjD0qzpGOylYy9NMYosO6KKZKTzWhP833dSnMZJmjbLuo6xp0Tn0913330naUbG2oobT9jVjKiMsPma0PaXkbwyApfcFeiEPiCnrTf+i5awKy4oyTjwhRdaZ4Pz9Gv/G3vXOz2mwk5La6QBz2YjMlVGCsdzYKLyYKep4VM5wr3yDhzH+MJq69iIvOoNzk4/vR8RCvgJDZcSkn4AlwyULzWvkwFmHZHmmirgWgl2NF74opV2c2HIkORqNrY6C36LLLcThIw51rMXjtfL1B/LUivpk8hNkrXpQ9EJ2AQmMvFSSwEyS7BOBeh7uAbMjvPKC44uYeXBqRsJE2erYrKCm1Ymk04j8uDYXDcItTLA3lKVsW5J3qg8ly6VRYGpSNNQ4rUFwo4autak0qRSd7oUKEdzXFICdRlXSgCuSl05rgnLufaSEluCsqZjyKQXTkUrbgod6KQ+3kg91inwopPbLraeh3ghPX5m5LNPLlSWSRMkJ1qXrEakSqyLcpnvpBcIamMTp4pDLyFqpJXIHB/dInGVpz+4e1rkc6eH2fPCRvpCxx5tAtzBZpA5ki6BoZ57AgbYkwvuv8i6U4TjAqUTYimHmkMTIjDLRhrrpttrRoJ+o+hFtJ2r3oO6TRHtRN3JKnVDCYG971xXcjsbcVrrtN31Qpw8WM5rhOLqN8FKY8TUA54W/mC7OvqtyPstAED0MujhMh5Gwekx1Qht5wO4i2z+/qgU2t6m8Xh+0Xn5RYU82dtlGQcrHKzVERs7RN+zWPH/0Fxlin/oJFwgfs65b2M+MvIfnk2o2y9mFB8f6+XVPLyv9B4GPsWW1m0AkDYVA+3H48Yt/3D2PzkXgmud7vYO3ms0Nt8uQ2mkU2Ll9XLd/ARkUgsFrQsAAA=="}'`,
	},
	{
		templateName: 'RigSetGenericDisplayData',
		displayName: 'Set Generic Display Data',
		functionName: 'rig.setGenericDisplayData',
		category: 'required',
		description: 'Applies generic display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setGenericDisplayData","version":1,"code":"H4sIAAAAAAAA/+1YW0/bMBT+K5GnSTBFqGwTaJH2AHSMadoeBtoLRZFjnyYWrl3ZziCr+t93nKY0vZCOSzdKeQK75/595xy3A5JIzS4tic4HRHASjc4krP5GpJsrhkdqUhRCGQe9Shr/K2+8VnkICaeOjqXwdtA+jr8fnkXv9/Z3Q6Z7fa1AORsNOqQnFDBDuy5iuXW6Fyvagw7qwrUzFO0zLbWJOuTVXvto/9OHDgkdfoQXp+CCz6DACBa0he1LWgRt9Nshw4tQOCoFi1rJWBpvw7o3NOrdnA8SLbmXG/u5yjBo9DLrPzW0mDg/6PelABukVQC8CsAnHjgduAwCCxKYAx5grsKh9M5MaDrp5pZRFPEn64y4BJcZnafZVORhrjgYibF7weHFEIPNlYvehYJH9aSsEt0umBjSFF2R4TAkVmpHotYwnAGqr2KQNaR82fG6PIbEFf3yJJjDU1/mhkoSdam0EBLdd0Kr2gUHy4wob1HJY1BzvTvnOpGxo2nNtx6rHnt73j1+HJEvNjgRnIPytGOVCC8wUsFmiTnx93bPF6iyTYxIdyy4iicVTUYRhrcQXXTjX9Qsp/pIaHH9LNNlAT1mjTC4azdv5JeAq9hQlcJUHX1aN3VoIzQn1H6FopaJoQwZ5A0Kg9TDKwxDTfBU2vRuT7ykaRFXLpbmr/LefOiv0YgptvxtOElje6oGM3mUkPxE2R9lxh59k4IP/rRsIC/XlCKTekSav8nx/4ObCCkTTQ3/p9hiDzwg8UnMD82+zo8bq9u3l+Ljo9G1YeqIa+A3U+dwHFVw5gs7T9XDWjFuiwWrKGgi4d5lnZtnTVE874axGeXaDxIuctu4WJrUcbuCSl1W3xR32EzYjsGBKgLfk2OmHGXALoNvms+wZNy8dr6MTbBO1B6r6V+wm2AnZVBBsibgPfY2noJiuxHKxbZ61GVbCyyO0dl+s9tqNYzyanCdllornlrg35Gb0Ebr9iZ8KAuRYs+QYY9R5d3n1tKrln9yXZ7gl9XMKbA2HgV1531Zs2Avi5enzqait/GPnVkw7vPeWWwOkVk+EA9v5NdpCz3xHlq3p87qODhn7jmxcIUwzPTuWg+CjXsdsVyiYhpb8RviDHxd775ip4xcCf7ye9DGg7jxb6X5cj5wSC4AefmkPBopnaLOOm2rp99S6/Bsar0Qbq27f/lvcius9orkL4Z/AHzpudwUIwAA"}'`,
	},
]

export function getDFBaseTemplateDefinitions(category?: DFBaseTemplateCategory) {
	if (category == undefined) return DF_BASE_HELPER_DEFINITIONS
	return DF_BASE_HELPER_DEFINITIONS.filter(definition => definition.category === category)
}

export function buildDFBaseTemplateItems(category?: DFBaseTemplateCategory): CodeClientTemplateItem[] {
	return getDFBaseTemplateDefinitions(category).map(buildHelperTemplate)
}

export function getDFBaseTemplateCount(category?: DFBaseTemplateCategory) {
	return getDFBaseTemplateDefinitions(category).length
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

export async function sendDFBaseTemplatesToCodeClient(category?: DFBaseTemplateCategory) {
	const templates = buildDFBaseTemplateItems(category)
	await sendTemplatesToCodeClient(templates, textToGZip)
}

export async function sendDFBaseTemplateToCodeClient(templateName: string) {
	const template = buildDFBaseTemplateItem(templateName)
	await sendTemplatesToCodeClient([template], textToGZip)
}
