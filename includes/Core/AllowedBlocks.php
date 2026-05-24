<?php
/**
 * Block allowlist for the mega menu Content Builder.
 *
 * @package Snap\MegaMenuBuilder\Core
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Core;

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
			'snap-megamenu/link-item',

			// Media.
			'core/cover',

			// Embeds / widgets.
			'core/shortcode',
			'core/html',
		];
	}

	/**
	 * Allowed block names after the {@see 'snap_megamenu_allowed_blocks'} filter.
	 *
	 * @return string[]
	 */
	public static function get(): array {
		$blocks = apply_filters( 'snap_megamenu_allowed_blocks', self::defaults() );

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
