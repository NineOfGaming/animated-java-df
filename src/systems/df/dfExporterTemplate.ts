import { buildDFFunctionIconItemSnbt } from './functionIcon'
import type { CodeBlock } from './types'

export function buildDFExporterFunctionBlock(modelName: string): CodeBlock {
	return {
		id: 'block',
		block: 'func',
		data: `rig.init.${modelName}`,
		args: {
			items: [
				{
					item: {
						id: 'item',
						data: {
							item: buildDFFunctionIconItemSnbt({
								displayName: `Init Rig ${modelName}`,
								icon: { model: 'minecraft:turtle_egg', usage: 'setup' },
							}),
						},
					},
					slot: 0,
				},
				{
					item: {
						id: 'pn_el',
						data: { name: 'nodes', type: 'var', plural: false, optional: false },
					},
					slot: 1,
				},
				{
					item: {
						id: 'pn_el',
						data: { name: 'animations', type: 'var', plural: false, optional: false },
					},
					slot: 2,
				},
				{
					item: {
						id: 'pn_el',
						data: { name: 'variants', type: 'var', plural: false, optional: false },
					},
					slot: 3,
				},
				{
					item: {
						id: 'bl_tag',
						data: {
							option: 'True',
							tag: 'Is Hidden',
							action: 'dynamic',
							block: 'func',
						},
					},
					slot: 26,
				},
			],
		},
	}
}
