/**
 * Mega menu template import/export helpers.
 *
 * @package
 */

/* global FileReader */

import apiFetch from '@wordpress/api-fetch';

export const TEMPLATE_EXPORT_VERSION = '1.0.0';

const DEFAULT_SETTINGS = {
	width: 'container',
	bgColor: '',
	animation: 'fade',
};

/**
 * Normalize panel settings (container width only).
 *
 * @param {Object} settings Raw settings.
 * @return {Object} Sanitized settings.
 */
export function normalizeSettings(settings = {}) {
	const merged = { ...DEFAULT_SETTINGS, ...settings };

	return {
		width: 'container',
		bgColor: merged.bgColor ?? '',
		animation: merged.animation ?? 'fade',
	};
}

/**
 * @typedef {Object} MegaMenuTemplateExport
 * @property {string} version     Export format version.
 * @property {string} title       Template name.
 * @property {string} description Template description.
 * @property {Object} settings    Panel settings (width, bgColor, animation).
 * @property {string} content     Serialized Gutenberg block content.
 */

/**
 * Fetch all template summaries from the REST store.
 *
 * @return {Promise<Array>} Template list.
 */
export async function fetchTemplates() {
	const response = await apiFetch({
		path: '/snap-megamenu/v1/templates',
	});

	return response?.templates ?? [];
}

/**
 * Fetch a full template by slug.
 *
 * @param {string} slug Template slug.
 * @return {Promise<Object>} Full template payload.
 */
export async function fetchTemplate(slug) {
	return apiFetch({
		path: `/snap-megamenu/v1/templates/${slug}`,
	});
}

/**
 * Build an export payload from current editor state.
 *
 * @param {Object} params
 * @param {Object} params.settings Panel settings.
 * @param {string} params.content  Serialized block content.
 * @param {string} [params.title]  Optional export title.
 * @return {MegaMenuTemplateExport} Export-ready payload object.
 */
export function buildExportPayload({ settings, content, title = '' }) {
	return {
		version: TEMPLATE_EXPORT_VERSION,
		title: title || 'Mega Menu Template',
		description: '',
		settings: normalizeSettings(settings),
		content: content || '',
	};
}

/**
 * Trigger a JSON file download in the browser.
 *
 * @param {MegaMenuTemplateExport} payload    Export data.
 * @param {string}                 [filename] File name without extension.
 */
export function downloadTemplate(payload, filename = 'mega-menu-template') {
	const slug = filename
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: 'application/json',
	});

	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${slug || 'mega-menu-template'}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

/**
 * Parse and validate an imported JSON file.
 *
 * @param {File} file Selected JSON file.
 * @return {Promise<MegaMenuTemplateExport>} Parsed template export data.
 */
export function parseImportFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			try {
				const data = JSON.parse(reader.result);

				if (!data || typeof data !== 'object') {
					reject(new Error('invalid'));
					return;
				}

				if (typeof data.content !== 'string' || !data.content.trim()) {
					reject(new Error('missing_content'));
					return;
				}

				resolve({
					version: data.version || TEMPLATE_EXPORT_VERSION,
					title: data.title || '',
					description: data.description || '',
					settings: normalizeSettings(
						data.settings && typeof data.settings === 'object'
							? data.settings
							: {}
					),
					content: data.content,
				});
			} catch {
				reject(new Error('invalid_json'));
			}
		};

		reader.onerror = () => reject(new Error('read_error'));
		reader.readAsText(file);
	});
}

/**
 * Human-readable source label for template store entries.
 *
 * @param {string} source Source key from PHP.
 * @return {string} Human-readable source label.
 */
export function getTemplateSourceLabel(source) {
	switch (source) {
		case 'plugin':
			return 'Plugin';
		case 'child-theme':
			return 'Child theme';
		case 'theme':
			return 'Theme';
		default:
			return source;
	}
}
