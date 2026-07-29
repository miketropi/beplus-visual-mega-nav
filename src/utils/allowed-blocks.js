/**
 * Blocks allowed inside the mega menu Content Builder.
 *
 * Defaults are mirrored in `includes/Core/AllowedBlocks.php`. At runtime the
 * server list is passed via `window.beplusVmn.allowedBlocks`.
 *
 * Third-party extensions:
 * - PHP: `beplus_vmn_allowed_blocks` filter (recommended).
 * - JS:  `beplus-vmn.allowedBlocks` filter via `@wordpress/hooks`.
 *
 * @package
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
	'beplus-visual-mega-nav/link-item',
	'beplus-visual-mega-nav/tab-container',
	'beplus-visual-mega-nav/tab-panel',

	// Media.
	'core/cover',

	// Embeds / widgets.
	'core/shortcode',
	'core/html',

	// Plugin blocks.
	'beplus-visual-mega-nav/beplus-header',
	'beplus-visual-mega-nav/beplus-navigation',
	'beplus-visual-mega-nav/nav-menu-area',
	'beplus-visual-mega-nav/nav-toggle',
	'beplus-visual-mega-nav/hero-artwork-dock',
	'beplus-visual-mega-nav/blog-list',
];

/**
 * Resolve the effective allowlist for the isolated editor.
 *
 * @return {string[]} Block names.
 */
export function getAllowedBlocks() {
	const fromPhp = window.beplusVmn?.allowedBlocks;
	const blocks =
		Array.isArray(fromPhp) && fromPhp.length
			? fromPhp
			: DEFAULT_ALLOWED_BLOCKS;

	return applyFilters('beplus-vmn.allowedBlocks', blocks);
}

/** @deprecated Use getAllowedBlocks() — kept for backwards compatibility. */
export const ALLOWED_BLOCKS = DEFAULT_ALLOWED_BLOCKS;
