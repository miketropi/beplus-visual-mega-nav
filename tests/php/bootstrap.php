<?php
/**
 * PHPUnit bootstrap.
 *
 * Loads WordPress test suite. Adjust the path to your local
 * wordpress-tests-lib installation.
 *
 * @package Snap\MegaMenuBuilder\Tests
 */

declare(strict_types=1);

// Load Composer autoloader.
require_once dirname( __DIR__, 2 ) . '/vendor/autoload.php';

// Point to your WP test suite bootstrap.
// See: https://make.wordpress.org/core/handbook/testing/automated-testing/phpunit/
$snap_megamenu_tests_dir = getenv( 'WP_TESTS_DIR' ) ?: '/tmp/wordpress-tests-lib';

if ( file_exists( $snap_megamenu_tests_dir . '/includes/functions.php' ) ) {
	require_once $snap_megamenu_tests_dir . '/includes/functions.php';

	tests_add_filter( 'muplugins_loaded', static function (): void {
		require dirname( __DIR__, 2 ) . '/snap-megamenu-builder.php';
	} );

	require $snap_megamenu_tests_dir . '/includes/bootstrap.php';
}
