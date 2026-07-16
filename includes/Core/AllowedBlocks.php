<?php
/**
 * Block allowlist for the mega menu Content Builder.
 *
 * @package Beplus\VisualMegaNav\Core
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Core;

/**
 * Curated block types for the isolated editor.
 */
final class AllowedBlocks {

	/**
	 * Default block names (single source of truth on the server).
	 *
	 * @return string[]
	 */
	public static function defaults(): array {
		return [
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

			// Third-party blocks.
			'nextora/box-icon',
			'nextora/box-image',
			'nextora/advanced-button',
			'nextora/advanced-button-button',

			// Plugin blocks.
			'beplus-visual-mega-nav/beplus-header',
			'beplus-visual-mega-nav/beplus-navigation',
			'beplus-visual-mega-nav/nav-menu-area',
			'beplus-visual-mega-nav/nav-toggle',
		];
	}

	/**
	 * Allowed block names after the {@see 'beplus_vmn_allowed_blocks'} filter.
	 *
	 * @return string[]
	 */
	public static function get(): array {
		$blocks = apply_filters( 'beplus_vmn_allowed_blocks', self::defaults() );

		if ( ! is_array( $blocks ) ) {
			return self::defaults();
		}

		$sanitized = [];

		foreach ( $blocks as $block ) {
			if ( is_string( $block ) && '' !== $block ) {
				$sanitized[] = $block;
			}
		}

		return array_values( array_unique( $sanitized ) );
	}
}
