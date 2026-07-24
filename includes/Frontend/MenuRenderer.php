<?php
/**
 * Frontend mega menu renderer.
 *
 * Replaces default sub-menus with mega menu panels for items
 * that have mega menu enabled.
 *
 * @package Beplus\VisualMegaNav\Frontend
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Frontend;

use Beplus\VisualMegaNav\Core\MetaKeys;
use Walker;

/**
 * Register frontend hooks for rendering mega menus.
 */
final class MenuRenderer {

	/**
	 * Cache: menu term ID => has mega items.
	 *
	 * @var array<int, bool>
	 */
	private array $menu_mega_cache = [];

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_filter( 'wp_nav_menu_args', [ $this, 'override_walker' ], 99 );
		add_filter( 'nextora_header_block_nav_menu_args', [ $this, 'override_walker' ], 99, 1 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );
		add_filter( 'nav_menu_css_class', [ $this, 'add_mega_menu_class' ], 10, 4 );
	}

	/**
	 * Wrap the menu walker so mega panels are injected without breaking theme markup.
	 *
	 * @param array<string, mixed> $args Menu arguments.
	 * @return array<string, mixed>
	 */
	public function override_walker( array $args ): array {
		return $this->maybe_wrap_walker( $args );
	}

	/**
	 * Wrap walker when this menu should render mega panels.
	 *
	 * @param array<string, mixed> $args Menu arguments.
	 * @return array<string, mixed>
	 */
	private function maybe_wrap_walker( array $args ): array {
		if ( isset( $args['walker'] ) && $args['walker'] instanceof MegaMenuWalkerDelegator ) {
			return $args;
		}

		if ( ! $this->should_apply_walker( $args ) ) {
			return $args;
		}

		$inner = $args['walker'] ?? null;

		if ( is_string( $inner ) && class_exists( $inner ) && is_subclass_of( $inner, \Walker::class ) ) {
			$inner = new $inner();
		}

		if ( ! $inner instanceof Walker ) {
			$inner = null;
		}

		$args['walker'] = new MegaMenuWalkerDelegator( $inner );

		return $args;
	}

	/**
	 * Decide whether mega menu walker wrapping should run for these menu args.
	 *
	 * @param array<string, mixed> $args Menu arguments.
	 * @return bool
	 */
	private function should_apply_walker( array $args ): bool {
		$filtered = apply_filters( 'beplus_vmn_apply_walker', null, $args );
		if ( null !== $filtered ) {
			return (bool) $filtered;
		}

		$locations = apply_filters( 'beplus_vmn_locations', [ 'primary', 'main-menu', 'header' ] );

		if (
			! empty( $args['theme_location'] )
			&& in_array( $args['theme_location'], $locations, true )
		) {
			return true;
		}

		$menu_id = $args['menu'] instanceof \WP_Term ? $args['menu']->term_id : (int) $args['menu'];

		if ( ! empty( $args['menu'] ) && $this->menu_has_mega_items( $menu_id ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Check whether a menu contains any mega menu items.
	 *
	 * @param int $menu_id Nav menu term ID.
	 * @return bool
	 */
	private function menu_has_mega_items( int $menu_id ): bool {
		if ( $menu_id <= 0 ) {
			return false;
		}

		if ( isset( $this->menu_mega_cache[ $menu_id ] ) ) {
			return $this->menu_mega_cache[ $menu_id ];
		}

		$items = wp_get_nav_menu_items( $menu_id );
		if ( ! is_array( $items ) ) {
			$this->menu_mega_cache[ $menu_id ] = false;
			return false;
		}

		foreach ( $items as $item ) {
			if ( ! $item instanceof \WP_Post ) {
				continue;
			}

			$enabled = (bool) MetaKeys::get( $item->ID, MetaKeys::ENABLED );
			$content = MetaKeys::get( $item->ID, MetaKeys::CONTENT );

			if ( $enabled && is_string( $content ) && '' !== $content ) {
				$this->menu_mega_cache[ $menu_id ] = true;
				return true;
			}
		}

		$this->menu_mega_cache[ $menu_id ] = false;
		return false;
	}

	/**
	 * Add CSS class to li elements that have mega menu enabled.
	 *
	 * @param string[]  $classes CSS classes.
	 * @param \WP_Post  $item    Menu item.
	 * @param \stdClass $args    Menu args.
	 * @param int       $depth   Depth.
	 * @return string[]
	 */
	public function add_mega_menu_class( array $classes, \WP_Post $item, \stdClass $args, int $depth ): array {
		if ( 0 === $depth ) {
			$enabled = (bool) MetaKeys::get( $item->ID, MetaKeys::ENABLED );
			if ( $enabled ) {
				$classes[] = 'has-mega-menu';
				// Allows theme mobile nav toggles / accordion styling (e.g. Nextora).
				$classes[] = 'menu-item-has-children';
			}
		}

		return $classes;
	}

	/**
	 * Enqueue minimal frontend CSS/JS.
	 *
	 * @return void
	 */
	public function enqueue_frontend_assets(): void {
		// Inline style handle for snap-header block per-instance CSS.
		wp_register_style( 'beplus-vmn-header-inline', false, [], BEPLUS_VISUAL_MEGA_NAV_VERSION );
		wp_enqueue_style( 'beplus-vmn-header-inline' );
		wp_style_add_data( 'beplus-vmn-header-inline', 'group', 1 );

		wp_enqueue_style(
			'beplus-vmn-front',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'assets/css/frontend.css',
			[],
			BEPLUS_VISUAL_MEGA_NAV_VERSION
		);

		wp_enqueue_style(
			'beplus-vmn-header',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'blocks/beplus-header/style.css',
			[],
			BEPLUS_VISUAL_MEGA_NAV_VERSION
		);

		wp_enqueue_style(
			'beplus-vmn-navigation',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'blocks/beplus-navigation/style.css',
			[],
			BEPLUS_VISUAL_MEGA_NAV_VERSION
		);

		wp_enqueue_style(
			'beplus-vmn-nav-toggle',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'blocks/nav-toggle/style.css',
			[],
			BEPLUS_VISUAL_MEGA_NAV_VERSION
		);

		wp_enqueue_style(
			'beplus-vmn-nav-menu-area',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'blocks/nav-menu-area/style.css',
			[],
			BEPLUS_VISUAL_MEGA_NAV_VERSION
		);

		wp_enqueue_style(
			'beplus-vmn-tab-container',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'blocks/tab-container/style.css',
			[],
			BEPLUS_VISUAL_MEGA_NAV_VERSION
		);

		wp_enqueue_script(
			'beplus-vmn-front',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'assets/js/frontend.js',
			[],
			(string) filemtime( BEPLUS_VISUAL_MEGA_NAV_DIR . 'assets/js/frontend.js' ),
			true
		);

		$tabs_ver = (string) filemtime( BEPLUS_VISUAL_MEGA_NAV_DIR . 'assets/js/tabs.js' );

		wp_enqueue_script(
			'beplus-vmn-tabs',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'assets/js/tabs.js',
			[],
			$tabs_ver,
			true
		);
	}
}
