<?php
/**
 * Renders mega menu panel markup for a nav menu item.
 *
 * @package Beplus\VisualMegaNav\Frontend
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Frontend;

use Beplus\VisualMegaNav\Core\MetaKeys;

/**
 * Shared HTML output for mega menu panels.
 */
final class MegaMenuPanelRenderer {

	/**
	 * Append mega panel markup after a menu item link when enabled.
	 *
	 * @param string   $output Output buffer (by reference).
	 * @param \WP_Post $item   Menu item.
	 * @param int      $depth  Menu depth.
	 * @return bool True when a panel was appended.
	 */
	public static function append( string &$output, \WP_Post $item, int $depth ): bool {
		if ( 0 !== $depth ) {
			return false;
		}

		$enabled = (bool) MetaKeys::get( $item->ID, MetaKeys::ENABLED );
		if ( ! $enabled ) {
			return false;
		}

		$content = MetaKeys::get( $item->ID, MetaKeys::CONTENT );
		if ( empty( $content ) || ! is_string( $content ) ) {
			return false;
		}

		$settings = json_decode(
			MetaKeys::get( $item->ID, MetaKeys::SETTINGS ) ?: '{}',
			true
		);
		if ( ! is_array( $settings ) ) {
			$settings = [];
		}

		$width         = $settings['width'] ?? 'full';
		$custom_w      = intval( $settings['customWidth'] ?? 780 );
		$position      = sanitize_key( $settings['position'] ?? 'item-left' );
		$bg_color      = self::sanitize_color_value( (string) ( $settings['bgColor'] ?? '' ) );
		$border_radius = $settings['borderRadius'] ?? null;
		$animation     = $settings['animation'] ?? 'fade';

		$inline_styles = self::build_inline_styles( $width, $custom_w, $bg_color, $border_radius );

		$output .= sprintf(
			'<div class="beplus-vmn-mega-panel beplus-vmn-mega-panel--%s" data-width="%s" data-custom-width="%d" data-position="%s" data-animation="%s" style="%s" role="region" aria-label="%s">',
			esc_attr( $width ),
			esc_attr( $width ),
			$custom_w,
			esc_attr( $position ),
			esc_attr( $animation ),
			esc_attr( $inline_styles ),
			esc_attr(
				sprintf(
					/* translators: %s: menu item title */
					__( 'Mega menu for %s', 'beplus-visual-mega-nav' ),
					$item->title
				)
			)
		);
		$output .= '<div class="beplus-vmn-mega-panel__inner">';
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- core WordPress hook
		$output .= apply_filters( 'the_content', $content );
		$output .= '</div></div>';

		return true;
	}

	/**
	 * Build inline CSS for the mega panel.
	 *
	 * @param string $width         Width type: full | container | custom.
	 * @param int    $custom_w      Custom width in px.
	 * @param string $bg_color      Background color value.
	 * @param mixed  $border_radius Optional border radius (numeric or 4-corner array).
	 * @return string
	 */
	private static function build_inline_styles( string $width, int $custom_w, string $bg_color, mixed $border_radius = null ): string {
		$styles = [];

		switch ( $width ) {
			case 'custom':
				$styles[] = sprintf( 'width:%dpx;max-width:min(100%%, calc(100vw - 32px));box-sizing:border-box', $custom_w );
				break;
			case 'full':
			case 'container':
			default:
				$styles[] = 'width:100%;left:0;right:0;box-sizing:border-box';
				break;
		}

		if ( '' !== $bg_color ) {
			$styles[] = sprintf( '--beplus-vmn-mega-bg:%s', $bg_color );
			$styles[] = sprintf( 'background-color:%s', $bg_color );
		}

		$radius_css = self::build_border_radius_css( $border_radius );
		if ( '' !== $radius_css ) {
			$styles[] = sprintf( '--beplus-vmn-mega-radius:%s', $radius_css );
			$styles[] = sprintf( 'border-radius:%s', $radius_css );
		}

		return implode( ';', $styles );
	}

	/**
	 * Build valid CSS border-radius value from numeric or 4-corner array setting.
	 *
	 * @param mixed $border_radius Numeric or associative array with topLeft, topRight, bottomRight, bottomLeft.
	 * @return string CSS border-radius string or empty string.
	 */
	public static function build_border_radius_css( mixed $border_radius ): string {
		if ( null === $border_radius || '' === $border_radius ) {
			return '';
		}

		if ( is_numeric( $border_radius ) ) {
			$val = max( 0, intval( $border_radius ) );
			return $val > 0 ? sprintf( '%dpx', $val ) : '';
		}

		if ( is_array( $border_radius ) ) {
			$tl = max( 0, intval( $border_radius['topLeft'] ?? 0 ) );
			$tr = max( 0, intval( $border_radius['topRight'] ?? 0 ) );
			$br = max( 0, intval( $border_radius['bottomRight'] ?? 0 ) );
			$bl = max( 0, intval( $border_radius['bottomLeft'] ?? 0 ) );

			if ( 0 === $tl && 0 === $tr && 0 === $br && 0 === $bl ) {
				return '';
			}

			if ( $tl === $tr && $tr === $br && $br === $bl ) {
				return sprintf( '%dpx', $tl );
			}

			// CSS border-radius shorthand: top-left top-right bottom-right bottom-left.
			return sprintf( '%dpx %dpx %dpx %dpx', $tl, $tr, $br, $bl );
		}

		return '';
	}

	/**
	 * Resolves a stored color attribute into standard Gutenberg variable or hex.
	 * Supports presets (slug or var:preset|color|slug), hex, rgba, hsla, transparent.
	 *
	 * @param string $color Color input string.
	 * @return string
	 */
	public static function sanitize_color_value( string $color ): string {
		$trimmed = trim( $color );
		if ( '' === $trimmed ) {
			return '';
		}

		// 1. Transparent keyword or zero-alpha.
		if (
			'transparent' === $trimmed ||
			'rgba(0, 0, 0, 0)' === $trimmed ||
			'rgba(0,0,0,0)' === $trimmed ||
			preg_match( '/^#[0-9a-f]{6}00$/i', $trimmed ) ||
			preg_match( '/^#[0-9a-f]{3}0$/i', $trimmed )
		) {
			return 'transparent';
		}

		// 2. Preset reference pattern: var:preset|color|slug
		if ( preg_match( '/^var:preset\|color\|([a-z0-9_-]+)$/i', $trimmed, $m ) ) {
			return sprintf( 'var(--wp--preset--color--%s)', sanitize_html_class( strtolower( $m[1] ) ) );
		}

		// 3. Preset CSS var pattern: var(--wp--preset--color--slug)
		if ( preg_match( '/^var\(\s*--wp--preset--color--([a-z0-9_-]+)\s*\)$/i', $trimmed, $m ) ) {
			return sprintf( 'var(--wp--preset--color--%s)', sanitize_html_class( strtolower( $m[1] ) ) );
		}

		// 4. Plain preset slug string (e.g. 'primary', 'secondary', 'base', 'contrast', etc.)
		if ( preg_match( '/^[a-z0-9_-]+$/i', $trimmed ) && ! preg_match( '/^[0-9a-f]{3,8}$/i', $trimmed ) ) {
			return sprintf( 'var(--wp--preset--color--%s)', sanitize_html_class( strtolower( $trimmed ) ) );
		}

		// 5. If it is a hex value, check if it matches a theme palette color.
		if ( function_exists( 'wp_get_global_settings' ) ) {
			$theme_palette = wp_get_global_settings( [ 'color', 'palette', 'theme' ] );
			if ( is_array( $theme_palette ) ) {
				foreach ( $theme_palette as $palette_entry ) {
					if (
						isset( $palette_entry['slug'], $palette_entry['color'] ) &&
						0 === strcasecmp( (string) $palette_entry['color'], $trimmed )
					) {
						return sprintf( 'var(--wp--preset--color--%s)', sanitize_html_class( strtolower( (string) $palette_entry['slug'] ) ) );
					}
				}
			}
		}

		// 6. Custom rgba / hsla.
		if ( preg_match( '/^(rgba?|hsla?)\([^\)]+\)$/i', $trimmed ) ) {
			return $trimmed;
		}

		// 7. Custom hex.
		return sanitize_hex_color( $trimmed ) ?: '';
	}
}
