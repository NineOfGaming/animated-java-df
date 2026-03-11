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
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rig","version":1,"code":"H4sIAAAAAAAA/+1YbW/bNhD+KwKHAPGgerXXpZjQFcjiZA3QFMESdB/qwKDJs0SEIgWSSuMZ/u87SrYrv6mWnRRD0Q+BRYq85+65545UJmQoNbu3JPo0IYKTqByTcPYbkVGuGA6piXERrnGQzlbjUzHjdxWDkHDq6HwVzk56F4MPf95Gr05ed0Km00wrUM5Gkz5JhQJm6MhFLLdOpwNFU+jjXnh0hqJ9pqU2UZ/8dNI7e33+e5+EDl/hxKUSLvhbxH0yvQuFo1Kw6OVw/hZnw6p1NOLNfpoMteR+3dzu5wSdRKureLGh42UwgRD/gg1cAoHNgImRAB4YEQdU8UA4i78ipU5oZdsrXunhKLeMOiiwrTPiHlxidB4nS06HueJgJLrtF07vpuhnrlzUCQWPqvFYJUYjMAOIPQFkOg2JldqR6OU0XMlJpgYgK0nxDPtUcZxz48w/u0eHg0zmhkoSjai0EBKd+VAqExwsM6KYxT2XvQpqZw11KAeOxhVYPd944a15bHyNZmzwTnAOyouLzZbwMTop2Kr8vuB1Tzw3M9sEc9AWmKE2PpDCk00KZlTKwW4yfqBmnTCPcoRvjgVvtZVGNnCNZbpgMFeWPgCvTcRGqwvNVIz5/C+RuynWuSvbAxajQQn5TaL1Pi4S+JHKHC7teZq5ccVBQxnq3oMJAwy3oSqKzM90qLRJaxKolTNafj0g32LWI7rCIGTwpij4t/PQgjcGLLi3XGNlK+2CBAPDQh4HRczt2oRu13gPHkBibGah82swqbC2TPSCp2sjlOvBMI83xFmRe7cB9innwU1GWZGxEvwW+0tQ5CS4AhMLFe/jxK8NnPiALX4B/07EicQ/tyfwq0bMj2gu3QL7Bvsn3wf0twag/1CjythK0CuwlsYQ3LixhH3AT5bLqbKtrpiY1GVn3aWaDuoOO3St768jVI73H23hR1v4PtsCSv8pbw0DwRtdHM4M4C35vbBuu4sGMly0p4feqbqmtdOlreHlqMnt+NbkXyrkVEr9OfBsBGcJVXGBs+DqQptzypJ1ZrYrZr5l9wY8N/k8evHctYsvkcMSUp/Vdf7LD571L6IKc8vE/QXuEg3c0poPjG9fOjtzU8txZznU0wwFwItjoUlb+ZpQDqpaf/QW/xo4WCmFJTwG77ERN1HMvteg7sYCPMfW3uQa9LxVuCQ9H1M5WpDeaktQsUue6nt3H/5Vnq4b62wn+lpnvm+uyvhJeVtj5XkluRSfD+59if88JSeaxLUxO0dYG8lxIaWSqdYv3db2iK7wfiYyWd90/l9lcSQUh8fjagLDStSi9XP3RafValg3Gw+nHaBaNeT+cVAr33nH3fQ/upbeeEoWAAA="}'`,
	},
	{
		templateName: 'RigInitRigs',
		displayName: 'Init Rigs',
		functionName: 'RigInitRigs',
		description: 'Initializes all specified rigs and their animations.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.init.rigs","version":1,"code":"H4sIAAAAAAAA/51UTW/bMAz9K4Z2NYJlGFJMt61psAJFD0NvTWAoEm0TlSVDottmgf/7KDdZnaTpPi62SZF8j4+Ut2JtvX6IQt5vBRohX2yR795SlJ3TbKpQcRDHEDS7aP4aPClrMHJhFKl9FHu380Vx++1Ofp5dTHPtm9Y7cBTldikadKCDKknqLpJvCqcaWHIuPFNQXF9764Ncig+z+eXF1ZelyImP2HHtkLIfWMWl6Fc5krKo5cf1/pi9+bg8OF0rRw0DF5VFfvpHCAFNQuO0cSwjJu/9du2tSYd7Ek81d8QUjslVQW0OmSHT+QkxU9ZmsQWNJYLJAtPNlDMZ1YCBv7BRhN7FyVETfl12USuCAT5SwAegOviuqg96zDtnIHA7Q2C/6plq50hOczRy3FJ0WJYQCqgqhhJ9n4toPXHrfX40w9YVYEdDTBNJozWRnbRpk0HPxEZru6CskBQ6yIVvUyvJLpWN7DAQdcDByynX8ziCnZ7Arm1Bqhrh+n3mIpVL2HzMdWL2HY0Bl7ZR70LMhlmiPt7XV7xPsyTOrrbgOUyQpzRJAxEDlbd2PkALiv689Y8qvKUX+6L2g15pQu+KfqZEPF/jXxS84wH9FvCrtf4pu8FI2SVfiQriWMmFD1dK16cqnGh5kvKqY1Ca9zUxwQCaU5jKMLDd+uxLnhNe87Up/u6P8x/an1mEd/lr61928LCBVf8Li2g51ToFAAA="}'`,
	},
	{
		templateName: 'RigSpawn',
		displayName: 'Spawn',
		functionName: 'RigSpawn',
		description: 'Spawns an instance of the rig at the specified location.\nAutomatically applies animation "default" at tick 0 after spawning.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.spawn","version":1,"code":"H4sIAAAAAAAA/+1abW/bNhD+K4SGoi1gGE3XpZjRFUjjdA3WZEWTdh/qwqDFs8yVIgWSSuoF+e87UpYtW5Ysv6TNOn/Ii0mRd8/x7rnjyTfBQKjwiwk6n24CzoJO9jloTf52gmEqQ/xIdYQP4TMW4snT+J8fcav8h1bAqKX5Uzh6033dP3912Xl2+PygFao4URKkNZ2bXhBzCaGmQ9sJU2NV3Jc0hh6uha9WU9w/VELpTi/46bB7/Pzk117QsjiFAxcJvZbkPY96we3nFrdU8LDzZJBP42iruD3IcESljVFwPxIcf6sr0JozJw2XFZ9FiW70081ACeYmcyWuR4gIVVhULtJ0vKCZIVQSLo2lMgSihsSOgGgeEWr9vyaBkA85MIIGppYr2V4AogbD1OAUeBWM1fwL2JFWaTSaw9lKJQONkPyDt62NtH54lKL1UY+QCjEmNEkEB4eBx1450gsYDGkqbC/wEHj4hTwhaC3QiAUBcxm1H+4CwOdb1DyVtnPQ4qxTPBcj+XAIug+RO/Tg9rYVGKEsnh+innfERPZBFDzRuRUO4+lzi8Bwxo4TN3JFNX5IRKqpCDpDKgy0ApU4zIUBBibU3I/impN8l5kGB001wLmpbPvVbiZ7TE67BeFPmwqPFfPDW8g/c1vMi/+5qXj09Jnw7MN6wrOYzwOmoMKzpiqYNEk0GNNNE/iLaue1M5Vk6skr8/P+FRUpTPebzM3v9sSrUInB6rQMYaIAQQ0wTjA6SK7HDM4vJTgD0bc0Kmig8g1fO6kOA053glND3nDGQDquDiePsDHqy8NFNi840KGLusneAbJU24d04NVYlg34sJ8Fzop8kD20YDW3/wOceeTd8XFb4p8+Zy4oTaj8SaTS0CtgcyHuNJxC+kj1yVdurFtELVLLILVu4fmflwWtNQ2RcpwGXEOIu6DZvGnyA1c6rgYZKmm1EqtRupRWhplFygvPvi8LeMkLPH+wL5lCgpXKEnBA2rV0Vn38XbgCgaj01AXegY65MW66YLB3GnNeFwZptARhwRPKXFIt+4gxgiEZZnzqhV8iqZOPLnLIGegoC6+1lSgzSrUS51hMTMW/4dFI4I/dUHCZR+os73liKvsCkxbbROg60X6itZod9RkSCY2AXNixgE1EH85HVWHZBlExt9V7sKmWtbEYCpUxV5NgvAeMg059ak7ixI7/cxQzQmxYzI2JQ272XLPnmj3X3BHXLK8wc5pxt5za6KupM/Obxhz233bGRQYELuqrwd+rkWc3h2W3C6TVWnxLbeYvRRUmWsCb372OlQ8Akw6O8qk31Bz7JsIlrfGppocbuQtAQdWJDS+8ldyN+IL/k5GBjsAWYnSXp/vyvmSaI9+7uOZ25LsXnM1lHc6mKYcKDZSNs6LWtKa9ARKjbXgifBPEzHYyuL/bjmeJCpGpOAbJgO2z1D5LNRBauMV/uzy1ZYKppdqF1IZBtTvBGhKgdsPM5mrHdVJZ41K8vg4vt9aqneFSpzPXPxJCXZO3yEPkeERl5OVMLfta6RMajsrGqXaFfElzTs63rHYEu0Wp4WzX9mPbnkr90S4kpd/BomlPcVNMtGb7TLu0mHgAGJjjR1OILWfRx7XIlu6TKfMNyqcI5fUn+252nFlH9G4PspHNSrb3GPvGUgumeAZP543p27Ov3LNdbpJd0N9bamzW8a6pbKgQ/Wavp5aajKGugo67u4qjFRF5sNhqxRR0Bdp2C2p8b6yLzWCw01Mtq7hlSgLXvt5VEN4LynEvtv4/jOPRrsE4y+8XZdvjtvNUs2EVcCpHoLnN6sG5CsDTlSvPJ35dYdoN69Jz5e4+zW8C62tzuIR9ixvs+ffH4d/Cud5j+r0fjLRWMeujxtWy+5LlBwuZ/FC3D5ltQ8x7wzeNi6ZfF/gDICHHqdaoI3mvLM1VzL35Ev0+UdpWwqnOR4Wl0x7ptHt6t9bKv+fS2F7N6kHOHtcQCdhZ9/lOIX+/5vsWGLfrdBS+t9X4TCsa+B8+nHYrdK+CfZRgDmS+crsrgIttsbyt3l6CfNmr6t049A5NuNgaAMwWoV1pwzvri67qxG2bpuqiqGEgrmCths0bVnoNVb46rXwNVX7dsHLJs8UUnH13FBF8vv0XPapj4F8sAAA="}'`,
	},
	{
		templateName: 'RigAnimate',
		displayName: 'Animate',
		functionName: 'RigAnimate',
		description: 'Sets the rig to the specified ticks pose.\nResets the selection and restores your previous selection.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate","version":1,"code":"H4sIAAAAAAAA/9VWS1PbMBD+Kx716mGAUph6poe2gWkOpR0IvRDGo8hrR0WWPNKaNs3kv3dl5+EkTjBQDr0Ea7Xa79s3UzZSRtw7Ft1OmUxYVJ9ZOP8bsbTUgo7cZqREOgj5XJu+Kol/VR1ClnDkCy2STnsX8eWnQXRyenYUCpMXRoNGF02HLJcahOUpRqJ0aPJY8xyG9BZ+o+VkXxhlbDRkb057n8/O3w9ZiHRFgo9a5hwhuJLZkM3uQolcSREdjhYKJA2bAKDFmGvMCTrOlKRf8wDWysTj0bOmLmF66e10ZFTiLxc0fo3JJyKxSS+zfLLidg3oAhxDYGUWoKk+XQFCphKSACVFOiiMg4MN5maUlk6QVxWmQyvvAcfWlNl4zbGw1AlY8qFSnIXPpHkFbkHUgQKB0uiA6ySwQLmgn2BiShsUFh6kKd1K6R/xvpsR4VJjdBzKJGrG32mZpmBjyHxy2WwWMqcMUp7I2fWSK3QMqlFzvoB8JSYkw0nhv7me0KFQpeWKRSlXDkJmCu9JQ5CAE1ZWUnpzrlHiJOj3GuBHXcFzk1TiOT7+xifjf/Um1uGPu8Jzao2XodfN5cthjcHbrgxwBa/L/MnwA5lDIHXdKQ38k87Z1wi22CSRQMpLhfEDVyUsTczv1g0cVag7WaMtt0j3K0yj6ri1sH+3xX6kYuRZA90sjF14RM+frsm0C77IJAHtJ7CYqyQT4irF5oxu1Mup77C5bUaj6IDXM5NVRNqmPM0Dio59fNDXShtBW84HunLCVJH3zb63fzOfjoatecaulwNpQFQAg5ubfs9VEfFH0ujV2VzrT+/vMkAfdvspuFJxt5XW6mk1XTq72GpiMSN2WNmeNa1W5q2+w8j2xGg1grstbHd8ezwW/bbDzMmOSjzQplpC+yrS10FsRj9bUrWW7kcMyfS1K3uNzQ8/Y/ruPC/QLx+OtBRHJfqHl98GDZqWC1qWHlJawiARmdeN0WVs/szwvI5n3xWfgL30z18c7Eeb/1r+gf1Nv91urQP9sNuc+B+y0X2LDGhNrZZIRuQhuCAPqBqlzprLpP53p0pqqztbW6Xt5b4wCmXqhdYax476d7O/0jrcSKkMAAA="}'`,
	},
	{
		templateName: 'RigAnimateNoReset',
		displayName: 'Animate No Reset',
		functionName: 'RigAnimateNoReset',
		description: 'Sets the rig to the specified ticks pose.\nKeeps the rig-entities selection active after animating.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.animate.noReset","version":1,"code":"H4sIAAAAAAAA/+1ZYW/bNhD9K5yGADXmBUnWpZjRFsgSZwm6ZEVs9EsTGLR0lrlSpEBSabzA/31HSlYk27ItxVtTwB8SSxTJ9+5493iiHr0hl/4X7XU+P3os8DrpvdfOfjveKBE+3lIVYifsYyDKeuOVa7Gj3E3bC6ihs17Y+nh2Prj+vd95ffzmsO3LKJYChNGdx1svYgJ8RUem4yfayGggaAS3OBYejKI4vy+5VJ1b78fjs9M33d9uvbbBR9hwIlhEDZAbFpJrSW5Ag7n1pndtZihnfudgOOuJre0iEgh/TIWJkMMg5Az/y3tQigUWGIcV+yK4bf38OJQ8sA9nfL6O0ThkM88zVHTyRLIHRhMzBqKQpZHuUsfgsxGDgBiGLiex1LA/x1wOR4n20TyHqY1iX8CMlUzCccmwdiICUGiD6zhtN6T5ASDOef6MfmGGgSYaOPiGSUEo/twDQY+AItR5nolwS6zvpkg3EaZz1GZBp+h9LdhoBGoAYYhQ3nTa9jSXBlcJTS1HXiwGwAuhZ+PIBmSAbWYS22sqJngT80RR7nVGlGtoezK2BhYaAtC+Yq4Vx3StLybk8qwAfrgpeCQD15zhmwdTG//KTlGGP9oU3q7T89DTHLMBUGLwy6YMzBO8SKLa8H0WAWEizZMC/uuNV19gvMbzJAIY0YSbwT3lCeRTZM/KExw61ErWRiULpC8dpuSp35aw/3WB/ZAPDA0L6HI22blFtPzxMU6tyQULAhBWiP2sSzBBrsyfl+pCvBzbDMvm9jDB99MEhn0hnWp6jtAy0WcjdJJaL/tppznfWaQ9fPLKpUEL0QIYsEBjT+1Ltx6J0PQeglJiW665cZ+o6j4wbewgalBQhomxA6//6hdYK+qj0FgGTKFgYRNOLwrLLlVUbaQvhVGSr7fS7lyLZqYZ+tYJ7fuCveStss59H0hUUiENAWvI/koRqw6EM7gHjlapPBg+goqY1vZxwWEfFcb8GQyTcImFhZhYFJFq7JMgIL2Y+qBz8D5KOflk84dcgQpxL2hCYlFHqklcY82Qw1+wcMzxzzQEXhSQVZ53apFj93CrCpqA1sn7rlLyaamvQGsaAumZCYcm0MflrCoMa5AVpaluwCRKrMxFn8tUwzZJxhegOBjUl7obxWby3UnMmNoiTUyItVzvtGanNTut+Z+0xtZUaYO9au1zEKEZv7Ra51kmZ+8TM4Ps+9tKhUnfOOYmyYrv0utUyQ0/vPteZXf2rlQc4YIh67/T450e7/R4e/qtIAZqGoqZrZDqiNn2Cs7F46PqWOir5CnyTziXX8mfuEWQ0zEVocvJfDXOpepSf7zon+pYmA3ZXG9nU1ZGDuV8sNlR8VKHOmdaL7aevTazw7eKWRZXocGet6ikDWJtUQmXHkXt4e4yfuUcZFp77nezGqT102GrdHg2dxrEJQ3yg7462bkuGNLj44Ec/r0+GpbWCs4szKf6i++OfStXvpQE3ey0+1Q6adfJ8GT26ILqU/dVok9XqGUdM5tE6lyZeM64AWXZMpMWAPUpb1oGhvaMtEA4W/he/l2gx/5J9UmFYAob5qoFWxrdB9UL9GLqwUuhDRU+lAo8FuT1oByRaHcYuCsIdwXhlgo89yFyMsjmb1hRJAkLyFaqvbUVRckZf4B5UuKCRObi+R9unE550n+5+a1W/Zf1g5UF01ohP6qzc71beeyxbQ9xqlfvUs38eth4r65hfM20+Ib295rnwDZyP//8u1lldcZ0XPp6+w0ozzu3FnlOJ1cUg+ihgvjd9F8LyNjD6CMAAA=="}'`,
	},
	{
		templateName: 'RigRemove',
		displayName: 'Remove',
		functionName: 'RigRemove',
		description: 'Removes the rig instance.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.remove","version":1,"code":"H4sIAAAAAAAA/61VW0/bMBT+K5GnSUOKEExb0fK2FRA8ME0M7YWiyLFPUg/H7uwTRlX1v3PsJiO90iFeWvvcvu/cnBkrtBX3nmW3M6YkyxZ3lrb/GSsbI+jKXUVGZINQt9Z0ipLgFS8pkxx5Z0XS2el5/v3bTfZpcHKcCltPrAGDPpuNWK0MCMdLzETj0da54TWMyBce0XGKL6y2Lhuxd4PT4cnZlxFLkVQkuIbaPkByraoRm9+lCrlWIjsqOj1J0358MGLMDdaEnFda0S+5O6dkgCO3vi1BBuntrLBaBmXH4u+YUiIOq+wqx6er1HyCY0icqhJlPHIj4HCFqS3KxguOEDE8OnUPOHa2qcZLiaSNkeCIczSc382JT2MwO06VzPq8vVFlCS6HKhSFzecp89oi5TdPVzo1MTnoXqtC3UMDJclwOglnbqZ0mejGcc2ykmsPKbMTVNb0BBK8cCpKyefMoMJpcnnaAz/eF7y2MopbfHzEXfjomjX4qxBhGf3jGnqhc+RVD9527ucBIxAgdcYufXKhpAQT5l60JnJKZJVY3Ywe3iA0qI3NqP2HLo4Dizw2rZYHDYLGsfj98oItarKpbjnpdzX8gbst7fbCxnqHAVtqW8jjX+Kxswr80Jro1BRfO9UF98O4vTdUt61pqjJfcHghxY1Eu9HYwvVomesv7s4elUffY+O4oO0KkZWjcpOIIpnnaTPW1W/TozdI4FxpBBdKraJkr3qvZyi0XczzPilCXN285bCe5RLBxRMXV8VVELB+xgoF7euKuBLeU9AdgXC/Wdq4LmEn35P7h9iTg8VZyYNDaEd85x5tfz3ChjhIIkr3hlxxFOPkGv40pArfnv5b8qOh2tGs+g2p9R6Uz69/wSpqOSRDHmX/iztYnslnL5I/ARmJu1UxCAAA"}'`,
	},
	{
		templateName: 'RigSelectNodes',
		displayName: 'Select Nodes',
		functionName: 'RigSelectNodes',
		description: 'Selects the specified rig nodes.\nIf no node IDs are provided, selects all nodes in the rig.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.selectNodes","version":1,"code":"H4sIAAAAAAAA/+1XUU/bMBD+K5EnJCpFiLIJtLyxUkSljYeB9kJR5NpO6uHYme0AXdX/vrOTQtI2kALTNmlPTc7n+747f3dx52giFLkxKLqaI05RVL6jsPqNUFJIAq9Yp+AEPpZllTc8eYvb5V9CRLHFSy+wzk9O4/NPl9GHw6N+SFSWK8mkNdF8jDIuGdE4sREpjFVZLHHGxrCX3VuNIT5RQulojN4dngyOhh/HKLSwBIYLJhixwbmizIzR4jrkFgtOov3J0gOsYR0BArnQV/OJEtT5LWPfTYEoRF7FTDWerQKawE5ZYHJGeMIZDTRPA+k47K2QUJOkMARb5qGM1fyG2alWRTptcAwLSZkWwNI5LsIXshslQMMzCUYnJsCaBblWt5wyGgamoo6FKMkGXPo8gP0b8b5eAOFC2ugg5DSql91IniRMxyxNAQotFiEyQlkU7UOyTfnkMmaiph8nBqcqCjY7y90zljN4yUWhsUBRgoVhIVK55UrWDJAi0dxbYc9QWm5nUJcaeL8reAb1Eo/49t5ujf/FhWjCH3SFd8c1oqaNgNVFA798b8KfV6Kowb9fg5+I2OK0hq+W209dSg4fliM0MsEZp5RJNwxI5UJnwJaT1XFRS/fQCaSKjZzqSkn67kWezKahw5P4Fuvnx07p1Fo5Q5QvnRNrQ3+O00MSn7mxF/wnG/4oIOMaKY0JtIAD4Bo4gwnCyccTkUpn7TmUicZq8v35PMqz3STAGNaf6pyNFfB905J8v5m8bxHOzEBJv6mYHC+XzrAZ+Nl8CQJ4kzQ3kl32WbfDOuXCMu3Ycm95CWWipNVKbODbgPrKbKHlk3ogQpUt0kUQv1vUq9KQRbYep98uhf998Hf3wWrKG4u1w+HrfL9bySXs99pT/odbyTD7yl7q/nkYaAaXItcc7Xw0y8HpVa29zcm/bEKs33zav/2XcJ14+PQfC6HuAleBYDDFMvXFe5SR0kNMpuvVWLsFrG3pPmKWIf+QILq1Hvy30bNdd8nZAZhd39C98pnT3h6rRkzoLeVx9Z7oz+McSkC/YQFHsUXnPF+qVw6qravVUWajFJqeBSCODFvLZYpW5/Ps3DHYmEq72Go7YeEXVL8I+PEOAAA="}'`,
	},
	{
		templateName: 'RigLoadAnimation',
		displayName: 'Load Animation',
		functionName: 'RigLoadAnimation',
		description: 'Loads the pose of the specified node for the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.loadAnimation","version":1,"code":"H4sIAAAAAAAA/7VVbU/bMBD+K5GnSUOKqhUYaPm2DdiQgEkT4gtFkWtfUgvHjuxLB6r63zknTZsG2DKqfUly57t7nvO9ZMGm2op7z5LbBVOSJY3M4tU7YVllBInc5WRENgjFypq+ak3wqoWYSY68tSLt4uQsvfp6nRweHY9jYYvSGjDok8WEFcqAcDzDRFQebZEaXsCEfOEBHaf4wmrrkgl7d3Ty7fj084TFSEekuLBcRl+MKjgqayZseRcr5FqJ5OO0tSFt3MUAI2bcYEHoaa4VPe0cnFMyQJJb15Zgg/Z2MbVahsOWye8ZpUU8+gxzxx+36fkIZxCV1kNks/rblyBUpkBGxkqIMusaNWgQSFre5jPqJWSnWeUFJ5sgeXTqHnDmbJXPtvKNKyPBUWq14fJuSbQrg8lBrGTSTc8blWXgUshzgmLLZcy8tkjXsIx7RS1NCrpT1VAiUjvwlUbS42MZ5Dl3JJS6clyzJOPaQ8xsGbLpKCR44VStJZ9fTYwN+ngoekH3pzfg+ID/DH4ZQkTnJx34/aHwoVC7oa9bd5vBwVAGoYF2Y3AVImyQD4ciZy6819CmqkceMk6lTOdcV7COsDrb9h/XoK9yRVc9o3pWQ264fnrGdapT5HkHzK59A0CgS8cJO/fRDyUlmLDMxMpEPhI1JfrrrtMXR2GUVrGZU/lI03yvS8hqOi+tTZWlzVz8ZXE2Rv0JI5z3dPKhbva9kWik0Ht7zWdogj1y9MLWtaiM53OQW+MciK8zveHu9EF59IES0hqZVhgcr35ed5JwXNB6CYSUo8VEKgpvOiW3rng9Z8G1Tof9L/5j2v0GGQQVMN6ANu53hwRBTpecLliA/+PNCm09DL1aD7hLP7Ubu80k/Cd2v7S31Of5nn8Rql01rxDe327u74AX1Ns39Qqioycdmeeu1ggAAA=="}'`,
	},
	{
		templateName: 'RigDecodeMatrices',
		displayName: 'Decode Matrices',
		functionName: 'RigDecodeMatrices',
		description: 'Decodes the matrices of the selected animation.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.decodeMatrices","version":1,"code":"H4sIAAAAAAAA/81YUW/bNhD+KwKHAnGrtJbEyI7emmTZBnR9aNO91IFBU7RMRCIFimqTGf7vO8l2IssxTbsysJckPB15330feUdmjiappA8Fir7PEY9RtBwjd/U7QtNSUBgSlYAT+GiWrbzhr9pSzaoHLoqJJmsvsM5vbsefr+4iHA48l8osl4IJXUTzEcq4YFSRqY5oWWiZjQXJ2AjmsketCKxPZSpVNEK/hTfXg98vR8jV8AkMN4zKmDl/E604ZcUILe5drknKadSfrJ3A6jaDMEFnROgMwo+TlMNP+YMpxeMqJkxr+kLcyvp9PpFpXH1cQ/k5g7wASBtioshTG1/h6BlzshVIR07rccFSRjWLHSI4fONSvG/hl5NpWVACPtWogOkPTM+ULJPZRnpuKWKmIJPacXG/AJSl0FHg8jhqZlMIPp0yNWZJAqHQYuGiIpUasl64LRFzMWZpQ8VKEjArVpSpBrt+yqvxD6JgkKelIimKpiQtmItkXmXTMAAFVPHaCnO+LNd4ie7ZRn9m6qayP4PQj/pgEB/XSzl1jBcw/haYSTrWJGmgketFbquVKxzwOUJ/Fc6fPI6ZqI4IXbnET4Cd0/YhasQLK8FWayPFk/dxvWnWexrVeF47jQXT4yX/ew7k0qnF5eRJw+KAgsqaxGr7GHfEq6u0Fdmx2rbCu0n9dnd7Pnwm9XpGFCTapPQrECOSO3m1yqDNR4PbiwPi3qnyRcuvPIHTdGTUpaI7Zp5KzhD/sph7tsQhIu4h84oULMTL6ngQlxsT/9cnwyhIh1T+8S/PKz6yHGrzYRuzNfVEdKZ1QTzxztzI6xMv9CcmEj07VU7PbXBnWhuArhWDLl7B2g1IsRycjsTDD2FYlNn2Cn3j7nx1yhuo/LOzNwDoDDTufcDDc6+30Uk3SHC+EJEwp8GAIvShLu0xV3AVAhNkIF76+oqSE2lY38cef5m4FQscrmCPZ/U+dRvE8N5bPHznBL3eW88fvtvj5tu5eb3eude/CIeB/8Hr9/u9o7Uzxwnt4FzYuWED6u1L1/GoL+3gDO3cBgbUQXeoPTvpPc/OrW9AjTtEbSe9h+3cAgPq7Zvc8ajtpPcGdm6hAXXYHWrfTnq/b4f60oB60CFqO+l9uwLp+wbUww5R20nv2xVI/8KA+rI71IGd9L5dgfSHpi7TYXMM7LQP7CpkYGyOHXbHwE78wK5EBqbu6HXYHgM79QO7GhmY2qPXYX/EdupjuyKJTf3R67BBYjv1sV2VxKYG6XXYIbGd+tiuTGJTh/TCw59Kp367WT1J9z0fWm/Sjzk8beJ/SFoy4wuIpnL5L8XNJ9D94j+2yIHTnhcAAA=="}'`
	},
	{
		templateName: 'RigConvertDisplayData',
		displayName: 'Convert Display Data',
		functionName: 'RigConvertDisplayData',
		description: 'Converts display data into the rig helper format.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.convertDisplayData","version":1,"code":"H4sIAAAAAAAA/+VYW2/aMBT+K5GnSq0UVb2t1SLtZUDVadNeNu2lVJGxT4KFsTPbaYsQ/33HIbAQLuXSjnZ7gjjH5/J93zk2DElHatazJLodEsFJNH4mYfkZkSRXDB+pSdEIbRz0S2v8Vqz4XcVDSDh1dGKFq8Pmdfzt04/o4vLqNGS6n2kFytlo2CZ9oYAZmriI5dbpfqxoH9q4Fx6doeifaalN1CbvLpuNq9aHNgkdvsKFhlb3YFzQFDaTdBA0MWabjO5C4agULDrpTCxxNaxGQoc+xO2woyX3dpMYD11MGCPUY6eGDuYC24CXkX21gVBOB64LgRFp0AWZgQkSbfrUHdey0p0kt4w6KGJbZ0QPXNfoPO3OJB3mioORmLY3HN2NMM9cueg8FDyq1mOVSBIwMaQphiKjUUis1I5EJ6Owxk+mYpAVgjzauMzGJQH3IOJrN8j88j01+JDJ3FBJooRKCyHRmRNaVRY4WGZEsYp7GhNXBSyVZE7XTYbP5MAFcxsn0ZwNfTYXuiNjR9NKbD3Zeu39+fD4OiKfbXAjOAflpc9KEz7ATAWrN0cl3qVnq/RNUBDHJcClVsfphUs6zYKLx8g/0Wxjoxp6QmW5+wIDi68s0wWGXkMrZeEe3bwn26VcP8RUupUsLt4LEJearjmY52Khgw5lvRT3Kx4XXRibtFPxcr6eF28Rl21a2X2x3u5U6geh0loB7wtup2JoGMBW/iqseylGde6el9Kd6Nydys1p7GsO2LB+IGxL4j4JnDZ/McnWZnDb9p7ndGtZnS2CqqjjZaGaHkRLwdo4LwMZGm2ZVg8GOzN3T2UOO7PGV+JS4+tamxZl3ZZyZlBBxmBDQtEqwgBihlrIihOuPHJLqJZCKZJX0gwraTmdxcIHvKEW9b4BEgovcHuX+lpj7gA8yYcVdMMDDHuIEB0dbS6zJ8Ra09l3KCL+LDatQpdJPb5crQMv+IvYc3G1k2Y3bP/FpyBeA7tOgbWxRoqM4CvE+vF11L162KxZ+KTa+A8Cm19AnMlX6G8qvtavHK/v/2SDV/QzTm8/Pf02ELK9wevAByt0RssF+Mw664lsh8G546Dd+2z0d/S53wb/w0hcUvhaToo/Pv7+THwTit7TWNrmkvp6r2NP2k9+J9yNfgPpMZGEPxYAAA=="}'`,
	},
	{
		templateName: 'RigSetTextDisplayData',
		displayName: 'Set Text Display Data',
		functionName: 'RigSetTextDisplayData',
		description: 'Applies text display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setTextDisplayData","version":1,"code":"H4sIAAAAAAAA/+1ZW2/bNhT+KwKLAs2gBk62pqiAPqTxug7r5cHG9lAHAk0dS0QoUiCppYLh/95DWrbli+ykdtvEm19sUofn9n0fZVFjMhSK3RgSfR4TnpBoOiZh/R2RUSkZDqlO0QhtLOS1Nf7yM26VH4QkoZbOrHB23H0bf3zTj367eHkWMpUXSoK0JhoPSM4lME1HNmKlsSqPJc1hgGvhi9UU/TMllI4G5MlF9+rl768GJLR4CSd6YIM+/gy63BSCVkEXgw7I5DrklgrOos5wZoqzYTMUenQxPo+HSiTObhbkNsOMMcRq8FTTahH5sigEBxO4YZDU0V3JgVWBzSAwIIBZSAKskls0PV3JSw1HpWEUTdzIWM1vwGZalWm2lHZYygS0wMSd4eR6gpmW0ka/hjyJmhUZyUcj0DGkKYYik0lIjFCWRJ1JuAJRIWMQDYxcw3HaD0Niq8KPOLM4KkSpqSDRiAoDIVGF5Uo2JhIwTHM/i4scAI3QZ2uhhyK2NG3EVrOlb50/Fx4vR+RPE7zjSQLSEY7VJkmFmXK2SslFvPML16DaN9E8PTVgHUNqgkzTC1v4zUfxv1TvZvjUaHPzDFO+ew6wrRjYL3bdiUN9qX2umnn5XUTkHTV/QdWoQVOGxHGuuEbG4RQmIBcwSqXz9pI9O6u4DrGzcifc9ayfohddPXOznrcnWwtvZ0Bflw0CyAw0t0HPVgJMkwX9GkyHa2spDU68uEcKH1VgCsp8wGkefn/5m4oSgg+gUy7TfXK5WEZ0ZbnF9oODsOd3D792C9BMqKli7oL0zye3WxXf8sRmD5nissy3M3xRxjLPNwL7Ho3/8SUfO7oKZYN9ftTQ1jXcAddPdbXHjir+W0nlD8UUb9h7FD3Nd9+qm5zwHk/aW/D6YPRsvytdoSfQy7ekS5dXjhc23Y4u6za0ZYK943Qo4Juauft2Ngt/3NowGU3U7SMSR53wIdUxdfmT5YGs82Re0kdvVuwaO+dX9lNHWzd3y2OewJHrAyCun2gfk0gaWR9UKQu/D0wuPYDni4rX2QrQz3S5v162NfYOopmncdyqGWIBKXZJJrE/etp6mrLLAxVF1jyPOb/HozCqMriUVeCkOaPKVQbsJvigEiAbNWzWW9mObHPZobT/P37L+AkR1LA8EgDvucvt3HZX4dh+NrX5CTGnNnvW4tQjdPLLWaezZVf3e9ib+aLvvIeBO0f9jwjqgZ0w/Ag6dk7PXxwl1Q7R6ycd/zlCkX9v+xUwGBUivtsLv2+S/vprmj9AguZs6U3N9eQrZN1mSJYcAAA="}'`,
	},
	{
		templateName: 'RigSetItemDisplayData',
		displayName: 'Set Item Display Data',
		functionName: 'RigSetItemDisplayData',
		description: 'Applies item display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setItemDisplayData","version":1,"code":"H4sIAAAAAAAA/+VXUU/bMBD+K5GnSUOyELAJtEh72Ogo1TReQHuhKHKdS2rh2JHtDKIq/33nNG3TdikdhSG2p9aX833f3X13TSdkJDW/tSS8nhARk3B6JrT5DElSKI5HZlJ0Qh8HWeON32qLv1UfKImZYzMvtE56Z9HFl6vww/HJIeU6y7UC5Ww4GZJMKOCGJS7khXU6ixTLYIh34d4ZhvG5ltqEQ/LmuHd68vXjkFCHj9BwCS4YYPygJ2wuWRn0EHRIqhsqHJOChwejmStaaRsKI3qM68lIy9j7zUDuxsgYIVbBU8PKBfLnPJcCbOCzC+IG3accOB24MQQWJHAHcYBZCoeu+yu89CgpLGfo4k/WGXELbmx0kY6XaNNCxWAkEveO1U2FTAvlwvdUxGE7I6tEkoCJIE0RilQVJVZqR8KDiq60KFcRyFaPfMHRXB8pcWVenwR3eMplYZgkYcKkBUp07oRWLUMMlhtRW/GSb0AL+nANeiQjx9IWtp5dPfPxPDw+DsnABucijkF5wfHGJS6RqeCrklzgHR37AjWxiRHpvgXnFdIIZEqPduhbJNFPZh5W+NTp98WzXNfV8w3b2AN379aD1B7t8vls5un3sCPnzH6DspWDYRyF40MJg4pDExJQizYqbbLulLE8O+TcjPrWOT+icOsK2qZwR8uF64PztfvBZAHdtagntYyaW89TkSVag0aVg+klh4DgG3hZ7w7vs6nNXOrpvGzT55eXdqZjwNn3ZF+PwFukd83/LcrLlO+8lS7C7nUX49OTKbV7517gr/B85X73rIKrabJrIq2fNg+7eGANBRtJeHxR11b5Rh7/9sSkUt9F9evHX52YPxTXg2JfpLHXvQqb5vbR97TO+H9orlDpK9qFM8ZPuQibmC+8BVF89daaLcL+PNM5DfynsbDutv4669i9+5bQn3MuOJMy2u5v3qNGY/3lvA8KjOBL7+c31S/kAA5pjA4AAA=="}'`,
	},
	{
		templateName: 'RigSetBlockDisplayData',
		displayName: 'Set Block Display Data',
		functionName: 'RigSetBlockDisplayData',
		description: 'Applies block display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setBlockDisplayData","version":1,"code":"H4sIAAAAAAAA/+VWUWvbMBD+K0ZjsIIobTdSJtjD0qzpGOylYy9NMYosO6KKZKTzWhP833dSnMZJmjbLuo6xp0Tn0913330naUbG2oobT9jVjKiMsPma0PaXkbwyApfcFeiEPiCnrTf+i5awKy4oyTjwhRdaZ4Pz9Gv/G3vXOz2mwk5La6QBz2YjMlVGCsdzYKLyYKep4VM5wr3yDhzH+MJq69iIvOoNzk4/vR8RCvgJDZcSkn4AlwyULzWvkwFmHZHmmirgWgl2NF74opV2c2HIkORqNrY6C36LLLcThIw51rMXjtfL1B/LUivpk8hNkrXpQ9EJ2AQmMvFSSwEyS7BOBeh7uAbMjvPKC44uYeXBqRsJE2erYrKCm1Ymk04j8uDYXDcItTLA3lKVsW5J3qg8ly6VRYGpSNNQ4rUFwo4autak0qRSd7oUKEdzXFICdRlXSgCuSl05rgnLufaSEluCsqZjyKQXTkUrbgod6KQ+3kg91inwopPbLraeh3ghPX5m5LNPLlSWSRMkJ1qXrEakSqyLcpnvpBcIamMTp4pDLyFqpJXIHB/dInGVpz+4e1rkc6eH2fPCRvpCxx5tAtzBZpA5ki6BoZ57AgbYkwvuv8i6U4TjAqUTYimHmkMTIjDLRhrrpttrRoJ+o+hFtJ2r3oO6TRHtRN3JKnVDCYG971xXcjsbcVrrtN31Qpw8WM5rhOLqN8FKY8TUA54W/mC7OvqtyPstAED0MujhMh5Gwekx1Qht5wO4i2z+/qgU2t6m8Xh+0Xn5RYU82dtlGQcrHKzVERs7RN+zWPH/0Fxlin/oJFwgfs65b2M+MvIfnk2o2y9mFB8f6+XVPLyv9B4GPsWW1m0AkDYVA+3H48Yt/3D2PzkXgmud7vYO3ms0Nt8uQ2mkU2Ll9XLd/ARkUgsFrQsAAA=="}'`,
	},
	{
		templateName: 'RigSetGenericDisplayData',
		displayName: 'Set Generic Display Data',
		functionName: 'RigSetGenericDisplayData',
		description: 'Applies generic display data to the selected entities.',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.setGenericDisplayData","version":1,"code":"H4sIAAAAAAAA/+1YW0/bMBT+K5GnSTBFqGwTaJH2AHSMadoeBtoLRZFjnyYWrl3ZziCr+t93nKY0vZCOSzdKeQK75/595xy3A5JIzS4tic4HRHASjc4krP5GpJsrhkdqUhRCGQe9Shr/K2+8VnkICaeOjqXwdtA+jr8fnkXv9/Z3Q6Z7fa1AORsNOqQnFDBDuy5iuXW6Fyvagw7qwrUzFO0zLbWJOuTVXvto/9OHDgkdfoQXp+CCz6DACBa0he1LWgRt9Nshw4tQOCoFi1rJWBpvw7o3NOrdnA8SLbmXG/u5yjBo9DLrPzW0mDg/6PelABukVQC8CsAnHjgduAwCCxKYAx5grsKh9M5MaDrp5pZRFPEn64y4BJcZnafZVORhrjgYibF7weHFEIPNlYvehYJH9aSsEt0umBjSFF2R4TAkVmpHotYwnAGqr2KQNaR82fG6PIbEFf3yJJjDU1/mhkoSdam0EBLdd0Kr2gUHy4wob1HJY1BzvTvnOpGxo2nNtx6rHnt73j1+HJEvNjgRnIPytGOVCC8wUsFmiTnx93bPF6iyTYxIdyy4iicVTUYRhrcQXXTjX9Qsp/pIaHH9LNNlAT1mjTC4azdv5JeAq9hQlcJUHX1aN3VoIzQn1H6FopaJoQwZ5A0Kg9TDKwxDTfBU2vRuT7ykaRFXLpbmr/LefOiv0YgptvxtOElje6oGM3mUkPxE2R9lxh59k4IP/rRsIC/XlCKTekSav8nx/4ObCCkTTQ3/p9hiDzwg8UnMD82+zo8bq9u3l+Ljo9G1YeqIa+A3U+dwHFVw5gs7T9XDWjFuiwWrKGgi4d5lnZtnTVE874axGeXaDxIuctu4WJrUcbuCSl1W3xR32EzYjsGBKgLfk2OmHGXALoNvms+wZNy8dr6MTbBO1B6r6V+wm2AnZVBBsibgPfY2noJiuxHKxbZ61GVbCyyO0dl+s9tqNYzyanCdllornlrg35Gb0Ebr9iZ8KAuRYs+QYY9R5d3n1tKrln9yXZ7gl9XMKbA2HgV1531Zs2Avi5enzqait/GPnVkw7vPeWWwOkVk+EA9v5NdpCz3xHlq3p87qODhn7jmxcIUwzPTuWg+CjXsdsVyiYhpb8RviDHxd775ip4xcCf7ye9DGg7jxb6X5cj5wSC4AefmkPBopnaLOOm2rp99S6/Bsar0Qbq27f/lvcius9orkL4Z/AHzpudwUIwAA"}'`,
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
