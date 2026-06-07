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
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rig","version":1,"code":"H4sIAAAAAAAACu1YbW/bNhD+KwKHAPGgebXXpZjQFsjysgZoimAJtg9xYNDkWSJCkQJ5cu0a/u8DJb/ItmxLdpJ2RT8lksl77p577njUmPSkZo+WBPdjIjgJ8mfiT/8GpJ8qRnxCTWhJMCYCIZ6uRoizN25X9uATTpHOVpGAjM8vu5/+vAten7xp+UzHiVag0AbjDomFAmZoHwOWWtRxV9EYOiQYwxANDe7HTEttgg756eT87M3FHx3iIwwx6JArJdD7W4QdMnnwBVIpWPCqN/u1QyZ+0brUxpm9H/e05G7dzO7nSCB0iL+KFxo6WgYTVIovYD2MwLMJMNEXwD0jQo8q7gm0HlUipii0ss0Vr3Svn1pGETJsi0Y8AkZGp2G05LSfKg5GCpUtnDxMfKZThUHLFzwoxmOV6PfBdCF0BJDJxCdWaiTBq4m/kpNEdUEWkuIYdqnixCc4Stz/OETik0SmhkoS9Km04BOduFAKLzhYZkT2lgTk6ryA2lpD7cku0rAAq2cbL501h01DZ8Z6HwTnoJy42HQJHykaC7YqvwVe+8RxM7VNjAibQglsGhGSzJMyBTMqZbeajAfUrBPmUI4G1BwL3mgqzcESn1imMwZTZekA+NZElFqda6ZgzOV/K7mllgbUCKrQbjbULiVtFtNm5kS/myO+CG3Ox7kS/qEyhSt7ESc4KjhoKHsEp1kuDDAkAdFJJqGpoJU28RYlaIVGy90BuV61HtG15iC9t1nneD8LzXtrwAK+5xqspzR6ER2AR9XIy2JublXG5mI5hwFInYCZF8wNmFhYmytmztONEQrPoZeGJXEWFNCugX3KuXebUJZlLAe/gyF6WU68azChUOE+TvxWw4lPWi2axQcRRlKEEe4J/LoW832aSpxj3+pU8X1Af68B+i81Ko8tB70Ga2kI3i2OJOwDfrJcToVt24qJSZ236CrVdFB3qND+vr+OUJgTfrSFH23h+2wLFvCppoaSyWbveWv3lNRa5uZdpRBnq88MUISPwuJTjUtdwXdPTF/PRakZRW0O89JAAhSLTl5qc0FZtKeHjrdtB0olpdQcXOtcge5Muuhep1Lqz57Lh3cWURVmOCVErJC1Us3VT8LZ/hqS+QvwCiG+y6LZNyHN7MZ5WE62J3Y9BfnFdv3mu3wnenkqslR8E2RknlSkYzHpLZrjC5JQ6v+0/6z076eaC0sEcJokoHg27Lxs/6ysia2FtoudWmc8uC85/x+uKx6n3wLRO9fv6uKLI3XPW1n2JfbgHpVZSih7pGGtXrXvZbG9PLxNT88LhabOZbHGEXmoJl1M+dOc9EZTggoxeqrPi/vwr9J43VhrM9E3OnETTF6qz8TbGivPK8ml+FxwH3P85yk5USeu0uwcxRSj40xKOVONX9uNzRFdpxJFIuv0769dFkdCcRgeFxPoF6IWjZ/bv7QajZp1UzpWVIBqbCH33UGtvPKOh8l/K+m1KrkbAAA="}'`,
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
		description:
			'Spawns an instance of the rig at the specified location.\nAutomatically applies animation "default" at tick 0 after spawning.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.spawn","version":1,"code":"H4sIAAAAAAAA/+1Y227jNhD9FUJFsS0gBEk3zaJC1kAae5E8JF1sgu3DOhBocSyzoUiVpJy4gf+9Q8qyZcsXxZvtBciDL+JlZs5w5ow4T8FAqOTeBNGXp4CzICqfg3D2GwXDQib4SHWKi3CNhWy2Gv/5EbfLP4QBo5ZWq3D0qfshvv71Njo+eXcUJirLlQRpTfTUDzIuIdF0aKOkMFZlsaQZ9HEvPFpNUX6ihNJRP/jupHv+rvdLPwgtTuHATU4fJPnE034wvQu5pYIn0eGgmsbRsC4eZDKi0maoOE4Fx281Bq05c9pwW30tanSjX54GSjA3WRnxMEJEaMKqcammkxXLDKGScGkslQkQNSR2BETzlFDr/5ocEj7kwAg6mFqu5MEKEDUYFganwJtgrOb3YEdaFeloCWdYSAYaIfmF03Avq9+cFeh9tCOhQkwIzXPBwWHgmTeO9AMGQ1oI2w88BJ7ck0OC3gKNWBAwl+nBm5cAcDdFywtpo6OQs6h+Lkby4RB0DKk79GA6DQMjlMXzQ9TLgZjLGEQtEl1Y4TCePrcIDGfsJHcjY6rxIReFpiKIhlQYCAOVO8y1AQYm0dyP4p5eJWVhwVFbC3Burts+2v10T8hlt6b8p7bKM8X88Ffov3IiltW/baseI32hvHx4nvIy56uEqZlw3NYEU+S5BmO6RQ6/U+2idmGSLDx5lXEej6koYC5vNrcs7dCbsBGD1UUTwswAghZgnmB2kIUdUlkn9lQD6xySU5egnffk1Cdw54MTT04Z1fcx/bOgnZ5/Xl50iyprfvm54ZeBiC1Na1BUZZmX75yB01FwacgFZwykI/1ktoRNEDhPVstCLRJPXPrOZAdIdweeGwJvxrqywodxmYE7Cku5aMX9Tv73OPODj+sfDyT+uNQ2ifLnWUhDx8CWiMKZN8fzmereIzfWbaIWCWpQ+AO4/u22ZrKmCRKXU881JCgFfeb9UoWN0tlmhImSViuxG6IrjE2MZb7NTrcGlmCQGLAdppCmMW4IOCAHW0lx89l3YQwCUen5+X8EnXFj3HTNYR81Vs4uDIp0DcJaGDQZabPuM8YIJnZSsrJXfoulgXx2+UeuQKdlcjzbiCYvbTbiGl9J5uoveDoS+LF7Km6y0TbPe7aZ677B0sf2UfqcVO9prRZHfYV0RFMgN3YiYB/VJ8tZVdu2R1YsifoEttByay4mQpW01SYZ/226wYi+NL0st5P/Hb+MEBu+D06Ih/1KNK9E80o034ho1r+kVjTjLkpbs2/Lq2p1WVnC/v7FuMiAwE2xGvyxG3l5+Vh3QYk524pvrc/8vWqDi1bwVte3c+UTwBSDs2rqgppz34e4pVtiqu3hpu4OUTN15sMb7yV3qb7hf5VkoFOwtRx9ydPt/FcqzZlvfzxwO/INEM6Wqg5n85JDhQbKJuUbrQnn7QWSoW94LnwfxSwkGZTvxPGyUCEylWUgGbDXKvVapVoorTUC/rk69ZUFZivVrpQ2TKqXU+wahHG7bvBaoq614FpXtD0Yv5WIqh+2QUozbddKKTtZG2S8XdsQmd0dvpmTt/mmpXt3+Kbp4bUFnTUqWtOpOytak7l2bjledXvZyUYEd9O/AQueznDtGAAA"}'`,
	},
	{
		templateName: 'RigSpawnNodes',
		displayName: 'Spawn Nodes',
		functionName: 'rig.spawn.nodes',
		category: 'required',
		description: 'Spawns the display and locator nodes for a rig instance.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.spawn.nodes","version":1,"code":"H4sIAAAAAAAA/+1Z227bOBD9FUGLAjUgGM22TbEC+tDayW6wbR4aty91INDUWOaWJgWSSuIG/vcdUpYjy7Ys37JBNy+JRZEzZ26HQ+reH3BJf2g//H7vs9gP82c/mP0P/WEmKD4SleAknGNgPJuNv9yIXeUeAj8mhhSzcPS+ex5dfuyFb07fnQRUjlMpQBgd3vf9MRNAFRmakGbayHEkyBj6uBbujCIon0ouVdj3fzvtdt6d/dH3A4OvcOAqJbfCu5Qx6L4/vQ6YIZzR8NWgmICjQVkBCDoiwoxRdZRwhn/lDSjFYqsPl5Xnok47+v1+IHlsXxYwbkdoE4KowksUmVSwac+MwBMWoDeUyiOeYonHhDZEUGhXQMvBMNOUGHDqtFHsB5iRklkyWrApyEQMCuG7idPrKULLhAlfBywOyyZowYZDUBEkCaryp9PA11waNHUaVKKWigh4KWw2BjiMjmKGgcY3ZpLakRui8CHlmSLcD4eEawh8mRomRWkADaaKuVFcc1ZIeUBw0hQBvpvrNndmN90T76JbUv57U+VjjBzfT/9nK2JR/eum6rHuHpTnD9spzwsEVxI38ADhzRKEAY8MSUoYZCGkpzKwMPBt6F9o7y8WxyAsEdDZjHiCgBmtUkXJ4ac2S2eifayBtrbI2q4yfIdlFeEoSIGYzZST52TFeVY2jmoqc/dhVdRWwEohFuoLfPPSZUJrBvhBaiY0uYG4NrEbevYD5/LW+8S08TpIUonTM3fxuVRnhI6WnbPk5KUlD+5VhCKjWCRMAcUlCMVFcpZihch18dBgotxNuwak7cb2jUp9aE8W3fAnGHTtBQrtkaQm2diwmW05CVQQvUCiVJOXcxMD69FWrWUr5bhSlWq9Ne+3CKeQanysYFYLw/1mcas9s0C3l1xi30pcx0RtATXMgZwOm6XA+yfmBewbhB7a6GznCJGNG6ReDEOScROld61aXtpS2qRVu4NuKe1nq3ZD3E6aWrB0eW/bUtqCpW8XU6mjkCHBsvT6nKKE86hZs7wyq1zLsx9DFo3L2vpoxEarknchCSqbepbG1jkFh9UQFeVSQ1OmAuxsDkZ7T4LmczCPQPIJ6otmcndLxlqePdB+vVsyOhsjPEoZ0MtpOXem64E/2rldptO6nYCjfyM5+GeFpxYkfiLa5MeK43FAjFg5mXQP1S5taLxOqqVMpcCTsemWYPzXtlZPEGDmUV2G+Ew5FTn29uD/wzjO2i0Yx95INfE9iq1vg5oeo8UIFDPelZnwxYOeo6se6pnl9RrXljC83QLEpfTw5E3zCx2HxKryvhGegfcZFDbnyX5oTlewb1nAM//+OvxbiusTpt+nwUhb3Vm4qrFXFs8tyy9WMkVQ9y+ZfUvMZcOj1sX6bencXl7Pt6S/AVKvkymFGL0v0pACYpHNPcz7VCqz1pz1+1FpqUGTwfrtypWRW3dMb204kzfs4zacyatEAqbjPqr1nOOPaPJKsM7kiO1wvVd3B/IEbTzCDc2hbNzvhrP0AbBx3iaor/w1a8ZHX79edNdgX2f2hxT3+dh1p49+hbvC8iZ3tLsV7QFdWL3+ANwRqdnow6adxBdAfx9z2yo+Ql1P/wUMhocAkiAAAA=="}'`,
	},
	{
		templateName: 'RigAnimate',
		displayName: 'Animate',
		functionName: 'rig.animate',
		category: 'required',
		description:
			'Sets the rig to the specified ticks pose.\nResets the selection and restores your previous selection.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate","version":1,"code":"H4sIAAAAAAAA/9VWTVPbMBD9Kx716mGAUph6poe2gWkOpR0+eiGMR5HXjooseaQ1bZrJf+/KToKdOMFAOfQSrNVq39td7RMzNlZG3DkW3cyYTFhUr1m4+BuxtNSCltxm5EQ+CPnCm74qiz9VLUKWcORLL7LOBmfx+aer6Oj45CAUJi+MBo0umo1YLjUIy1OMROnQ5LHmOYzoLPxGyym+MMrYaMTeHA8+n5y+H7EQaYsMH7XMOUJwIbMRm9+GErmSItofLx3IGjYBQIsJ15gTdJwpSb/mHqyVicejY01fwvTWm9nYqMRvLmn8mlBORGKdXmb59IHbJaALcAKBlVmApvp0BQiZSkgClFTpoDAO9taYm3FaOkFZVZgOrbwDnFhTZpNWYmGpE7CUQ+U4D59J8wLckqgDBQKl0QHXSWCBekE/wdSUNigs3EtTugenf8T7dk6ES43RYSiTqFl/p2Wago0h881l83nInDJIfaJk21eu0DGoxp3zF8jfxIRsOC38N9dTWhSqtFyxKOXKQchM4TNpGBJwwsrKSmdONUqcBsNBA/ygL3huksq8wMff+GT8rz5EG/6wLzyn0XgZej1c/jq0GLztywAf4HWZPxn+SuYQSF1PSgP/qHf3NYIt1kkkkPJSYXzPVQmrEIu9doCDCnUra7TlBulhhWlUXbcO9u822I9VjDxroJtlsDOP6PnTNoV2wReZJKC9AouFSzIlrlKsa3Tjvhz7CVvEZiRFe7zWTFYR6VJ50gOqjn1c6GuntaKt9IG2nDBV5f2w75zfzLejEWvRscuVIF0RFcDg+no4cFVF/JI8BnU3W/Pp810V6MP2PAVXKu73pHVmWqlL7xQ7Qyw1YkuUTa3pjLIY9S1BNhWjMwhuj7A58d31WM7bljBHW27injbVI7TrRvp7EJvxz45Wtdr9SCCZvvbNbrH54TVm6E7zAv3jw5EexXGJ/uD5t6sGTcsFPZYeUlrCIBOF1w3pMjZ/ZnleJ7Pvik/BnvvjLy72o8N/Kf/A7qHfHLdOQd/vpxP/XTfq/1O8OO7MQihTvyedafT0v53/BUkWducoDAAA"}'`,
	},
	{
		templateName: 'RigAnimateNoReset',
		displayName: 'Animate No Reset',
		functionName: 'rig.animate.noReset',
		category: 'required',
		description:
			'Sets the rig to the specified ticks pose.\nKeeps the rig-entities selection active after animating.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate.noReset","version":1,"code":"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"}'`,
	},
	{
		templateName: 'RigRemove',
		displayName: 'Remove',
		functionName: 'rig.remove',
		category: 'required',
		description: 'Removes the rig instance.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.remove","version":1,"code":"H4sIAAAAAAAA/+1W30/bMBD+VyJPk4YUobIfRYtKJVZA8MA0MbQXiiLXuaQejl3sC6Oq+r/v7LaQlLYr1R72sBeI73z3fXf+7mDCBsqIO8eSmwmTGUtmZxbPfycsr7SgI7cFXaI7COX8Nn0Fi48Kh5hlHPniFlknJ2fp1y/Xycf24UEsTDkyGjS6ZNJnpdQgLM8xEZVDU6aal9CnWHhEyym/MMrYpM/etE96h6ef+yxGcpHhCkrzANGVLPpsehtL5EqKpDVY+Mka1/ODFkOusSTktFCSflK4tTLzcBRWv0uQ3nozGRiVeeeCxa8hlUQcltkVlo+XqbkIhxBZWURSO+RawP4SUzPIKyc4QsBwaOUd4NCaqhg2CokrnYElzuHi9HZKfCqNyUEss6TO22mZ52BTKHxT2HQaM6cMUn3TeOmlRjoFVXsq33f/gBnZcDzy31yP6TBSleWKJTlXDmJmRiiNrhkycMLKYKWYU40Sx9HFSQ38YFvw0mTBPMfHR3w1/qVP0YR/vy28fwCBz/i6ClqGnFcK0weuKnhKMfc1E7QC6lrCaKsXfL8HzOgHt9G3yhZASbVBn6xjIeu2oo6XVvco6gTpdc980qiTcXuX8vuKd0/DuXnpmoBqDfjwogEDlSIvagWYBZ+Q37eA3Am7cNG5zDLQfvLF/Eo2pnKlWN4NtYa3vUTnuRkNwL4NA8ECj1XLxYECQQM5+PnnFTNTxSrlpOTfJPkHbtcI3gkTXtyPWEO4vo6nwoO2Jbie0SGoGhwvXOfc9cL+uqa+/ZUyV5JdDMgavq0m3zOpEKxnK4NlF8oQ5jmd53zJugE423tBPSRl9PIOFXvvbk1ZSu8o6dpEMk9nTduls0+zv7a1y2rasAFWqueoxtxyQZveh0tLxZOJQHVt8xhbbuoYblfpylHx8/iWwt8FMe3NvmW2t7HY9QvjWI+jEbcYmTwKCIvdcclRDKMruK+oRv9Xt75Dwq6jpedWlFVbJJ9231wF9RCiHg+21+K2m0/3HLXpCYUyMwLbvCF4sv+2IPZhvu82KuN1KYkwR2Pdxv8O/ottR7HdTn8DLSVlG8gLAAA="}'`,
	},
	{
		templateName: 'RigSelectNodes',
		displayName: 'Select Nodes',
		functionName: 'rig.selectNodes',
		category: 'optional',
		description:
			'Selects the specified rig nodes.\nIf no node IDs are provided, selects all nodes in the rig.',
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
		category: 'required',
		description: 'Moves the rig instance to the specified location.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.move","version":1,"code":"H4sIAAAAAAAACrVWbWsjNxD+K8uUQg+W4KRHjgr64Won3NFcKanplzgssna8nkYrLdKsL8b4vx+S1876/YX0k1cjaZ55Zp4ZeQZDbdWLB/E0A8pBLNaQNr8CRrVRkIJ0hQcxA2Ism9OMZbSEW3GRQi5ZLk+BgFnvPvvrj774ePvpOlW2rKxBw17MBlCSQeXkiIWqPdsyM7LEAYgZvrKT4mmmrLZODOCn2173091vA0gZX1kM4JudYPJIxQDmzymx1KREZ7jcHcA8bXtHo8bScImGs0KT4cxO0DnKA1hnuHZWWxesT7Oh1XnYXMbwfUyMA0g3YyucnK4H5hMeY+KoSMh4lkZhwjbafIWKRoR5oq2STNZcbTCww1HtlWSM2J4dvSCPna2L8RrBtDY5Ok0mHpw/z1Nla8PiJqVctPl4Q6MRugyLkCyYz1Pw2jKIzjzdqF9lMtStAoZqhLLmkAJPq/AtzRRSqHTtpAYxktpjCrYKTFqGHL1yFK0g4M4w8TT52muBX58KXto8mht8fuVD+OzqLfhvwcM6+s2p6NqqN+zF4jzuD02ZW+C/ngrOqLGyjnu1W/hYRWLq2Gc4krXmbCJ1jStnzd66q07EPytt/QY9WcG/Ufi4RWGoM5ZFC9gu/dwHsBC6LEDAV598oTzHQEaq5kg+NbIktTlvWvW6DQJvfIOj4qq0E4QYxa5x5VGj4swO/zs+tBaK2qW6jPKD7TKRbk+zeGUXiiGDa6IPLFa0Y18Q+q418VI9/Lzc+iJ9N07Evizeh+bOYJfNtSfeznq896QZXYiWGjmeHzLGWZA1Pi+LekdfnEagR77q/91uJ+kKZBDwT8xkFPn/GfliguwN9tKm+hOxSrq1c2g4ebS8pLcivuzlvXS2Wm3X1XOyRaNskYGVo3+lu3slz/7C3IWu/3ki3S9RtB+u4gNqXUa5b+W0Nl5OMN/QwFuYTqoXjA1PDlUgYytsT1bryv2sHFYouc3q3ro7qcaX6yFwOEcT75qb7Vd4v+T6rn5T3Get7ffkgTwn3bE0BfrdSdlI3IbMTi/L8v7+Scibevv9nXQWvylfJdUvLM3qw5V1VJA5IsGTqnhwOlyv5WuDvpJaZ81/9NYjWVe5ZHxYieySdBx6z07kdeSV2RbhZb1yc0RRStvFzNwjqaM3Ds+Gg4/x2kh9RI8M8+f5DwaNlqB4DQAA"}'`,
	},
	{
		templateName: 'RigLoadAnimation',
		displayName: 'Load Animation',
		functionName: 'rig.loadAnimation',
		category: 'required',
		description: 'Loads the pose of the specified node for the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.loadAnimation","version":1,"code":"H4sIAAAAAAAA/7VVUU/bMBD+K5GnSUOK0AoMtLxtAzYkYNJU8UJR5NqX1MKxI/vSgar+d85J06YBtoxqL4nvfHffd77zecGm2op7z5LbBVOSJY3M4tU/YVllBInc5WRENgjFyppWtSZ41ULMJEfeWpF2cXqeXn8dJ0fHJ6NY2KK0Bgz6ZDFhhTIgHM8wEZVHW6SGFzAhX3hAxym+sNq6ZMLeHZ9+Ozn7PGEx0hYpLi2X0RejCo7Kmglb3sUKuVYi+ThtbUgbdzHAiBk3WBB6mmtFXzsH55QMkOTWtSXYoL1dTK2WYbNl8ntGaRGPPsPc8cdtej7CGUSl9RDZrF77EoTKFMjIWAlRZl2jBg0CScvbfPZ7CdlpVnnBySZIHp26B5w5W+WzrXzjykhwlFptuLxbEu3KYHIYK5l00/NGZRm4FPKcoNhyGTOvLdIxLONeUUuTgu5UNZSI1A58pZH0+FgGec4dCaWuHNcsybj2EDNbhmw6CgleOFVryedXE2ODPhqKXtD56Q04PuA/g1+FENHFaQf+YCh8KNRu6OvW3WZwOJRBaKDdGFyHCBvko6HImQv/NbSp6isPGadSpnOuK1hHWO1t+49q0Fe5oqueUT2vITdcPz3jOtUp8rwDZlvfMcULbGk3YRc++qGkBBNmmVhZyEdipkR/2nXa4jjcpFVo5lS+r+l6ryvIajYvTU2Vpc21+MvcbIz6F4xw3tPOh7rX9/ZFI4XW22uWoQf2yNELW5eiMp7PQW7d5kB8nekNd2cPyqMPlJCmyLTC4Hj9c9xJwnFB0yUQUo7mEqkovOlU3Lri9ZwF1zod9lz8x7T7/TEIKmC8AW3U7w4JgpyuOB2wAP/HkxWanoehR+sBd+mndmC3mYRnYvdDe0t9no/5F6HaSfMK4YPt5v4OeEm9fVNPINp6Aswf21nVCAAA"}'`,
	},
	{
		templateName: 'RigDecodeMatrices',
		displayName: 'Decode Matrices',
		functionName: 'rig.decodeMatrices',
		category: 'required',
		description: 'Decodes the matrices of the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.decodeMatrices","version":1,"code":"H4sIAAAAAAAA/81XwW7bOBD9FYFFgbhVWktiZEe3JtluC3T30Gb3UgcGTdEyEYkUKKpNavjfdyTbiSzHNO3KwF7icDTkvHmPnCHnaJJKel+g6Psc8RhFyzFyV78RmpaCwpCoBJzAR7Ns5Q3/1ZZqVj1wUUw0WXuBdX7zcfz31W2Ew4HnUpnlUjChi2g+QhkXjCoy1REtCy2zsSAZG8Fc9qAVgfWpTKWKRuhVeHM9+ONyhFwNn8Bww6iMmfMX0YpTVozQ4s7lmqScRv3J2gmsbjMIE3RGhM4g/DhJOfyVP5hSPK5iwrSmL8StrN/nE5nG1cc1lJ8zyAuAtCEmijy28RWOnjEnW4F05LQeFyxlVLPYIYLDNy7FuxZ+OZmWBSXgU40KmH7P9EzJMpltpOeWImYKMqkdF3cLQFkKHQUuj6NmNoXg0ylTY5YkEAotFi4qUqkh64XbEjEXY5Y2VKwkAbNiRZlqsOvHvBr/IAoGeVoqkqJoStKCuUjmVTYNA1BAFa+tMOfrco3n6J5t9Cembir7Ewj9oA8G8WG9lFPHeAbjb4GZpGNNkgYauV7kVpWsggFfI/S5cD7xOGaiOiF05RE/AnRO22eoES6s9FotjRRP3sX1nllvaVTDeekwFkyPl/TvOY9LpxaVk0cNiwMKKmsOq91j3BAvrtIWZMdq2wLv5vSf24/nwydSr2dEQaJNSr8BMSK5lVerDNp8NLi9OFbLbzyBw3Rk1KWiO2aeSs4Q/7aYe7bEISLuIfOKFCzEy+J4EJcbE//XJ8MoSIdU/vmL5xUfWQ6l+bCN2Zp6IjrTuiCeeGdu5PWFF/oLE4menSqnpy64M60NQNeKQROvYO0GpFgOTkfi4YcwLMpse4W+cXe+OOU1VP7Z2WsAdAYa997j4bnX22ikGyQ4X4lImNNgQBF6X5f2mCu4CYEJMhDPbX1FyYk0rK9jD79N3IoFDjewh7N6n7oNYnjvDR6+dYJe743nD9/ucfPt3Lxe79zrX4TDwH/v9fv93tHameOEdnAu7NywAfX2net41Jd2cIZ2bgMD6qA71J6d9J5n59Y3oMYdoraT3sN2boEB9fZN7njUdtJ7Azu30IA67A61bye937dDfWlAPegQtZ30vl2B9H0D6mGHqO2k9+0KpH9hQH3ZHerATnrfrkD6Q1OX6bA5BnbaB3YVMjA2xw67Y2AnfmBXIgNTd/Q6bI+BnfqBXY0MTO3R67A/Yjv1sV2RxKb+6HXYILGd+tiuSmJTg/Q67JDYTn1sVyaxqUN64eFPpVO/3ayepPueD6036YccnjbxvyQtmfEFRFNZsO0n0N3iPwdBujudFwAA"}'`,
	},
	{
		templateName: 'RigLoadLocatorAnimation',
		displayName: 'Load Locator Animation',
		functionName: 'rig.loadLocatorAnimation',
		category: 'required',
		description: 'Loads the transform of the specified locator for the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.loadLocatorAnimation","version":1,"code":"H4sIAAAAAAAA/7VVbWvbMBD+K0ZjsIAJ68ta5m/b2m6FrIMR+qUpRpHOjqgsBenctYT89578kjpuu7kN+2Jb96LneXSn84rNtRU3niVXK6YkS+o1i5t3wrLSCFpyl1MQxSAUTTR9VZaQVS1iJjnyNoqsq5Oz9OLrNDk8Ot6LhS2W1oBBn6xmrFAGhOMZJqL0aIvU8AJmlAt36DjtL6y2Lpmxd0cn345PP89YjOQiw8RyGU2s4Ghd9MWogqOyZsbW17FCrpVIPs7bWLLGXSwwYsENFsQizbWip70F55QM0JTWjSX4YL1aza2Wwdky+rMgecSnzzR3/H6bpo9wARFFGZ9ZV0Q2qwx+CUJlCmSkGxnkrT2gQSA5eKtr3BNm51npKQkqSh6dugFcOFvmiy3dcWkkOJJYBa6v10S/NJgcxEomXZneqCwDl0KeExRbr2PmtUU6jnXcK/LSpKA7VQ4lI7MDX2okO94vw/qWO1osdem4ZknGtYeY2WVQ0zFI8MKpyko5v+s9HtH3hqIXVlbmBhzv8NXgP8MW0flJB35/KHwo1G7omxbeZnAwlEHTQ7uRaO/TFoXDoRQyF94bAqYsXk3grNriEfvTE+y5TpHnHXDb5k5dWaGTN2HnPvqhpAQThpZoIuQ9MVWiP9Y69T4KV6TZmjmVjzXd3+ZUNhViFannpqTK0rrt/zEn66D+BSK49+T5UPXyaKxFvQy9Nao/myKPKNkLW51yaTy/Bbl1Y4OGjehL7k7vlEcfaCFNinmJIfHi17QjxHFBEySQUo5mD5loe9MpJg2ul3ULrnU67Bfxn6X322UQXIB5G+Bev18kCNqz6ZhpO/L9X09aaOth6FF7wF16rB3SraTwa9j9AN9ar6fj/Vm4drC8QHp/u+G/A06o3y+5pnlArgdN1fUb3QgAAA=="}'`,
	},
	{
		templateName: 'RigDecodeLocatorTransforms',
		displayName: 'Decode Locator Transforms',
		functionName: 'rig.decodeLocatorTransforms',
		category: 'required',
		description: 'Decodes the locator transforms of the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.decodeLocatorTransforms","version":1,"code":"H4sIAAAAAAAA/81W32/aMBD+VyJPlcqatoRfpXlry7pNqvbQsr2UChnHCVYdO7KdrQzxv+8SAoRQ0kCLtBeCL3e+777vfM4Ujbgkzxq5j1PEPOTO18jOni7yY0FgiVUATuBjaJh5w7/UkkSlCxt52OCFF1invdvhj+u+2+pcODaRYSQFFUa70wEKmaBEYd+4JNZGhkOBQzqAWPpiFIb9ieRSuQP0qdO7ufhyOUC2gVdg6FEiPWrdSYKNVFZfYaF9qUI9QLMnmxnMGXHro4U7WO18OirIGAsTApBhwBn8yt9UKeYl2SEs7wsIEuvjdCS5l7xcgPozhgoBUhFsoPCkiFRbZkwtnsE1S7iW9NM3mnJKDPUsLFiIDZPirFCJHPmxhnCaYtBGsWdqxkrGwXitUDsWHlVQU+o4e5oB3lgYt2kzz83XpQXzfaqGNAggFZrNbKS5NFD/zC4IG4kh5TllE5nArKiOuQG7mUTJ+jdWsIh4rDBHro+5pjaSUVJNzgBkEMVSK8Tcz/dYZXeqZl8y1UvsSxDmxewM4mqxlZXmWIFpbIAZ8aHBQQ6NXGzSVzFNYMBbF33X1jfmeVQkp4ZkHt4EoDNSPFe5dJ1Er2xrpFhw5qXdk7X5qstRiuu1k6qpGc51eOOwzp0KnI4mhmowayJTMpM2Ku2MV3cpKrNlt02lt5P7s3972l2yezPGCgrNc/sAB0IEfXmdVVDkI0dye19RH1gAp2rPrHNpt0QeSs5O691ivtESu4j4BpnXWNNOaz4vd+JyLfC/PhmlgnwglV//sijhI4xgRu/WmIXQA9HJ08l44M5cq+uOaXNHRWDGh6ppeR1uLWsN0I2icJsnsLYDUjQCpz3xsF0YFnG4uUO9tDtfDTmCyT8+PgJAx6Bx7dxpnzq1tRt1jQTrHouAWjkGFCbP6Wj3mIJPIjBBBWJ1v2eUHEjD5ZfZu7nLiGDwNfZynLaqneOG1T477ZNmDR6N7km5V6OSl1OrnTr1dqfbbJw79Xq9trd2pWk6lcC0K3m1SiBvfnntDfmyEphuJa+LEsjNj4PsVNTcqeZWL0Hd+kDU1WR3WtXcmiWo27vP0kMP90p3VoX5Uri3riIYf94vzGNaOiUJl5pujsmn2T8vz8FW3g8AAA=="}'`,
	},
	{
		templateName: 'RigUpdateLocator',
		displayName: 'Update Locator',
		functionName: 'rig.updateLocator',
		category: 'required',
		description: 'Updates the stored location value for a rig locator.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.updateLocator","version":1,"code":"H4sIAAAAAAAA/+1WbWvbMBD+K0aj0IAJS9u1zLAP3dKxwtaNrhuMphhFkm1RWQrSOU0I/u87OU6xnTZpV1o22JdEOt3d89yLTl6QsTLs2pHockEkJ9FyT8L6PyJJoRluqU1RCXVA5LU2riqJt6o2IeEU6EoLpYvhx/js/UV0cHg0CJnJJ0YLDS5ajEgutWCWJhCxwoHJY01zMUJbMQNL0T8zythoRF4dDj8cnbwdkRDwCAU/Jogigs+GUTB2RMqrUAJVkkWvxysdlIZNDKFZRjXkiB6nSuKvmQprJfeQaNbURVgvvVyMjeL+cMXkJsOwkEeXYWrpvEvPBZCJAAOzggfKU5VGB1OqChEkxgY0sDJdHhjb7wRhxknh8ERU8A6svBaQWVOkWSvGsNBcWAynUiyvSqRaaIj2Q8mjZkhOyyQRNhZpilCkLEPilAEMvQw7hZzoWKhGJX1ZfH05ymA+8Wuq57iZqMJSRaKEKidCYiY+woaAC8esrKRoc6JBwjw4HTbABw8Fzw2vxDU+zODR+F+8izb83kPh6yo9jUDdrm0K+2sUxioGmjY4mJWDC1sITwFPI3Lqgk+Sc6H9zWS1Bp8jYcm6d7cR8aHvkdo1wQbsF1Wz1txIxeauGSCTeErt9imwVOqkz+Ps4MluVcbeci15r1/n1S0l9a7XN2ggfWCOmSrdhXZ0KnirbX0ct4H/pPZkJh04zxDwuowL8IZnXy8aMVnK8Bp5ftIKhl4wt1UC66pqY/P7U8CMBmvUHTloUTkXUFi9EZUp48RDYZ2AJ6QenTTy6AfFxrv/UuUbtMv37m8Of6OP9Qmmi3zdx47EOT3bfWwm8ZXRDh+LPNzvbZxbzwO619s4qZ4HdNAEPWj3yfdMJnCs1LC6SShz/xtnSzoPNjfO/a/NNwksu31uzg0sP2COccySbklWp3ekf+3tucfymer42MStPtS2PD7/Tv3f/Gn9f9GbF6z+Vfkbpl5mvYgMAAA="}'`,
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
		description:
			'Creates an offset matrix from TLSR values and\napplies it to the selected rig node entities.',
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
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.convertDisplayData","version":1,"code":"H4sIAAAAAAAA/+VYW0/bMBT+K5EnJJAixG2gRdrL2iKmTXvZtBeKItc+Tay6dmY7QFX1v+84Tbs0vdALrLA9QZzjc/m+7xw7HZKO1KxnSXQ7JIKTaPxMwvJvRLq5YvhITYJGaOOgX1rjf8WK31U8hIRTRydWuDpsXsffPv2ILi6vTkOm+5lWoJyNhm3SFwqYoV0Xsdw63Y8V7UMb98KjMxT9My21idrk3WWzcdX60Cahw1e40NDqHowLmsJmkg6CJsZsk9FdKByVgkUnnYklrobVSOjQh7gddrTk3m4S4yHFhDFCPXZi6GAusA14GdlXGwjldOBSCIxIghRkBiboatOn7riWle50c8uogyK2dUb0wKVG50k6k3SYKw5GYtrecHQ3wjxz5aLzUPCoWo9VotsFE0OSYCgyGoXESu1IdDIKa/xkKgZZIcijjctsXBJwDyK+doPML99Tgw+ZzA2VJOpSaSEkOnNCq8oCB8uMKFZxT2PiqoClkszpusnwmRy4YG7jJJqzoc/mQndk7GhSia0nW3+YHHx0fBuRzza4EZyD8spnpQUfYKKC1XujEu7Sk1W6JqiH4xLfUqrj7MIljWbBxWPgn+i1sVENPKGy3H2BgcVXlukCQi+hlapwj27ek00p1w8xlW4liYv3AsSlpGsO5qlY6KBDWS/B/YrHRRPGJulUvJyv58VbxGWXVnZfrLc7kfpBqKRWwPuC26kYGgawk78K616KUZ2756V0Jzp3p3JzGvuaA/arnwfbkrhPAqfNXwyytRnctr3nOd1aVmeLoCrqeFmopufQUrA2zstAhkZbptWDwc7M3VNZHCy7scZX4lLj61qbFmVpSzkzqCBjsCGhaBVhADFDLWTFCVeeuCVUS6EU3VfSDCtpOZ3Fwge8oRb1vgESCu9ve5f6WmPuADzJhxV0wwMMe4gQHR1tLrMnxFrT2XcoIv4sNq1Cl0ltYV14Ae91z8bVTprdsP0Xn4J4DUydAmtjjRQZwVeI9ePrqHv1sFmz8Em18R8ENr+AOH8pX6q/qfhav3L8GvgnG7yin3F6++npt4GQ7Q1eBz5YoTNaLsBn1llPZDsMzh0H7d5no7+jz30b/A8jcUnhazkpfvf4+zPxTSh6T2Npm0vq672OPWk/+U64G/0GZkPt1T4WAAA="}'`,
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

export function buildDFBaseTemplateItems(
	category?: DFBaseTemplateCategory
): CodeClientTemplateItem[] {
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
