<?php
/**
 * Server-side render for Menu List block.
 *
 * Supports InnerBlocks (children Menu Item blocks) as primary mode,
 * and maintains backward-compatibility with legacy repeater items.
 *
 * @package Beplus\VisualMegaNav\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks content.
 * @var WP_Block|null        $block      Block instance.
 */

declare(strict_types=1);

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Block render templates use local variables.
// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited -- Block attributes map to standard keys.

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$attributes = is_array( $attributes ?? null ) ? $attributes : [];

if ( ! function_exists( 'beplus_vmn_sanitize_color_value' ) ) {
	/**
	 * Resolves a stored color attribute into standard Gutenberg variable or hex.
	 * If the color is a theme palette slug or matches a theme palette color,
	 * it returns the dynamic var(--wp--preset--color--[slug]).
	 *
	 * @param string $color Color input string.
	 * @return string
	 */
	function beplus_vmn_sanitize_color_value( string $color ): string {
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
			$theme_palette = wp_get_global_settings( array( 'color', 'palette', 'theme' ) );
			if ( is_array( $theme_palette ) ) {
				foreach ( $theme_palette as $palette_entry ) {
					if (
						isset( $palette_entry['slug'], $palette_entry['color'] ) &&
						0 === strcasecmp( (string) $palette_entry['color'], $trimmed )
					) {
						return sprintf( 'var(--wp--preset--color--%s)', sanitize_html_class( strtolower( $palette_entry['slug'] ) ) );
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

if ( ! function_exists( 'beplus_vmn_is_url_active' ) ) {
	/**
	 * Determines if a menu item matches the currently requested page URL,
	 * supporting relative paths, absolute URLs, query parameters (e.g. ?theme=pumori), and post IDs.
	 *
	 * @param string $url     Target URL.
	 * @param int    $item_id Target post/page ID.
	 * @return bool
	 */
	function beplus_vmn_is_url_active( string $url, int $item_id = 0 ): bool {
		$current_id   = (int) get_queried_object_id();
		$current_uri  = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		$current_full = home_url( $current_uri );

		$current_parts = wp_parse_url( $current_full );
		$current_path  = untrailingslashit( $current_parts['path'] ?? '/' ) ?: '/';
		wp_parse_str( $current_parts['query'] ?? '', $current_args );

		// 1. Direct page ID match if given.
		if ( $item_id > 0 && $current_id > 0 && $item_id === $current_id ) {
			// If target URL has query params (e.g. ?theme=pumori), check that they match.
			$target_query = (string) wp_parse_url( $url, PHP_URL_QUERY );
			if ( '' !== $target_query ) {
				wp_parse_str( $target_query, $target_args );
				foreach ( $target_args as $k => $v ) {
					if ( ! isset( $current_args[ $k ] ) || (string) $current_args[ $k ] !== (string) $v ) {
						return false;
					}
				}
			}
			return true;
		}

		$trimmed_url = trim( $url );
		if ( '' === $trimmed_url || '#' === $trimmed_url ) {
			return false;
		}

		// 2. Normalize target URL to full URL.
		$target_full = $trimmed_url;
		if ( str_starts_with( $target_full, '/' ) ) {
			$target_full = home_url( $target_full );
		} elseif ( ! preg_match( '#^https?://#i', $target_full ) ) {
			$target_full = home_url( '/' . ltrim( $target_full, '/' ) );
		}

		$target_parts = wp_parse_url( $target_full );
		if ( ! is_array( $target_parts ) ) {
			return false;
		}

		$target_path = untrailingslashit( $target_parts['path'] ?? '/' ) ?: '/';

		// Compare paths.
		if ( $target_path !== $current_path ) {
			return false;
		}

		// Both paths match. Now evaluate query parameters.
		wp_parse_str( $target_parts['query'] ?? '', $target_args );

		// If target URL specifies query params (e.g. ?theme=pumori or ?theme=children):
		// ALL target query parameters must be present with matching values in current request.
		if ( ! empty( $target_args ) ) {
			foreach ( $target_args as $k => $v ) {
				if ( ! isset( $current_args[ $k ] ) || (string) $current_args[ $k ] !== (string) $v ) {
					return false;
				}
			}
			return true;
		}

		// If target has NO query params, but the current request has a theme switcher parameter
		// (e.g. ?theme=pumori), do not match a generic target without that parameter.
		if ( isset( $current_args['theme'] ) && '' !== $current_args['theme'] ) {
			return false;
		}

		return true;
	}
}

$item_gap           = isset( $attributes['itemGap'] ) ? max( 0, (int) $attributes['itemGap'] ) : 4;
$padding_v          = isset( $attributes['paddingVertical'] ) ? max( 0, (int) $attributes['paddingVertical'] ) : 0;
$padding_h          = isset( $attributes['paddingHorizontal'] ) ? max( 0, (int) $attributes['paddingHorizontal'] ) : 0;
$item_padding_v     = isset( $attributes['itemPaddingVertical'] ) ? max( 0, (int) $attributes['itemPaddingVertical'] ) : 7;
$item_padding_h     = isset( $attributes['itemPaddingHorizontal'] ) ? max( 0, (int) $attributes['itemPaddingHorizontal'] ) : 12;
$active_style       = sanitize_key( (string) ( $attributes['activeStyle'] ?? 'background' ) );
$active_font_weight = sanitize_text_field( (string) ( $attributes['activeFontWeight'] ?? '700' ) );
$active_bg_color    = beplus_vmn_sanitize_color_value( (string) ( $attributes['activeBgColor'] ?? '' ) );
$active_text_color  = beplus_vmn_sanitize_color_value( (string) ( $attributes['activeTextColor'] ?? '' ) );
$hover_bg_color     = beplus_vmn_sanitize_color_value( (string) ( $attributes['hoverBgColor'] ?? '' ) );
$hover_text_color   = beplus_vmn_sanitize_color_value( (string) ( $attributes['hoverTextColor'] ?? '' ) );

$inline_styles = [
	sprintf( '--beplus-vmn-list-gap:%dpx', $item_gap ),
];

if ( $padding_v > 0 || $padding_h > 0 ) {
	$inline_styles[] = sprintf( 'padding:%dpx %dpx', $padding_v, $padding_h );
	$inline_styles[] = sprintf( '--beplus-vmn-list-padding-v:%dpx', $padding_v );
	$inline_styles[] = sprintf( '--beplus-vmn-list-padding-h:%dpx', $padding_h );
}
$inline_styles[] = sprintf( '--beplus-vmn-list-item-padding-v:%dpx', $item_padding_v );
$inline_styles[] = sprintf( '--beplus-vmn-list-item-padding-h:%dpx', $item_padding_h );

$legacy_dark_colors   = [ '#111827', '#0a0a0a', 'var(--wp--preset--color--contrast)', 'contrast' ];
$legacy_default_combo = ( strtolower( $active_bg_color ) === '#ffe600' && in_array( strtolower( $active_text_color ), [ '#111827', '#0a0a0a' ], true ) );

if ( '' !== $active_bg_color && ! $legacy_default_combo ) {
	$inline_styles[] = sprintf( '--beplus-vmn-list-active-bg:%s', $active_bg_color );
}
if ( '' !== $active_text_color && ! $legacy_default_combo && ( '' !== $active_bg_color || ! in_array( strtolower( $active_text_color ), $legacy_dark_colors, true ) ) ) {
	$inline_styles[] = sprintf( '--beplus-vmn-list-active-color:%s', $active_text_color );
}
if ( '' !== $active_font_weight ) {
	$inline_styles[] = sprintf( '--beplus-vmn-list-active-weight:%s', $active_font_weight );
}
if ( '' !== $hover_bg_color ) {
	$inline_styles[] = sprintf( '--beplus-vmn-list-hover-bg:%s', $hover_bg_color );
}
if ( '' !== $hover_text_color ) {
	$inline_styles[] = sprintf( '--beplus-vmn-list-hover-color:%s', $hover_text_color );
}

$enable_animation = ! empty( $attributes['enableAnimation'] );
$animation_style  = sanitize_key( (string) ( $attributes['animationStyle'] ?? ( $attributes['scrollAnimationStyle'] ?? 'sequential' ) ) );
if ( ! in_array( $animation_style, [ 'default', 'sequential' ], true ) ) {
	$animation_style = 'sequential';
}

$classes = [
	'beplus-vmn-menu-list',
	sprintf( 'beplus-vmn-menu-list--active-%s', esc_attr( $active_style ) ),
];

if ( $enable_animation ) {
	$classes[] = sprintf( 'beplus-vmn-menu-list--animation-%s', esc_attr( $animation_style ) );
}

$style_attr = ! empty( $inline_styles ) ? implode( ';', $inline_styles ) : '';

$wrapper_args = [
	'class' => implode( ' ', $classes ),
	'style' => $style_attr,
];

$wrapper_attributes = function_exists( 'get_block_wrapper_attributes' )
	? get_block_wrapper_attributes( $wrapper_args )
	: sprintf( 'class="%s" style="%s"', esc_attr( $wrapper_args['class'] ), esc_attr( $style_attr ) );

$has_inner_content = ! empty( trim( (string) ( $content ?? '' ) ) );
$legacy_items      = is_array( $attributes['items'] ?? null ) ? $attributes['items'] : [];
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( $has_inner_content ) : ?>
		<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<?php elseif ( ! empty( $legacy_items ) ) : ?>
		<?php
		$current_id    = (int) get_queried_object_id();
		$request_url   = home_url( add_query_arg( [], $GLOBALS['wp']->request ?? '' ) );
		$clean_current = untrailingslashit( (string) strtok( $request_url, '?#' ) );

		foreach ( $legacy_items as $item ) :
			if ( ! is_array( $item ) ) {
				continue;
			}

			$label         = sanitize_text_field( (string) ( $item['label'] ?? '' ) );
			$url           = (string) ( $item['url'] ?? '' );
			$page_id       = absint( $item['pageId'] ?? 0 );
			$type          = sanitize_key( (string) ( $item['type'] ?? '' ) );
			$opens_new     = ! empty( $item['opensInNewTab'] );
			$badge         = sanitize_text_field( (string) ( $item['badge'] ?? '' ) );
			$badge_variant = sanitize_key( (string) ( $item['badgeVariant'] ?? 'default' ) );
			$description   = sanitize_text_field( (string) ( $item['description'] ?? '' ) );

			if ( $page_id > 0 && 'custom' !== $type ) {
				$permalink = get_permalink( $page_id );
				if ( is_string( $permalink ) && '' !== $permalink ) {
					$url = $permalink;
				}
				if ( '' === $label ) {
					$post_title = get_the_title( $page_id );
					if ( is_string( $post_title ) && '' !== $post_title ) {
						$label = $post_title;
					}
				}
			}

			$url = esc_url( $url );

			$is_current = beplus_vmn_is_url_active( $url, ( 'custom' === $type ) ? 0 : $page_id );

			$item_classes = [ 'beplus-vmn-menu-item' ];
			if ( $is_current ) {
				$item_classes[] = 'is-current';
				$item_classes[] = 'current-menu-item';
			}
			?>
			<div class="<?php echo esc_attr( implode( ' ', $item_classes ) ); ?>">
				<?php if ( '' !== $url ) : ?>
					<a
						class="beplus-vmn-menu-item__link"
						href="<?php echo esc_url( $url ); ?>"
						<?php
						if ( $opens_new ) :
							?>
							target="_blank" rel="noopener noreferrer"<?php endif; ?>
						<?php
						if ( $is_current ) :
							?>
							aria-current="page"<?php endif; ?>
					>
						<span class="beplus-vmn-menu-item__label"><?php echo esc_html( '' !== $label ? $label : $url ); ?></span>
						<?php if ( '' !== $badge ) : ?>
							<span class="beplus-vmn-menu-item__badge beplus-vmn-menu-item__badge--<?php echo esc_attr( $badge_variant ); ?>" aria-hidden="true">
								<?php echo esc_html( $badge ); ?>
							</span>
						<?php endif; ?>
					</a>
				<?php else : ?>
					<span class="beplus-vmn-menu-item__label beplus-vmn-menu-item__label--placeholder">
						<?php echo esc_html( '' !== $label ? $label : __( 'Menu Item', 'beplus-visual-mega-nav' ) ); ?>
					</span>
				<?php endif; ?>

				<?php if ( '' !== $description ) : ?>
					<p class="beplus-vmn-menu-item__description"><?php echo esc_html( $description ); ?></p>
				<?php endif; ?>
			</div>
		<?php endforeach; ?>
	<?php endif; ?>
</div>
