<?php
/**
 * Plugin bootstrap.
 *
 * @package Snap\MegaMenuBuilder\Core
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Core;

use Snap\MegaMenuBuilder\Admin\NavMenuPage;
use Snap\MegaMenuBuilder\Blocks\BlockRegistry;
use Snap\MegaMenuBuilder\Core\BlockContentSanitizer;
use Snap\MegaMenuBuilder\Frontend\MenuRenderer;
use Snap\MegaMenuBuilder\Patterns\PatternRegistry;
use Snap\MegaMenuBuilder\Rest\MegaMenuController;
use Snap\MegaMenuBuilder\Rest\TemplatesController;

/**
 * Bootstrap the plugin — register hooks, REST routes, assets.
 */
final class Bootstrap {

	/**
	 * Run the plugin.
	 *
	 * @return void
	 */
	public function run(): void {
		( new BlockRegistry() )->register();
		( new PatternRegistry() )->register();

		$this->register_meta();

		// Admin.
		if ( is_admin() ) {
			( new NavMenuPage() )->register();
		}

		// REST API.
		add_action( 'rest_api_init', static function (): void {
			( new MegaMenuController() )->register_routes();
			( new TemplatesController() )->register_routes();
		} );

		// Frontend rendering.
		if ( ! is_admin() ) {
			( new MenuRenderer() )->register();
		}

		// Ensure menus are enabled even if the theme doesn't declare support.
		add_action( 'after_setup_theme', static function (): void {
			add_theme_support( 'menus' );
		} );

		// Load text domain.
		add_action( 'init', [ $this, 'load_textdomain' ] );
	}

	/**
	 * Register nav_menu_item meta fields.
	 *
	 * @return void
	 */
	private function register_meta(): void {
		add_action( 'init', static function (): void {
			$meta_fields = [
				MetaKeys::ENABLED  => [
					'type'    => 'boolean',
					'default' => false,
				],
				MetaKeys::SETTINGS => [
					'type'    => 'string',
					'default' => '{}',
				],
				MetaKeys::CONTENT  => [
					'type'    => 'string',
					'default' => '',
				],
			];

			foreach ( $meta_fields as $key => $config ) {
				$sanitize_callback = match ( $key ) {
					MetaKeys::ENABLED  => 'rest_sanitize_boolean',
					MetaKeys::SETTINGS => [ BlockContentSanitizer::class, 'sanitize_settings' ],
					MetaKeys::CONTENT  => [ BlockContentSanitizer::class, 'sanitize' ],
					default            => 'sanitize_text_field',
				};

				register_meta(
					'post',
					$key,
					[
						'object_subtype'    => 'nav_menu_item',
						'type'              => $config['type'],
						'single'            => true,
						'default'           => $config['default'],
						'show_in_rest'      => true,
						'auth_callback'     => static fn(): bool => current_user_can( 'edit_theme_options' ),
						'sanitize_callback' => $sanitize_callback,
					]
				);
			}
		} );
	}

	/**
	 * Load plugin text domain.
	 *
	 * @return void
	 */
	public function load_textdomain(): void {
		load_plugin_textdomain(
			'snap-megamenu-builder',
			false,
			dirname( SNAP_MEGAMENU_BASENAME ) . '/languages'
		);
	}
}
