/**
 * Blocks allowed inside the mega menu Content Builder.
 *
 * Defaults are mirrored in `includes/Core/AllowedBlocks.php`. At runtime the
 * server list is passed via `window.snapMegaMenu.allowedBlocks`.
 *
 * Third-party extensions:
 * - PHP: `snap_megamenu_allowed_blocks` filter (recommended).
 * - JS:  `snap-megamenu.allowedBlocks` filter via `@wordpress/hooks`.
 *
 * @package Snap\MegaMenu
 */

import { applyFilters } from '@wordpress/hooks';

/**
 * Default allowlist (fallback when PHP data is unavailable, e.g. during tests).
 *
 * @type {string[]}
 */
export const DEFAULT_ALLOWED_BLOCKS = [
	// Layout.
	'core/columns',
	'core/column',
	'core/group',
	'core/row',
	'core/stack',

	// Content.
	'core/heading',
	'core/paragraph',
	'core/list',
	'core/list-item',
	'core/image',
	'core/buttons',
	'core/button',
	'core/separator',
	'core/spacer',

	// Navigation.
	'core/page-list',

	// Media.
	'core/cover',

	// Embeds / widgets.
	'core/shortcode',
	'core/html',
];

/**
 * Resolve the effective allowlist for the isolated editor.
 *
 * @return {string[]} Block names.
 */
export function getAllowedBlocks() {
	const fromPhp = window.snapMegaMenu?.allowedBlocks;
	const blocks =
		Array.isArray( fromPhp ) && fromPhp.length
			? fromPhp
			: DEFAULT_ALLOWED_BLOCKS;

	return applyFilters( 'snap-megamenu.allowedBlocks', blocks );
}

/** @deprecated Use getAllowedBlocks() — kept for backwards compatibility. */
export const ALLOWED_BLOCKS = DEFAULT_ALLOWED_BLOCKS;
