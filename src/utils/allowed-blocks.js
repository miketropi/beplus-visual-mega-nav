/**
 * Blocks allowed inside the mega menu editor.
 *
 * Keep this curated — only blocks that make sense in a navigation
 * mega-menu context. Themes/plugins can extend via filter on the PHP
 * side and by importing + modifying this array.
 *
 * @package Snap\MegaMenu
 */

export const ALLOWED_BLOCKS = [
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
	'core/navigation-link',
	'core/page-list',

	// Media.
	'core/cover',

	// Embeds / Widgets.
	'core/shortcode',
	'core/html',
];
