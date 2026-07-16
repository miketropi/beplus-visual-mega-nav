<?php
/**
 * Admin: Nav Menu page integration.
 *
 * Enqueues Gutenberg block-editor assets on the nav-menus.php screen
 * and prints the mount-point container for the React app.
 *
 * @package Beplus\VisualMegaNav\Admin
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Admin;

use Beplus\VisualMegaNav\Core\AllowedBlocks;

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
		add_action( 'enqueue_block_assets', [ $this, 'enqueue_block_editor_styles' ] );
	}

	/**
	 * Hide mega menu panel class inside block editor iframes
	 * so frontend panel styles don't leak into the editing canvas.
	 *
	 * @return void
	 */
	public function enqueue_block_editor_styles(): void {
		wp_register_style( 'beplus-vmn-block-editor', false, [], BEPLUS_VISUAL_MEGA_NAV_VERSION );
		wp_enqueue_style( 'beplus-vmn-block-editor' );
		wp_add_inline_style(
			'beplus-vmn-block-editor',
			'.block-editor-iframe__html .beplus-vmn-mega-panel { display: none; }'
		);
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

		$asset_file = BEPLUS_VISUAL_MEGA_NAV_DIR . 'build/index.asset.php';

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
			'beplus-vmn-admin',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'build/index.js',
			$script_dependencies,
			$asset['version'],
			true
		);

		// Plugin styles — depend on core admin / component tokens.
		$this->enqueue_plugin_build_styles( $asset['version'] );

		// Localized data for JS (scalars only — editorSettings is injected separately).
		wp_localize_script(
			'beplus-vmn-admin',
			'beplusVmn',
			[
				'restBase'      => esc_url_raw( rest_url( 'beplus-visual-mega-nav/v1' ) ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'version'       => BEPLUS_VISUAL_MEGA_NAV_VERSION,
				'allowedBlocks' => AllowedBlocks::get(),
			]
		);

		$this->enqueue_third_party_block_editor_assets();

		wp_add_inline_script(
			'beplus-vmn-admin',
			'window.beplusVmn = window.beplusVmn || {}; window.beplusVmn.editorSettings = ' . wp_json_encode(
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
			require_once ABSPATH . WPINC . '/block-editor.php';
		}

		$block_editor_context = new \WP_Block_Editor_Context(
			[
				'name' => 'beplus-visual-mega-nav/editor',
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
		if ( ! file_exists( BEPLUS_VISUAL_MEGA_NAV_DIR . 'build/index.css' ) ) {
			return;
		}

		wp_register_style( 'beplus-vmn-base-styles', false, [], BEPLUS_VISUAL_MEGA_NAV_VERSION );
		wp_enqueue_style( 'beplus-vmn-base-styles' );

		wp_enqueue_style(
			'beplus-vmn-admin',
			BEPLUS_VISUAL_MEGA_NAV_URL . 'build/index.css',
			[ 'beplus-vmn-base-styles', 'wp-components', 'wp-block-editor', 'wp-edit-blocks' ],
			$version
		);

		// Frontend block styles (e.g. link-item style.css) — webpack entry style-index.css.
		if ( file_exists( BEPLUS_VISUAL_MEGA_NAV_DIR . 'build/style-index.css' ) ) {
			wp_enqueue_style(
				'beplus-vmn-blocks',
				BEPLUS_VISUAL_MEGA_NAV_URL . 'build/style-index.css',
				[ 'beplus-vmn-admin', 'wp-edit-blocks' ],
				$version
			);
		}
	}

	/**
	 * Enqueue editor scripts and styles for third-party blocks
	 * allowed in the mega menu Content Builder.
	 *
	 * Core blocks are bundled in wp-block-library; plugin-owned
	 * blocks are imported in src/index.js. This method covers
	 * blocks from themes or other plugins.
	 *
	 * @return void
	 */
	private function enqueue_third_party_block_editor_assets(): void {
		$blocks   = AllowedBlocks::get();
		$registry = \WP_Block_Type_Registry::get_instance();

		foreach ( $blocks as $block_name ) {
			if ( str_starts_with( $block_name, 'core/' ) ) {
				continue;
			}
			if ( str_starts_with( $block_name, 'beplus-visual-mega-nav/' ) ) {
				continue;
			}

			$block_type = $registry->get_registered( $block_name );
			if ( ! $block_type instanceof \WP_Block_Type ) {
				continue;
			}

			foreach ( $block_type->editor_script_handles as $handle ) {
				wp_enqueue_script( $handle );
			}

			foreach ( $block_type->editor_style_handles as $handle ) {
				wp_enqueue_style( $handle );
			}
		}

		// Allow blocks to inject inline scripts (e.g. icon catalogs).
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		do_action( 'enqueue_block_editor_assets' );
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

		echo '<div id="beplus-vmn-root"></div>';
	}
}
