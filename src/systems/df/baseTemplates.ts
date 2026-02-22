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
		templateName: 'RigAnimate',
		displayName: 'Animate',
		functionName: 'RigAnimate',
		codetemplateData: `'{"author":"Millo5","name":"§b§lFunction §3» §brig.animate","version":1,"code":"H4sIAAAAAAAA/6VUTU/EIBD9KxvOjfFrTeSmWY170IPxpqZhYVpRCg1MN242/e8C22p325oaT2WG4b1HZx5bslKGfzhCn7dECkJ3MUmaLyVZpbkPmc19ka9BKJpqv4qZcCoGCREMWVvls9vFbfpw/UTPLufzhJtKIz1NpKAvpJAauGUZUqdlloFNIc9fSE3qOiFOGST0uE4OSEqdguqwaFZA4BY+h5syrJne+KBUlWWK0IwpBwkxJUqjOwkBjlsZs/7MjUaJm9ly0SE/mUpeGBHTDT9+4p/57wPEPv3pVHqmZfE/9iuPwMJ6X8HZVAX4Q6+r4s/0T7KAmdQzlGEKf/jPJ3dfI9jyUISAjFUK0zVTFXxDNHv7ACeRdVQ12qonehk5jdr9twH18576N6+zaxDRWCsidhrfP7lSKbK8c9a0Mm6D1nBzv+1FudmdFAJ0cCtvSsTG31LyQz93CC/q17rFJlbmRywOBJAoZOhF4EypdNqzsGZ2xK+Om9gu5R+CX00/CNG6bgSl795BlMY8IyB9Dw6C4DhC30PD/6Od4BGY85EOHWljwQGOd8qBAo6pWb0PtCqAfs/J4w7otf4CXZ9BABEGAAA="}'`,
	},
	{
		templateName: 'RigAnimateNoReset',
		displayName: 'Animate No Reset',
		functionName: 'RigAnimateNoReset',
		codetemplateData: `'{"author":"Millo5","name":"§b§lFunction §3» §brig.animate.noreset","version":1,"code":"H4sIAAAAAAAA/8VWXW+bMBT9K8hSpaKhKGnXSUPaQ9ePtdLaPTRva4Uc7BCvxka26RpV/PfZDiR8JpBm6ksCF/vc43PvufAGZpSHzxL4v98AQcBf3QMv//fBPGWhvoUi0ov0GoXjfLW+shGzy954AEEFi1U6+nZ5Hdx/n/qnX8/OvJCnTPknHkH+I4gJw6GAc+VLRuZzLAIcRY8gA1nmAUm5Av4482pJEhZgWsrCYIxNbqRjapmYa8iW+iahqYAU+HNIJfYATxThrBRAWIaC2Kjec8UUUUvn9rKUfNI3ecyRDef51asanP/OQFTTn/RNDxmJ35f9XCNAc11lcNqXgdqkZ2k8OP2UxNghzFHEdOEm/+fe1WcKi6ROAuE5TKkKXiBN8Roif1YFmNisnayVSBukb21OTle6tbA/a7Cf0UDBqJSdF2DXJqPhrx9raOncEIQwM54L8yVoqbmSsO7KUr98yZ6yAhsIEo2gLSseMS6wxApYQm3+FjjBUO12+AsUTe2Ybl0dlSG32lPt6q0ObgUxdI/0k2PrJXdkQAOCZAk4ZRK+YLTVoN0KT3UJ1wKfU8r/Oj+JVM7FArIIy7LS11xcwXDR1KehdWPLRmEBw2dsJEVE4FBv0VRsQfMWLSC7ShJCSoN+c7dVUCumUdF9d22K8daB0qxCK0o+pTpAmsNuj15rzqtWsx9pUyyOrUDKPbL/9fYzZFcBc+WOKGaRWrifJm5lPNX8RjlEASxm6dZmCClfGb5fN0hM9b6Az/7sbofVC6CthtpQw6tv36ydpa+4wL5ECZYXnNlN6ey8eHQD5UUqFY+n2oAHOeY+rTquuZZQPcMNW2Ij+1DG9sMhyDH39GqaEuQcZI7u9GpFgB9YbY5ohqOIsOnOB1uHag8fuiOtu1Y/6+O77tYTt+KMt46i1gEwrgyeAS3xzZxVKUFmqTJA97+m/1EhCqUarsdOXSd7m2DA4Qfa4gPP/7C/Bw7h/fWna7+RdUlkUvny/ADKdXEHkadweQd1E712EH/K/gGvnOGIjw4AAA=="}'`,
	},
	{
		templateName: 'RigLoadAnimation',
		displayName: 'Load Animation',
		functionName: 'RigLoadAnimation',
		codetemplateData: `'{"author":"Millo5","name":"§b§lFunction §3» §brig.load_animation","version":1,"code":"H4sIAAAAAAAA/7VUS2sbMRD+K0FQqMGEOn0c9lboK9C0l5JLKctYmnVFtJKRZk1C2P/eGe2us7bjZhvTk6TRzHzfPO/V0gV9k1Tx815Zo4rureb9Waiq8ZqfEFesxDqEda/NtywRq7Uv0bGaAQIReqiRxRFT44jldLeW9wYiP9auieBUUYFLOFdhTTb4raBt5yq5QKp41c6nwdTBZHGPQrf0JAr7wKSjzVK2uRIXZ5cf1AP8Yio8eFufhv6ePYDcdxlcTGXgmf2/MXgAeT0VpIpyblF8I0EbrIBLXG7ANbj10P/t2i9yZEdpUWxGrN4csPptPY2cZpk0Z07hKGdvDyyXriRYjWzDkPdPQkJC4u9CXaazL9YY9NLvulcxd0zf6v2JGAG+a3+1g28V7ercBTAlDCVVmc9jo2WrshuIJ4arU9ofLQZ6wT8vc/PPznX3EthZd5WmmLFh0iEXrPEJNmjUeMCE+TbUa4gfb22iJJSIol02JIbfvv8YBRFB32CuhI2o2QunM6ds6IsQ6+Mxa3CunLZT/mPY+x0yCUownoG22G8Pg5qNroATrDH9NbPahYRTU5uQTumnYVUPkTjr8fSkPac+h4v3UahhHx0hfLHb3J+RvnJvX+c9xV9/AOtBwxX6BgAA"}'`,
	},
	{
		templateName: 'RigDecodeMatrices',
		displayName: 'Decode Matrices',
		functionName: 'RigDecodeMatrices',
		codetemplateData: `'{"author":"Millo5","name":"§b§lFunction §3» §brig.decodeMatrices","version":1,"code":"H4sIAAAAAAAA/81Y0U7bMBT9lcoSEoEw4tgNad4GiG0S28Po9jJQZRI3tUidKHEnOtR/n5OGkrbUvZR02hPYvfY9Pufqnt4+ofskDR8KFPx6QiJCwXyN7PpvgIYTGeoly2MdpGMUH9fR+r9qpzxVLWwUMcWeo/Tu0+XV4Nt5PyC9btcO04lUAbFFFNyisZA8zNlQBYUUwyHPBzyOb9EMzWY2KpJUocCZ2StJMjngSSOLZGOut3NeTBKl99U0K9e/Wa4XWTLJWYKCIUsKbqM0UyKVi42XNBiahkkxZuUll+X+Ipt6VG/I5q5lGwmpmsxFNeflBQ023O7ayftkoFjcODvPqj+5KpOWEPXHAfpSdD6LKOKylDGsQ6KpfpYIV4VuJPRmd7Pnu1Eu4g8RD9OIf2UqFyEvUIXntYopuBrMNdhSNPOgFZrvp0pfrlGEacVvoivFWBWv3rIq1obb1sXfTOqP/tWJvyD1YsRy/dAmpTeaGBn30/P6Bat87ChmP5+8aHkjYsmjHbPOFd1wcl9yevTdYm4pCbz8rHNWcI9eVsX6fxepkZuVV336I7LyTeNMt7u9qZVUTeJfqnUtCnXNZaxG+3rTwh42PmsJ0EXOmeIlrM2Acp7poB3xiLcwLCfj9RscYwd79ciB7oajwwMN6FBrbJ1S/wRbzd6wTELnO5Mx7zQYyFn4ULW7SOQ81Cd0g6qKpbbBmpI9aTguTefx3cTVLAgZ8cfDqk7tBjHCOqL+cYdY1hF2/eMtYS4sDFvWCXa6nk/cU+w4jrWzduY8HgxOFxZGDajXv8LsjroHg+PDws4MqEl7qDFMeoxhYY4BNW0RNUx6TGFhxIB6/dvN7qhh0uMzWJhnQO21h9qFSe86MNQ9A+qzFlHDpHdhDdJ1Daj9FlHDpHdhDdLtGlD32kNNYNK7sAbp+iaXadEcCUx7AuuQxGiOLbojgYlPYC2SmNwRt2iPBKY+gfVIYrJH3KI/Upj6FNYkqckfcYsGSWHqU1iXpCaDxC06JIWpT2FtkpocEntvH5X2PbuBRtJt48PKTPox06NN9JMlE26cgMIknf/MtjwC3c3+AhSdxRVWFQAA"}'`,
	},
	{
		templateName: 'RigInitRig',
		displayName: 'Init Rig',
		functionName: 'RigInitRig',
		codetemplateData: `'{"author":"Millo5","name":"§b§lFunction §3» §brig.init.rig","version":1,"code":"H4sIAAAAAAAA/81V2WrcMBT9lUEwMC6uWw+0D4Y8hJC0gRT6EPpSglEkxRbRSEaW0wzB/94reRbPeKk9S8mTtdztHJ17/YYehSLPOYp+vyFOUVTtkb/6RuipkAS2WCdgBDaGLVbWsHIn1iuTMRNgRrHB9lDiBYNjuPORWWZ2bV4NbDJRaCxQ9IRFznykMsOV3ByUpY9yoQyKPpf+XoqUS1PL4M5scTYA2jrOvzQ8H0VscFLzrbLCzY1NakuE6wjd5pPvnFImLV6yMqFLwMLJPiO1hF/Lh3IdG2meBFxyE8ACuUraSCVYiHgYsy9YN3m1WaZwM+PUC6SiLAebnChHdCFz/MIo6iOzNSqWfIEd7G0wwSWrRQpbsa5L6QacMxNXOU8CN+b0X4htnZtHvNIMG3bHc9NdomYZGB1YoS2qm7WB/I981XCE0O91sdX5pRDqz8SyMblKsUxcng1XN0pfY5I2mWlIvuGy5VZj8sxcu3LNCLhAKa6vVsNgHfI8erHcBW72HPcg/a/a5L8acc0ZWGNul7hvzNxCgHvcMyv+f+sM5qaX43AX6mUGAqC/sAAh9umECFWN5GFCOapr7cCL3fpYpbhIGYDBySjFHDqH560NeC2NXr6bLtyRnsVU7Take4FgMjHpqX5dh/Avi0UzWNhN9E+V2bm5L+OT8tZg5byS3MFnwd1V+c/TcnwMrtbXmUJvpDMnpYop79Pc60b0oxCGZ6J/6LyvtphySdnrrP6Afg019z7MP4aeN7JvWn9OA1J5PeReHDXKB3s8lH8BBJSpCagMAAA="}'`,
	},
	{
		templateName: 'RigSpawn',
		displayName: 'Spawn',
		functionName: 'RigSpawn',
		codetemplateData: `'{"author":"NineOfGaming","name":"§b§lFunction §3» §brig.spawn","version":1,"code":"H4sIAAAAAAAA/+VXbWvbMBD+K0Yw2MCUdisdGPahr1tZtw9bui9rMap9dkVlyUhyu1L833uS48SJ45c0SxnsU6KzdPfco0d30hO54TK60yT4/URYTIJqTPzpb0CSQkQ4pCrFSTjHQDadjf+cxa5yA5/E1NB6FlqfTs7C70eTYP/g454fyUKYYM9ncXBFMiYgUjQxgRYsSUCFkKZXpCRl6RPNpSHBbukvBclFCLwRRdAM0AzCMMNA4xfzmFvLPVU4yHmhKCdBQrkGn8jcMClmhnmgvbGB8NsshPljBkOgA9CRYs6Ka04t0Efv/KSR5fuxwTMZO/MG8b9ZF4vhP4wNj2qYB68G6wX/mdMH4eFK6gxzCPstCDc8NDRtYJC1kzPr2eLAzwE5194XFscgrD6j6ZT4ERGzaFnBDcYPyuuy9k0US3e0hUYcjFUnQIMJK0UNHIJq0rJo0KQjWfGGqu9VuCiytodd0tSqxT5L9lM3agU5UPNC0AKVsg7ulU4stW/wy1sn3Xc71qlueC2EpvcQk76T2C2FiSrmSjjkXD54F0wb7/iWitTFmbF0JtUpjW7b5LRE0Voyp1fR6A4snzFTEOEShOKUNz0TtcvtqMhyt+Pqz2Z70r+xbf6rMtOug80CtkDcZzDn6GCC27JNKhzp/wQZDslGdLDktdlYmUgFZ1SpGToLQqqsO98U44VTvy9Luuo/2938heRd8zqy+E+YznuZiLisWtQYKsC2s/+dV3tA/jKt7qL1qlyMvbN8Bci940IpxOj9kIbWEGtKJsAhl8p0ptPdtBpLDaYMlrcLqk1179wuXfX1dHPx9La5Zf2AOS60ka7AbjfrlTXTZR0u9MORmb5Skpu12sbLavS+phiv+X6YHtjLS3x3dIDvSvwwx+oX/6K86C+SS7Vh6CYWUc7Dcc/atbdu5O4PnJaRV48YElpw0/uaHHxRtF+Ag0v2lx9QVLCMGszgunwG8s2vP1EQAAA="}'`,
	},
]

export function buildDFBaseTemplateItems(): CodeClientTemplateItem[] {
	return DF_BASE_HELPER_DEFINITIONS.map(buildHelperTemplate)
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
