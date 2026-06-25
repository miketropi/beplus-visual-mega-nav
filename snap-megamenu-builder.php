<?php
/**
 * Plugin Name:       Snap Mega Menu Builder
 * Plugin URI:        https://github.com/snapwp/snap-megamenu-builder
 * Description:       A Gutenberg-powered mega menu builder for WordPress. Build rich mega menus visually using the block editor.
 * Version:           0.0.5
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Beplusthemes
 * Author URI:        https://beplusthemes.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       snap-megamenu-builder
 * Domain Path:       /languages
 *
 * @package Snap\MegaMenuBuilder
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder;

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin constants.
define( 'SNAP_MEGAMENU_VERSION', '0.0.5' );
define( 'SNAP_MEGAMENU_FILE', __FILE__ );
define( 'SNAP_MEGAMENU_DIR', plugin_dir_path( __FILE__ ) );
define( 'SNAP_MEGAMENU_URL', plugin_dir_url( __FILE__ ) );
define( 'SNAP_MEGAMENU_BASENAME', plugin_basename( __FILE__ ) );

// Autoloader.
if ( file_exists( SNAP_MEGAMENU_DIR . 'vendor/autoload.php' ) ) {
	require_once SNAP_MEGAMENU_DIR . 'vendor/autoload.php';
}

// Bootstrap the plugin.
require_once SNAP_MEGAMENU_DIR . 'includes/Core/Bootstrap.php';

/**
 * Initialize the plugin.
 *
 * @return void
 */
function snap_megamenu_builder_init(): void {
	$bootstrap = new Core\Bootstrap();
	$bootstrap->run();
}

add_action( 'plugins_loaded', __NAMESPACE__ . '\\snap_megamenu_builder_init' );

/**
 * Activation hook.
 *
 * @return void
 */
function snap_megamenu_builder_activate(): void {
	flush_rewrite_rules();
}

register_activation_hook( __FILE__, __NAMESPACE__ . '\\snap_megamenu_builder_activate' );

/**
 * Deactivation hook.
 *
 * @return void
 */
function snap_megamenu_builder_deactivate(): void {
	flush_rewrite_rules();
}

register_deactivation_hook( __FILE__, __NAMESPACE__ . '\\snap_megamenu_builder_deactivate' );
