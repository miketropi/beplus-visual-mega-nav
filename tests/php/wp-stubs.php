<?php
/**
 * Minimal WordPress surface for the unit tests.
 *
 * The plugin's PHP units only exercise the panel eligibility predicate, the item
 * class filter and the walker delegator: a handful of core functions plus the two
 * walker base classes. Loading the full WordPress test library for that is not
 * always possible, so the symbols the tests touch are declared here.
 *
 * Every declaration is guarded: a run that *does* load the WordPress test suite
 * keeps the real implementation, and this file then declares nothing.
 *
 * @package Beplus\VisualMegaNav\Tests
 */

declare(strict_types=1);

/*
 * The WordPress symbols live in the global namespace: the plugin calls
 * `get_post_meta()`, `WP_Post` and `Walker_Nav_Menu` unqualified from its own
 * namespaces, so a namespaced stub would never be found.
 */
namespace {

	if ( ! class_exists( 'WP_Post' ) ) {
		/**
		 * Post row.
		 *
		 * Mirrors the core class, including the dynamic properties navigation
		 * decorates it with (`title`, `menu_item_parent`, …).
		 */
		#[\AllowDynamicProperties]
		class WP_Post {

			/**
			 * Post id.
			 *
			 * @var int
			 */
			public int $ID = 0;

			/**
			 * Nav menu item label.
			 *
			 * @var string
			 */
			public string $title = '';

			/**
			 * Nav menu item URL.
			 *
			 * @var string
			 */
			public string $url = '';

			/**
			 * Nav menu item parent id.
			 *
			 * @var string
			 */
			public string $menu_item_parent = '0';

			/**
			 * Nav menu item classes.
			 *
			 * @var string[]
			 */
			public array $classes = array();

			/**
			 * Constructor.
			 *
			 * @param object|array<string, mixed>|null $post Row properties.
			 */
			public function __construct( object|array|null $post = null ) {
				if ( null === $post ) {
					return;
				}

				foreach ( (array) $post as $key => $value ) {
					$this->$key = $value;
				}
			}
		}
	}

	if ( ! class_exists( 'Walker' ) ) {
		/**
		 * Walker base class.
		 */
		abstract class Walker {
		}
	}

	if ( ! class_exists( 'Walker_Nav_Menu' ) ) {
		/**
		 * Nav menu walker base class.
		 *
		 * The plugin always calls into an inner walker, so these bodies stay empty:
		 * they exist so `MegaMenuWalkerDelegator extends Walker_Nav_Menu` can be
		 * declared and so an override can be checked for signature compatibility.
		 */
		class Walker_Nav_Menu extends Walker {

			/**
			 * Start a sub-menu level.
			 *
			 * @param string $output Passed by reference.
			 * @param int    $depth  Depth of the menu item.
			 * @param mixed  $args   Menu arguments.
			 * @return void
			 */
			public function start_lvl( &$output, $depth = 0, $args = null ) {}

			/**
			 * End a sub-menu level.
			 *
			 * @param string $output Passed by reference.
			 * @param int    $depth  Depth of the menu item.
			 * @param mixed  $args   Menu arguments.
			 * @return void
			 */
			public function end_lvl( &$output, $depth = 0, $args = null ) {}

			/**
			 * Start a menu item.
			 *
			 * @param string $output            Passed by reference.
			 * @param mixed  $data_object       Menu item data object.
			 * @param int    $depth             Depth of the menu item.
			 * @param mixed  $args              Menu arguments.
			 * @param int    $current_object_id Current item id.
			 * @return void
			 */
			public function start_el( &$output, $data_object, $depth = 0, $args = null, $current_object_id = 0 ) {}

			/**
			 * End a menu item.
			 *
			 * @param string $output      Passed by reference.
			 * @param mixed  $data_object Menu item data object.
			 * @param int    $depth       Depth of the menu item.
			 * @param mixed  $args        Menu arguments.
			 * @return void
			 */
			public function end_el( &$output, $data_object, $depth = 0, $args = null ) {}
		}
	}

	if ( ! function_exists( 'get_post_meta' ) ) {
		/**
		 * Read a post meta value.
		 *
		 * @param int    $post_id Post id.
		 * @param string $key     Meta key.
		 * @param bool   $single  Whether to return a single value.
		 * @return mixed
		 */
		function get_post_meta( $post_id, $key = '', $single = false ) {
			return \Beplus\VisualMegaNav\Tests\WpStubs::get_meta( (int) $post_id, (string) $key );
		}
	}

	if ( ! function_exists( 'update_post_meta' ) ) {
		/**
		 * Write a post meta value.
		 *
		 * @param int    $post_id Post id.
		 * @param string $key     Meta key.
		 * @param mixed  $value   Meta value.
		 * @return int
		 */
		function update_post_meta( $post_id, $key, $value ) {
			return \Beplus\VisualMegaNav\Tests\WpStubs::set_meta( (int) $post_id, (string) $key, $value );
		}
	}

	if ( ! function_exists( 'wp_insert_post' ) ) {
		/**
		 * Allocate a post id.
		 *
		 * @param array<string, mixed> $postarr Post fields.
		 * @return int
		 */
		function wp_insert_post( $postarr = array() ) {
			return \Beplus\VisualMegaNav\Tests\WpStubs::insert_post();
		}
	}

	if ( ! function_exists( 'wp_json_encode' ) ) {
		/**
		 * Encode a value as JSON.
		 *
		 * @param mixed $value Value.
		 * @param int   $flags Encoding flags.
		 * @return string|false
		 */
		function wp_json_encode( $value, $flags = 0 ) {
			return json_encode( $value, $flags );
		}
	}

	if ( ! function_exists( 'apply_filters' ) ) {
		/**
		 * Run filters.
		 *
		 * The units under test only assert the unfiltered contract, so no callback
		 * registry is kept: the value passes through unchanged.
		 *
		 * @param string $hook_name Filter name.
		 * @param mixed  $value     Value to filter.
		 * @param mixed  ...$args   Extra arguments.
		 * @return mixed
		 */
		function apply_filters( $hook_name, $value, ...$args ) {
			return $value;
		}
	}

	if ( ! function_exists( 'add_filter' ) ) {
		/**
		 * Register a filter.
		 *
		 * @param string   $hook_name     Filter name.
		 * @param callable $callback      Callback.
		 * @param int      $priority      Priority.
		 * @param int      $accepted_args Accepted argument count.
		 * @return bool
		 */
		function add_filter( $hook_name, $callback, $priority = 10, $accepted_args = 1 ) {
			return true;
		}
	}

	if ( ! function_exists( 'add_action' ) ) {
		/**
		 * Register an action.
		 *
		 * @param string   $hook_name     Action name.
		 * @param callable $callback      Callback.
		 * @param int      $priority      Priority.
		 * @param int      $accepted_args Accepted argument count.
		 * @return bool
		 */
		function add_action( $hook_name, $callback, $priority = 10, $accepted_args = 1 ) {
			return true;
		}
	}

	if ( ! function_exists( 'sanitize_html_class' ) ) {
		/**
		 * Sanitize an HTML class name.
		 *
		 * @param string $class_name Class name.
		 * @param string $fallback   Fallback.
		 * @return string
		 */
		function sanitize_html_class( $class_name, $fallback = '' ) {
			$sanitized = preg_replace( '/[^A-Za-z0-9_-]/', '', (string) $class_name );

			return '' === $sanitized ? $fallback : $sanitized;
		}
	}

	if ( ! function_exists( 'sanitize_key' ) ) {
		/**
		 * Sanitize a key.
		 *
		 * @param string $key Key.
		 * @return string
		 */
		function sanitize_key( $key ) {
			return strtolower( preg_replace( '/[^a-z0-9_\-]/i', '', (string) $key ) );
		}
	}

	if ( ! function_exists( 'esc_attr' ) ) {
		/**
		 * Escape an attribute value.
		 *
		 * @param string $text Text.
		 * @return string
		 */
		function esc_attr( $text ) {
			return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
		}
	}

	if ( ! function_exists( 'esc_html' ) ) {
		/**
		 * Escape HTML text.
		 *
		 * @param string $text Text.
		 * @return string
		 */
		function esc_html( $text ) {
			return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' );
		}
	}

	if ( ! function_exists( '__' ) ) {
		/**
		 * Translate a string.
		 *
		 * @param string $text   Text.
		 * @param string $domain Text domain.
		 * @return string
		 */
		function __( $text, $domain = 'default' ) {
			return (string) $text;
		}
	}

}
