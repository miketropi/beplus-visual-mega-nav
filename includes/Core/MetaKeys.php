<?php
/**
 * Post meta keys for mega menu data (with legacy fallbacks).
 *
 * @package Snap\MegaMenuBuilder\Core
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Core;

/**
 * Central registry for nav_menu_item meta keys.
 */
final class MetaKeys {

	public const ENABLED  = '_snap_megamenu_enabled';
	public const SETTINGS = '_snap_megamenu_settings';
	public const CONTENT  = '_snap_megamenu_content';

	private const LEGACY_ENABLED  = '_jemented_megamenu_enabled';
	private const LEGACY_SETTINGS = '_jemented_megamenu_settings';
	private const LEGACY_CONTENT  = '_jemented_megamenu_content';

	/**
	 * Read meta, falling back to pre-rename keys when empty.
	 *
	 * @param int    $item_id Menu item post ID.
	 * @param string $key     One of ENABLED, SETTINGS, or CONTENT.
	 * @return mixed
	 */
	public static function get( int $item_id, string $key ): mixed {
		$value = get_post_meta( $item_id, $key, true );

		if ( self::is_empty_meta( $value ) ) {
			$legacy = self::legacy_key( $key );
			if ( null !== $legacy ) {
				$value = get_post_meta( $item_id, $legacy, true );
			}
		}

		return $value;
	}

	/**
	 * @param int    $item_id Menu item post ID.
	 * @param string $key     Meta key constant.
	 * @param mixed  $value   Value to store.
	 * @return bool|int
	 */
	public static function update( int $item_id, string $key, mixed $value ): bool|int {
		return update_post_meta( $item_id, $key, $value );
	}

	/**
	 * @param mixed $value Meta value.
	 * @return bool
	 */
	private static function is_empty_meta( mixed $value ): bool {
		return '' === $value || ( is_array( $value ) && empty( $value ) );
	}

	/**
	 * @param string $key Current meta key.
	 * @return string|null
	 */
	private static function legacy_key( string $key ): ?string {
		return match ( $key ) {
			self::ENABLED  => self::LEGACY_ENABLED,
			self::SETTINGS => self::LEGACY_SETTINGS,
			self::CONTENT  => self::LEGACY_CONTENT,
			default        => null,
		};
	}
}
