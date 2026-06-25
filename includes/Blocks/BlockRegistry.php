<?php
/**
 * Registers plugin blocks server-side.
 *
 * @package Snap\MegaMenuBuilder\Blocks
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Blocks;

/**
 * Block type registration on init.
 */
final class BlockRegistry {

	/**
	 * Hook block registration.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'init', [ $this, 'register_blocks' ] );
		add_filter( 'block_categories_all', [ $this, 'register_block_category' ], 10, 2 );
	}

	/**
	 * Register dynamic block types from block.json metadata.
	 *
	 * @return void
	 */
	public function register_blocks(): void {
		register_block_type( SNAP_MEGAMENU_DIR . 'blocks/link-item' );
		register_block_type( SNAP_MEGAMENU_DIR . 'blocks/snap-header' );
		register_block_type( SNAP_MEGAMENU_DIR . 'blocks/snap-navigation' );
		register_block_type( SNAP_MEGAMENU_DIR . 'blocks/nav-menu-area' );
		register_block_type( SNAP_MEGAMENU_DIR . 'blocks/nav-toggle' );
	}

	/**
	 * Add inserter category for plugin blocks.
	 *
	 * @param array<int, array<string, string>> $categories     Block categories.
	 * @param \WP_Block_Editor_Context          $editor_context Editor context.
	 * @return array<int, array<string, string|null>>
	 */
	public function register_block_category( array $categories, \WP_Block_Editor_Context $editor_context ): array {
		unset( $editor_context );

		$slug = 'snap-megamenu';

		foreach ( $categories as $category ) {
			if ( isset( $category['slug'] ) && $slug === $category['slug'] ) {
				return $categories;
			}
		}

		return array_merge(
			$categories,
			[
				[
					'slug'  => $slug,
					'title' => __( 'Mega Menu', 'snap-megamenu-builder' ),
					'icon'  => null,
				],
			]
		);
	}
}
