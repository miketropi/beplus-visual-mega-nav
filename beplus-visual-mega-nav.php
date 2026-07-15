<?php
/**
 * Plugin Name:       Beplus Visual Mega Navigation
 * Plugin URI:        https://github.com/miketropi/beplus-visual-mega-nav
 * Description:       A Gutenberg-powered visual mega navigation builder for WordPress. Build rich mega menus visually using the block editor.
 * Version:           0.0.9
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Beplusthemes
 * Author URI:        https://beplusthemes.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       beplus-visual-mega-nav
 * Domain Path:       /languages
 *
 * @package Beplus\VisualMegaNav
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav;

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin constants.
define( 'BEPLUS_VISUAL_MEGA_NAV_VERSION', '0.0.9' );
define( 'BEPLUS_VISUAL_MEGA_NAV_FILE', __FILE__ );
define( 'BEPLUS_VISUAL_MEGA_NAV_DIR', plugin_dir_path( __FILE__ ) );
define( 'BEPLUS_VISUAL_MEGA_NAV_URL', plugin_dir_url( __FILE__ ) );
define( 'BEPLUS_VISUAL_MEGA_NAV_BASENAME', plugin_basename( __FILE__ ) );

// Autoloader.
if ( file_exists( BEPLUS_VISUAL_MEGA_NAV_DIR . 'vendor/autoload.php' ) ) {
	require_once BEPLUS_VISUAL_MEGA_NAV_DIR . 'vendor/autoload.php';
}

// Bootstrap the plugin.
require_once BEPLUS_VISUAL_MEGA_NAV_DIR . 'includes/Core/Bootstrap.php';

/**
 * Initialize the plugin.
 *
 * @return void
 */
function beplus_vmn_init(): void {
	$bootstrap = new Core\Bootstrap();
	$bootstrap->run();
}

add_action( 'plugins_loaded', __NAMESPACE__ . '\\beplus_vmn_init' );

/**
 * Activation hook.
 *
 * @return void
 */
function beplus_vmn_activate(): void {
	flush_rewrite_rules();
}

register_activation_hook( __FILE__, __NAMESPACE__ . '\\beplus_vmn_activate' );

/**
 * Deactivation hook.
 *
 * @return void
 */
function beplus_vmn_deactivate(): void {
	flush_rewrite_rules();
}

register_deactivation_hook( __FILE__, __NAMESPACE__ . '\\beplus_vmn_deactivate' );
