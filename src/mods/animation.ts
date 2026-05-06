import { registerPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { openAnimationPropertiesDialog } from '../dialogs/animationProperties/animationProperties'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { isReservedAnimationName, normalizeAnimationName } from '../util/animationName'
import { localize as translate } from '../util/lang'
import { roundToNth } from '../util/misc'

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		excluded_nodes: CollectionItem[]
	}

	interface AnimationUndoCopy {
		excluded_nodes: string[]
	}

	interface AnimationOptions {
		excluded_nodes: string[]
	}
}

export const DEFAULT_SNAPPING_VALUE = 20
export const MINIMUM_ANIMATION_LENGTH = 0.05

//region Extend
registerPropertyOverridePatch({
	id: `animated_java:function-override/animation/extend`,
	target: Blockbench.Animation.prototype,
	key: 'extend',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: _Animation, data?: AnimationOptions) {
			original.call(this, data)
			this.snapping = DEFAULT_SNAPPING_VALUE
			this.length = Math.max(this.length, MINIMUM_ANIMATION_LENGTH)
			for (const animator of Object.values(this.animators)) {
				if (!animator) continue
				let lastTime = -Infinity
				for (const kf of animator.keyframes) {
					let rounded = roundToNth(kf.time, DEFAULT_SNAPPING_VALUE)
					if (rounded === kf.time) continue
					if (rounded === lastTime) rounded += 0.05
					kf.time = rounded
					lastTime = rounded
				}
			}
			return this
		}
	},
})

//region Set Length
registerPropertyOverridePatch({
	id: `animated_java:function-override/animation/set-length`,
	target: Blockbench.Animation.prototype,
	key: 'setLength',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: _Animation, length?: number) {
			length = Math.max(length ?? this.length, MINIMUM_ANIMATION_LENGTH)
			return original.call(this, length)
		}
	},
})

//region Reserved Names
registerPropertyOverridePatch({
	id: `animated_java:function-override/animation/create-unique-name`,
	target: Blockbench.Animation.prototype,
	key: 'createUniqueName',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: _Animation, references: _Animation[]) {
			const normalizedReferences = references ?? []
			const normalizedName = normalizeAnimationName(this.name)
			if (normalizedName) {
				this.name = normalizedName
			}

			if (isReservedAnimationName(this.name)) {
				this.name = `${this.name}_2`
			}

			const result = original.call(this, normalizedReferences)

			const normalizedResultName = normalizeAnimationName(this.name)
			if (normalizedResultName && normalizedResultName !== this.name) {
				this.name = normalizedResultName
				original.call(this, normalizedReferences)
			}

			if (isReservedAnimationName(this.name)) {
				this.name = `${this.name}_2`
				original.call(this, normalizedReferences)
			}

			return result
		}
	},
})

//region Properties Dialog
registerPropertyOverridePatch({
	id: `animated_java:function-override/animation/properties-dialog`,
	target: Blockbench.Animation.prototype,
	key: 'propertiesDialog',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => {
		return function (this: _Animation) {
			if (!Blockbench.Animation.selected) {
				Blockbench.showQuickMessage('No animation selected')
				return
			}
			openAnimationPropertiesDialog(Blockbench.Animation.selected)
		}
	},
})

//region Properties
registerPatch({
	id: `animated_java:property-definitions/animation`,

	apply: () => {
		const excludedNodesProperty = new Property(
			Blockbench.Animation,
			'array',
			'excluded_nodes',
			{
				condition: () => activeProjectIsBlueprintFormat(),
				label: translate('animation.excluded_nodes'),
				default: [],
			}
		)

		return { excludedNodesProperty }
	},

	revert: ({ excludedNodesProperty }) => {
		excludedNodesProperty.delete()
	},
})

//region Force Saved
registerPropertyOverridePatch({
	id: `animated_java:animation-force-saved`,
	target: Blockbench.Animation.prototype,
	key: 'saved',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => true,

	set: () => true,
})

//region Save All Action
registerPropertyOverridePatch({
	id: `animated_java:action-condition-override/save-all-animations`,
	target: BarItems.save_all_animations as Action,
	key: 'condition',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => false,
})
