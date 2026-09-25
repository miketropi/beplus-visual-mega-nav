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

		$width     = $settings['width'] ?? 'full';
		$custom_w  = intval( $settings['customWidth'] ?? 780 );
		$position  = sanitize_key( $settings['position'] ?? 'item-left' );
		$bg_color  = sanitize_hex_color( $settings['bgColor'] ?? '' ) ?: '';
		$animation = $settings['animation'] ?? 'fade';

		$inline_styles = self::build_inline_styles( $width, $custom_w, $bg_color );

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
	 * @param string $width    Width type: full | container | custom.
	 * @param int    $custom_w Custom width in px.
	 * @param string $bg_color Background color hex.
	 * @return string
	 */
	private static function build_inline_styles( string $width, int $custom_w, string $bg_color ): string {
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

		if ( $bg_color ) {
			$styles[] = sprintf( 'background-color:%s', $bg_color );
		}

		return implode( ';', $styles );
	}
}
