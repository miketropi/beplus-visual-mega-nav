/**
 * LinkControl helpers for the Link Item block.
 *
 * @package Snap\MegaMenu
 */

import { escapeHTML } from '@wordpress/escape-html';
import { safeDecodeURI } from '@wordpress/url';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

export const LINK_CONTROL_SETTINGS = [
	{
		id: 'opensInNewTab',
		title: __('Open in new tab', 'snap-megamenu-builder'),
	},
];

/**
 * Query params for LinkControl post/page search.
 *
 * @param {string} type Block link type (post, page, etc.).
 * @param {string} kind Block link kind (post-type, custom, etc.).
 * @return {Object} suggestionsQuery for LinkControl.
 */
export function getSuggestionsQuery(type, kind) {
	let query;

	switch (type) {
		case 'post':
		case 'page':
			query = { type: 'post', subtype: type, perPage: 20 };
			break;
		default:
			if (kind === 'post-type' && type) {
				query = { type: 'post', subtype: type, perPage: 20 };
				break;
			}

			// No link yet — search pages and posts; show recent pages first.
			query = {
				type: 'post',
				perPage: 20,
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage: 20,
				},
			};
			break;
	}

	return applyFilters('snap-megamenu.link-item-suggestions-query', query, {
		type,
		kind,
	});
}

/**
 * Sync LinkControl value into block attributes (navigation-link pattern).
 *
 * @param {Object}   updatedValue    LinkControl value.
 * @param {Function} setAttributes   Block setAttributes.
 * @param {Object}   blockAttributes Current block attributes.
 */
export function updateLinkAttributes(
	updatedValue = {},
	setAttributes,
	blockAttributes = {}
) {
	const {
		label: originalLabel = '',
		kind: originalKind = '',
		type: originalType = '',
	} = blockAttributes;

	const {
		title: newLabel = '',
		url: newUrl = '',
		opensInNewTab,
		id,
		kind: newKind = originalKind,
		type: newType = originalType,
	} = updatedValue;

	const newLabelWithoutHttp = newLabel.replace(/http(s?):\/\//gi, '');
	const newUrlWithoutHttp = newUrl.replace(/http(s?):\/\//gi, '');

	const useNewLabel =
		newLabel &&
		newLabel !== originalLabel &&
		newLabelWithoutHttp !== newUrlWithoutHttp;

	const label = useNewLabel
		? escapeHTML(newLabel)
		: originalLabel || escapeHTML(newUrlWithoutHttp);

	const type =
		newType === 'post_tag' ? 'tag' : newType.replace('-', '_');

	const isBuiltInType =
		['post', 'page', 'tag', 'category'].indexOf(type) > -1;

	const isCustomLink =
		(!newKind && !isBuiltInType) || newKind === 'custom';
	const kind = isCustomLink ? 'custom' : newKind;
	const nextId =
		id && Number.isInteger(id) && !isCustomLink ? id : 0;

	setAttributes({
		...(newUrl && { url: encodeURI(safeDecodeURI(newUrl)) }),
		...(label && { label }),
		...(undefined !== opensInNewTab && { opensInNewTab }),
		id: nextId,
		...(kind && { kind }),
		...(type && type !== 'URL' && { type }),
		...(!newUrl && { url: '', id: 0, kind: '', type: '' }),
		...(isCustomLink && { id: 0, type: '' }),
	});
}
