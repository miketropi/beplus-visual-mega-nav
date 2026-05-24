<?php
/**
 * Admin: Nav Menu page integration.
 *
 * Enqueues Gutenberg block-editor assets on the nav-menus.php screen
 * and prints the mount-point container for the React app.
 *
 * @package Snap\MegaMenuBuilder\Admin
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Admin;

use Snap\MegaMenuBuilder\Core\AllowedBlocks;

/**
 * Hooks into the Appearance → Menus page.
 */
final class NavMenuPage {

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'admin_footer', [ $this, 'render_mount_point' ] );
	}

	/**
	 * Enqueue scripts & styles only on nav-menus.php.
	 *
	 * @param string $hook_suffix The current admin page hook.
	 * @return void
	 */
	public function enqueue_assets( string $hook_suffix ): void {
		if ( 'nav-menus.php' !== $hook_suffix ) {
			return;
		}

		// Ensure media modal is available (for image blocks).
		wp_enqueue_media();

		$asset_file = SNAP_MEGAMENU_DIR . 'build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		// Block editor styles.
		wp_enqueue_style( 'wp-edit-blocks' );
		wp_enqueue_style( 'wp-components' );
		wp_enqueue_style( 'wp-block-editor' );
		wp_enqueue_style( 'wp-block-library' );

		// Rich text formats (bold, italic, link, …) for Paragraph toolbar controls.
		if ( function_exists( 'wp_enqueue_editor_format_library_assets' ) ) {
			wp_enqueue_editor_format_library_assets();
		}

		$script_dependencies = array_unique(
			array_merge(
				$asset['dependencies'],
				[ 'wp-format-library' ]
			)
		);

		// Plugin script.
		wp_enqueue_script(
			'snap-megamenu-admin',
			SNAP_MEGAMENU_URL . 'build/index.js',
			$script_dependencies,
			$asset['version'],
			true
		);

		// Plugin styles — depend on core admin / component tokens.
		$this->enqueue_plugin_build_styles( $asset['version'] );

		// Localized data for JS (scalars only — editorSettings is injected separately).
		wp_localize_script(
			'snap-megamenu-admin',
			'snapMegaMenu',
			[
				'restBase'      => esc_url_raw( rest_url( 'snap-megamenu/v1' ) ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'version'       => SNAP_MEGAMENU_VERSION,
				'allowedBlocks' => AllowedBlocks::get(),
			]
		);

		wp_add_inline_script(
			'snap-megamenu-admin',
			'window.snapMegaMenu = window.snapMegaMenu || {}; window.snapMegaMenu.editorSettings = ' . wp_json_encode(
				$this->get_block_editor_settings(),
				JSON_HEX_TAG | JSON_UNESCAPED_SLASHES
			) . ';',
			'before'
		);
	}

	/**
	 * Block editor settings for the isolated Content Builder.
	 *
	 * Includes theme.json features (spacing blockGap, presets, etc.)
	 * so layout blocks like Columns expose gap controls in the inspector.
	 *
	 * @return array<string, mixed>
	 */
	private function get_block_editor_settings(): array {
		if ( ! function_exists( 'get_block_editor_settings' ) ) {
			require ABSPATH . WPINC . '/block-editor.php';
		}

		$block_editor_context = new \WP_Block_Editor_Context(
			[
				'name' => 'snap-megamenu/editor',
			]
		);

		return $this->normalize_editor_settings(
			get_block_editor_settings( [], $block_editor_context )
		);
	}

	/**
	 * Ensure spacing/layout flags work in the isolated editor.
	 *
	 * Theme.json uses `null` to mean a spacing feature is enabled, but layout
	 * block-gap CSS only renders when blockGap is strictly not null.
	 *
	 * @param array<string, mixed> $settings Block editor settings.
	 * @return array<string, mixed>
	 */
	private function normalize_editor_settings( array $settings ): array {
		$settings['disableLayoutStyles'] = false;

		if ( ! isset( $settings['__experimentalFeatures']['spacing'] ) ) {
			$settings['__experimentalFeatures']['spacing'] = [];
		}

		foreach ( [ 'blockGap', 'padding', 'margin' ] as $feature ) {
			if ( ! array_key_exists( $feature, $settings['__experimentalFeatures']['spacing'] )
				|| null === $settings['__experimentalFeatures']['spacing'][ $feature ] ) {
				$settings['__experimentalFeatures']['spacing'][ $feature ] = true;
			}
		}

		return $settings;
	}

	/**
	 * Enqueue webpack build CSS for the Content Builder.
	 *
	 * @param string $version Script/style version from index.asset.php.
	 * @return void
	 */
	private function enqueue_plugin_build_styles( string $version ): void {
		if ( ! file_exists( SNAP_MEGAMENU_DIR . 'build/index.css' ) ) {
			return;
		}

		wp_enqueue_style( 'wp-base-styles' );

		wp_enqueue_style(
			'snap-megamenu-admin',
			SNAP_MEGAMENU_URL . 'build/index.css',
			[ 'wp-base-styles', 'wp-components', 'wp-block-editor', 'wp-edit-blocks' ],
			$version
		);

		// Frontend block styles (e.g. link-item style.css) — webpack entry style-index.css.
		if ( file_exists( SNAP_MEGAMENU_DIR . 'build/style-index.css' ) ) {
			wp_enqueue_style(
				'snap-megamenu-blocks',
				SNAP_MEGAMENU_URL . 'build/style-index.css',
				[ 'snap-megamenu-admin', 'wp-edit-blocks' ],
				$version
			);
		}
	}

	/**
	 * Print the React mount-point div in the admin footer.
	 *
	 * @return void
	 */
	public function render_mount_point(): void {
		$screen = get_current_screen();

		if ( ! $screen || 'nav-menus' !== $screen->id ) {
			return;
		}

		echo '<div id="snap-megamenu-root"></div>';
	}
}
