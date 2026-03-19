import { registerAction, registerBarMenu } from 'src/util/moddingTools'
import { pollUntilResult } from 'src/util/promises'
import type { ResourceLocation } from 'src/util/resourceLocation'
import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { cleanupExportedFiles } from '../systems/cleaner'
import {
	type DFBaseTemplateCategory,
	DF_BASE_HELPER_DEFINITIONS,
	getDFBaseTemplateCount,
	getDFBaseTemplateDefinitions,
} from '../systems/df/baseTemplates'
import {
	exportDFBaseTemplate,
	exportDFBaseTemplates,
	exportProject,
	exportProjectDF,
} from '../systems/exporter'
import { translate } from '../util/translation'
import { checkForUpdates } from '../util/updateChecker'
import { openChangelogDialog } from './changelogDialog'
import { openAboutDialog } from './dialog/about'
import { openBlueprintSettingsDialog } from './dialog/blueprintSettings'

function createIconImg() {
	const img = document.createElement('img')
	Object.assign(img, {
		src: AnimatedJavaIcon,
		width: 16,
		height: 16,
	})
	Object.assign(img.style, {
		position: 'relative',
		top: '2px',
		borderRadius: '2px',
		marginRight: '6px',
		boxShadow: '1px 1px 1px #000000aa',
	})
	return img
}

const SEPARATOR_A = new MenuSeparator('animated-java:menu-separator/menubar-separator-a')
const SEPARATOR_B = new MenuSeparator('animated-java:menu-separator/menubar-separator-b')

const OPEN_ABOUT = registerAction(
	{ id: 'animated-java:action/about' },
	{
		icon: 'info',
		category: 'animated_java',
		name: translate('action.open_about.name'),
		click() {
			openAboutDialog()
		},
	}
)

const OPEN_DOCUMENTATION = registerAction(
	{ id: 'animated-java:action/documentation' },
	{
		icon: 'find_in_page',
		category: 'animated_java',
		name: translate('action.open_documentation.name'),
		click() {
			Blockbench.openLink('https://animated-java.dev/docs')
		},
	}
)

const OPEN_CHANGELOG = registerAction(
	{ id: 'animated-java:action/changelog' },
	{
		icon: 'history',
		category: 'animated_java',
		name: translate('action.open_changelog.name'),
		click() {
			openChangelogDialog()
		},
	}
)

const CHECK_FOR_UPDATES = registerAction(
	{ id: 'animated-java:action/check-for-updates' },
	{
		icon: 'update',
		category: 'animated_java',
		name: translate('action.check_for_updates.name'),
		click() {
			void checkForUpdates({ manual: true })
		},
	}
)

function areMultipleBlueprintsOpen() {
	return Blockbench.ModelProject.all.filter(p => p.format.id === BLUEPRINT_FORMAT_ID).length > 1
}

async function exportAll(debugMode: boolean) {
	const selectedProject = Project
	const blueprints = Blockbench.ModelProject.all.filter(p => p.format.id === BLUEPRINT_FORMAT_ID)
	let success = true
	for (const project of blueprints) {
		project.select()
		await new Promise(resolve => requestAnimationFrame(resolve))
		success = await exportProject({ debugMode })
		if (!success) break
		await new Promise(resolve => requestAnimationFrame(resolve))
	}
	if (success) selectedProject?.select()
}

const EXPORT_ALL_DEBUG = registerAction(
	{ id: 'animated-java:action/export-all-debug' },
	{
		icon: 'bug_report',
		category: 'animated_java',
		name: translate('action.export_all_debug.name'),
		description: translate('action.export_all_debug.description'),
		condition: areMultipleBlueprintsOpen,
		click() {
			console.log('Exporting all open Blueprints in development mode...')
			void exportAll(true)
		},
	}
)

const EXPORT_ALL = registerAction(
	{ id: 'animated-java:action/export-all' },
	{
		icon: 'insert_drive_file',
		category: 'animated_java',
		name: translate('action.export_all.name'),
		description: translate('action.export_all.description'),
		condition: areMultipleBlueprintsOpen,
		click() {
			console.log('Exporting all open Blueprints...')
			void exportAll(false)
		},
	}
)

const OPEN_BLUEPRINT_SETTINGS = registerAction(
	{ id: 'animated-java:action/blueprint-settings' },
	{
		icon: 'settings',
		category: 'animated_java',
		name: translate('action.open_blueprint_settings.name'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			openBlueprintSettingsDialog()
		},
	}
)

const EXTRACT = registerAction(
	{ id: 'animated-java:action/extract' },
	{
		icon: 'fa-trash-can',
		category: 'animated_java',
		name: translate('action.extract.confirm'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			void cleanupExportedFiles()
		},
	}
)

const EXPORT_DEBUG = registerAction(
	{ id: 'animated-java:action/export-debug' },
	{
		icon: 'bug_report',
		category: 'animated_java',
		name: translate('action.export_debug.name'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			void exportProject({ debugMode: true })
		},
		keybind: new Keybind({ ctrl: true, key: 69 /* E */ }),
	}
)

const EXPORT = registerAction(
	{ id: 'animated-java:action/export' },
	{
		icon: 'insert_drive_file',
		category: 'animated_java',
		name: translate('action.export.name'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			void exportProject()
		},
		keybind: new Keybind({ ctrl: true, shift: true, key: 69 /* E */ }),
	}
)

const EXPORT_DF = registerAction(
	{ id: 'animated-java:action/export-df' },
	{
		icon: 'insert_drive_file',
		category: 'animated_java',
		name: translate('action.export_df.name'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			void exportProjectDF()
		},
	}
)

const DF_BASE_TEMPLATES_ALL_ACTION_ID = 'animated-java:action/df-base-templates-all'
const DF_BASE_TEMPLATES_REQUIRED_ACTION_ID = 'animated-java:action/df-base-templates-required'
const DF_BASE_TEMPLATES_OPTIONAL_ACTION_ID = 'animated-java:action/df-base-templates-optional'

const REQUIRED_DF_BASE_TEMPLATES = getDFBaseTemplateDefinitions('required')
const OPTIONAL_DF_BASE_TEMPLATES = getDFBaseTemplateDefinitions('optional')

const DF_BASE_TEMPLATES_ALL = registerAction(
	{ id: DF_BASE_TEMPLATES_ALL_ACTION_ID },
	{
		icon: 'all_inclusive',
		category: 'animated_java',
		name: `${translate('action.df_base_templates_all.name')} (${getDFBaseTemplateCount()})`,
		click() {
			void exportDFBaseTemplates()
		},
	}
)

const DF_BASE_TEMPLATES_REQUIRED = registerAction(
	{ id: DF_BASE_TEMPLATES_REQUIRED_ACTION_ID },
	{
		icon: 'check_circle',
		category: 'animated_java',
		name: `${translate('action.df_base_templates_required.name')} (${getDFBaseTemplateCount(
			'required'
		)})`,
		click() {
			void exportDFBaseTemplates('required')
		},
	}
)

const DF_BASE_TEMPLATES_OPTIONAL = registerAction(
	{ id: DF_BASE_TEMPLATES_OPTIONAL_ACTION_ID },
	{
		icon: 'extension',
		category: 'animated_java',
		name: `${translate('action.df_base_templates_optional.name')} (${getDFBaseTemplateCount(
			'optional'
		)})`,
		click() {
			void exportDFBaseTemplates('optional')
		},
	}
)

function getDFTemplateActionId(definition: (typeof DF_BASE_HELPER_DEFINITIONS)[number]) {
	return `animated-java:action/df-base-template-${definition.templateName
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase()}`
}

function formatDFTemplateTooltip(description: string): string {
	return description
		.replace(/\\n|\/n/g, '\n')
		.split(/\r?\n/)
		.map(line => line.replace(/[ \t]+/g, ' ').trim())
		.join('\n')
		.trim()
}

function buildDFTemplateSetTooltip(
	definitions: ReadonlyArray<(typeof DF_BASE_HELPER_DEFINITIONS)[number]>,
	headingKey: string
) {
	return [
		translate(headingKey),
		...definitions.map(definition => `- ${definition.displayName ?? definition.templateName}`),
	]
		.join('\n')
		.trim()
}

const DF_TEMPLATE_ACTION_TOOLTIPS = new Map<string, string>()

DF_TEMPLATE_ACTION_TOOLTIPS.set(
	DF_BASE_TEMPLATES_ALL_ACTION_ID,
	[
		translate('action.df_base_templates.tooltip.includes'),
		'',
		translate(
			'action.df_base_templates.tooltip.required_section',
			String(REQUIRED_DF_BASE_TEMPLATES.length)
		),
		...REQUIRED_DF_BASE_TEMPLATES.map(
			definition => `- ${definition.displayName ?? definition.templateName}`
		),
		'',
		translate(
			'action.df_base_templates.tooltip.optional_section',
			String(OPTIONAL_DF_BASE_TEMPLATES.length)
		),
		...OPTIONAL_DF_BASE_TEMPLATES.map(
			definition => `- ${definition.displayName ?? definition.templateName}`
		),
	].join('\n')
)

DF_TEMPLATE_ACTION_TOOLTIPS.set(
	DF_BASE_TEMPLATES_REQUIRED_ACTION_ID,
	buildDFTemplateSetTooltip(
		REQUIRED_DF_BASE_TEMPLATES,
		'action.df_base_templates_required.tooltip'
	)
)

DF_TEMPLATE_ACTION_TOOLTIPS.set(
	DF_BASE_TEMPLATES_OPTIONAL_ACTION_ID,
	buildDFTemplateSetTooltip(
		OPTIONAL_DF_BASE_TEMPLATES,
		'action.df_base_templates_optional.tooltip'
	)
)

for (const definition of DF_BASE_HELPER_DEFINITIONS) {
	const tooltip = definition.description && formatDFTemplateTooltip(definition.description)
	if (!tooltip) continue
	DF_TEMPLATE_ACTION_TOOLTIPS.set(getDFTemplateActionId(definition), tooltip)
}

function getMenuActionId(element: Element): string | undefined {
	const htmlElement = element as HTMLElement
	return (
		element.getAttribute('menu_item') ??
		element.getAttribute('action') ??
		element.getAttribute('data-action') ??
		htmlElement.dataset.menuItem ??
		htmlElement.dataset.action ??
		undefined
	)
}

function applyDFTemplateTooltips(root: ParentNode = document) {
	const menuNodes = root.querySelectorAll<HTMLElement>('li, .menu_node, .menu_item')
	for (const node of menuNodes) {
		const actionId = getMenuActionId(node)
		if (!actionId) continue
		const tooltip = DF_TEMPLATE_ACTION_TOOLTIPS.get(actionId)
		if (!tooltip) continue
		node.title = tooltip
	}
}

const DF_BASE_TEMPLATE_SPECIFIC_ACTIONS = DF_BASE_HELPER_DEFINITIONS.map(definition =>
	registerAction(
		{
			id: getDFTemplateActionId(
				definition
			) as ResourceLocation.Validate<'animated-java:action/df-base-template-rig-animate'>,
		},
		{
			icon: 'description',
			category: 'animated_java',
			name: definition.displayName ?? definition.templateName,
			click() {
				void exportDFBaseTemplate(definition.templateName)
			},
		}
	)
)

function createDFBaseTemplatesSpecificCategorySubMenu(category: DFBaseTemplateCategory) {
	const categoryActions = DF_BASE_HELPER_DEFINITIONS.filter(
		definition => definition.category === category
	).map(definition =>
		DF_BASE_TEMPLATE_SPECIFIC_ACTIONS[DF_BASE_HELPER_DEFINITIONS.indexOf(definition)].get()
	)

	if (categoryActions.some(action => action == undefined)) return

	return {
		id: `animated_java:submenu/df/base_templates_specific/${category}`,
		name: translate(
			category === 'required'
				? 'action.df_base_templates_required_group.name'
				: 'action.df_base_templates_optional_group.name'
		),
		icon: category === 'required' ? 'check_circle' : 'extension',
		searchable: false,
		children: categoryActions,
	}
}

function createDFBaseTemplatesSpecificSubMenu() {
	const requiredSubMenu = createDFBaseTemplatesSpecificCategorySubMenu('required')
	const optionalSubMenu = createDFBaseTemplatesSpecificCategorySubMenu('optional')
	if (requiredSubMenu == undefined || optionalSubMenu == undefined) return

	return {
		id: 'animated_java:submenu/df/base_templates_specific',
		name: translate('action.df_base_templates_specific.name'),
		icon: 'description',
		searchable: false,
		children: [requiredSubMenu, optionalSubMenu],
	}
}

function createDFBaseTemplatesSubMenu() {
	if (
		DF_BASE_TEMPLATES_ALL.get() == undefined ||
		DF_BASE_TEMPLATES_REQUIRED.get() == undefined ||
		DF_BASE_TEMPLATES_OPTIONAL.get() == undefined
	)
		return

	const specificSubMenu = createDFBaseTemplatesSpecificSubMenu()
	if (specificSubMenu == undefined) return

	return {
		id: 'animated_java:submenu/df/base_templates',
		name: translate('action.df_base_templates.name'),
		icon: 'construction',
		searchable: false,
		children: [
			DF_BASE_TEMPLATES_ALL.get(),
			DF_BASE_TEMPLATES_REQUIRED.get(),
			DF_BASE_TEMPLATES_OPTIONAL.get(),
			specificSubMenu,
		],
	}
}

function createDFSubMenu() {
	if (EXPORT_DF.get() == undefined) return

	const baseTemplatesSubMenu = createDFBaseTemplatesSubMenu()
	if (baseTemplatesSubMenu == undefined) return

	return {
		id: 'animated_java:submenu/df',
		name: translate('action.df.name'),
		icon: 'diamond',
		searchable: false,
		children: [EXPORT_DF.get(), baseTemplatesSubMenu],
	}
}

function createExtractSubMenu() {
	if (EXTRACT.get() == undefined) return
	return {
		id: 'animated_java:submenu/extract',
		name: translate('action.extract.name'),
		icon: 'fa-trash-can',
		searchable: false,
		children: [EXTRACT.get()],
		condition: activeProjectIsBlueprintFormat,
	}
}

const MENUBAR = registerBarMenu({ id: 'animated-java:menubar/main' }, [])

MENUBAR.onCreated(menubar => {
	menubar.label.style.display = 'inline-block'
	menubar.label.innerHTML = translate('menubar.label')
	menubar.label.prepend(createIconImg())

	MenuBar.update()

	void pollUntilResult(
		() => {
			const items = [
				OPEN_ABOUT.get(),
				OPEN_DOCUMENTATION.get(),
				CHECK_FOR_UPDATES.get(),
				OPEN_CHANGELOG.get(),
				SEPARATOR_A,
				EXPORT_ALL_DEBUG.get(),
				EXPORT_ALL.get(),
				SEPARATOR_B,
				OPEN_BLUEPRINT_SETTINGS.get(),
				createExtractSubMenu(),
				EXPORT_DEBUG.get(),
				EXPORT.get(),
				createDFSubMenu(),
			]

			if (items.every(i => i != undefined)) {
				return items
			}
		},
		// Stop polling if the menu is removed
		() => !MENUBAR.get()
	).then(items => {
		for (const item of items) {
			if (!(item instanceof Action)) continue
			// Initialize each action
			menubar.addAction(item)
		}
		// Overwrite structure
		menubar.structure = items
	})

	applyDFTemplateTooltips()
	const tooltipObserver = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof Element)) continue
				applyDFTemplateTooltips(node)
			}
		}
	})
	tooltipObserver.observe(document.body, { childList: true, subtree: true })
	MENUBAR.onDeleted(() => tooltipObserver.disconnect())
})
