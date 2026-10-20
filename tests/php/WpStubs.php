<?php
/**
 * State the stubbed WordPress functions read and write.
 *
 * Kept in the test namespace on purpose: `wp-stubs.php` has to stay in the global
 * namespace so the WordPress symbols it declares are found by unqualified calls
 * from the plugin's own namespaces.
 *
 * @package Beplus\VisualMegaNav\Tests
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Tests;

final class WpStubs {

	/**
	 * Post meta, keyed by post id then meta key.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static array $meta = array();

	/**
	 * Ids handed out by `wp_insert_post()`.
	 *
	 * @var int
	 */
	private static int $next_post_id = 1000;

	/**
	 * Forget everything a previous test stored.
	 *
	 * @return void
	 */
	public static function reset(): void {
		self::$meta         = array();
		self::$next_post_id = 1000;
	}

	/**
	 * Read one post meta value.
	 *
	 * @param int    $post_id Post id.
	 * @param string $key     Meta key.
	 * @return mixed
	 */
	public static function get_meta( int $post_id, string $key ): mixed {
		return self::$meta[ $post_id ][ $key ] ?? '';
	}

	/**
	 * Write one post meta value.
	 *
	 * @param int    $post_id Post id.
	 * @param string $key     Meta key.
	 * @param mixed  $value   Meta value.
	 * @return int Always 1, as `update_post_meta()` returns for a new key.
	 */
	public static function set_meta( int $post_id, string $key, mixed $value ): int {
		self::$meta[ $post_id ][ $key ] = $value;

		return 1;
	}

	/**
	 * Allocate the next post id.
	 *
	 * @return int Post id.
	 */
	public static function insert_post(): int {
		++self::$next_post_id;

		return self::$next_post_id;
	}
}
