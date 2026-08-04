const DF_FUNCTION_ICON_NBT_VERSION = 4671

export type DFFunctionUsage = 'setup' | 'runtime' | 'internal'

export interface DFFunctionIconDefinition {
	model: string
	usage: DFFunctionUsage
}

export interface DFFunctionIconOptions {
	displayName: string
	description?: string
	icon: DFFunctionIconDefinition
}

const DF_FUNCTION_ICON_COUNTS: Record<DFFunctionUsage, number> = {
	setup: 1,
	runtime: 2,
	internal: 3,
}

function quoteSnbtString(value: string) {
	return JSON.stringify(value)
}

export function buildDFFunctionIconItemSnbt(options: DFFunctionIconOptions) {
	const descriptionLines = (options.description ?? '')
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(line => line.length > 0)
	const loreLines = [
		`{bold:0b,color:"white",extra:[{color:"#F2B84B",text:"Animated Java DF"}],italic:0b,obfuscated:0b,strikethrough:0b,text:"",underlined:0b}`,
		...descriptionLines.map(
			line =>
				`{bold:0b,color:"white",extra:[{color:"gray",text:${quoteSnbtString(line)}}],italic:0b,obfuscated:0b,strikethrough:0b,text:"",underlined:0b}`
		),
	]

	return (
		`{DF_NBT:${DF_FUNCTION_ICON_NBT_VERSION},components:{` +
		`"minecraft:custom_name":{extra:[{color:"#6DC7E9",text:${quoteSnbtString(options.displayName)}}],italic:0b,text:""},` +
		`"minecraft:item_model":${quoteSnbtString(options.icon.model)},` +
		`"minecraft:lore":[${loreLines.join(',')}]` +
		`},count:${DF_FUNCTION_ICON_COUNTS[options.icon.usage]},id:"minecraft:sniffer_egg"}`
	)
}
