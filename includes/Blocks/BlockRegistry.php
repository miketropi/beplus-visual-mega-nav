<?php
/**
 * Registers plugin blocks server-side.
 *
 * @package Beplus\VisualMegaNav\Blocks
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Blocks;

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
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/link-item' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/beplus-header' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/beplus-navigation' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/nav-menu-area' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/nav-toggle' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/tab-container' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/tab-panel' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/hero-artwork-dock' );
		register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/blog-list' );
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

		$slug = 'beplus-vmn';

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
					'title' => __( 'Mega Menu', 'beplus-visual-mega-nav' ),
					'icon'  => null,
				],
			]
		);
	}
}
