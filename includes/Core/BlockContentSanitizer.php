<?php
/**
 * Sanitize Gutenberg block markup for storage.
 *
 * The wp_kses_post() and sanitize_text_field() functions both destroy
 * block delimiter comments, which breaks parse() on reload.
 *
 * @package Beplus\VisualMegaNav\Core
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Core;

/**
 * Block-content-aware sanitization for nav_menu_item meta.
 */
final class BlockContentSanitizer {

	/**
	 * Sanitize serialized block HTML while preserving Gutenberg comments.
	 *
	 * `filter_block_content` / `wp_kses_post` both encode `&` inside
	 * block-comment JSON (e.g. to \u0026), corrupting attributes like
	 * tab labels. Since the REST endpoint already restricts access to
	 * users with `edit_theme_options`, we only need UTF-8 validation.
	 *
	 * @param mixed $value Raw content from REST or meta API.
	 * @return string
	 */
	public static function sanitize( mixed $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}

		return wp_check_invalid_utf8( $value );
	}

	/**
	 * Sanitize settings JSON stored as a string.
	 *
	 * @param mixed $value Settings object or JSON string.
	 * @return string
	 */
	public static function sanitize_settings( mixed $value ): string {
		if ( is_array( $value ) ) {
			$value = wp_json_encode( $value );
		}

		if ( ! is_string( $value ) ) {
			return '{}';
		}

		$decoded = json_decode( $value, true );

		if ( ! is_array( $decoded ) ) {
			return '{}';
		}

		return wp_json_encode( $decoded ) ?: '{}';
	}
}
