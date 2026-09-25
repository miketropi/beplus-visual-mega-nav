<?php
/**
 * Server-side render for Menu Item block.
 *
 * @package Beplus\VisualMegaNav\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks (unused).
 * @var WP_Block|null        $block      Block instance.
 */

declare(strict_types=1);

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Block render templates use local variables.
// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited -- Block attributes map to standard keys.

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$attributes = is_array( $attributes ?? null ) ? $attributes : [];

$label          = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
$url            = (string) ( $attributes['url'] ?? '' );
$id             = absint( $attributes['id'] ?? 0 );
$type           = sanitize_key( (string) ( $attributes['type'] ?? '' ) );
$opens_new      = ! empty( $attributes['opensInNewTab'] );
$rel            = sanitize_text_field( (string) ( $attributes['rel'] ?? '' ) );
$badge          = sanitize_text_field( (string) ( $attributes['badge'] ?? '' ) );
$badge_position = sanitize_key( (string) ( $attributes['badgePosition'] ?? 'top' ) );
if ( ! in_array( $badge_position, [ 'top', 'inline' ], true ) ) {
	$badge_position = 'top';
}
$badge_variant = sanitize_key( (string) ( $attributes['badgeVariant'] ?? 'default' ) );

$context           = isset( $block->context ) && is_array( $block->context ) ? $block->context : [];
$highlight_current = isset( $context['beplus-visual-mega-nav/highlightCurrent'] )
	? ! empty( $context['beplus-visual-mega-nav/highlightCurrent'] )
	: ( ! isset( $attributes['highlightCurrent'] ) || ! empty( $attributes['highlightCurrent'] ) );

$active_style = sanitize_key( (string) ( $context['beplus-visual-mega-nav/activeStyle'] ?? ( $attributes['activeStyle'] ?? 'background' ) ) );

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

$active_bg_color    = beplus_vmn_sanitize_color_value( (string) ( $attributes['activeBgColor'] ?? '' ) );
$active_text_color  = beplus_vmn_sanitize_color_value( (string) ( $attributes['activeTextColor'] ?? '' ) );
$active_font_weight = sanitize_text_field( (string) ( $attributes['activeFontWeight'] ?? '700' ) );
$hover_bg_color     = beplus_vmn_sanitize_color_value( (string) ( $attributes['hoverBgColor'] ?? '' ) );
$hover_text_color   = beplus_vmn_sanitize_color_value( (string) ( $attributes['hoverTextColor'] ?? '' ) );
$badge_bg_color     = beplus_vmn_sanitize_color_value( (string) ( $attributes['badgeBgColor'] ?? '' ) );
$badge_text_color   = beplus_vmn_sanitize_color_value( (string) ( $attributes['badgeTextColor'] ?? '' ) );
$is_custom_link     = ! empty( $attributes['isCustomLink'] );

// Resolve permalink if page/post ID is given.
if ( ! $is_custom_link && $id > 0 && 'custom' !== $type ) {
	$permalink = get_permalink( $id );
	if ( is_string( $permalink ) && '' !== $permalink ) {
		$url = $permalink;
	}
	if ( '' === $label ) {
		$post_title = get_the_title( $id );
		if ( is_string( $post_title ) && '' !== $post_title ) {
			$label = $post_title;
		}
	}
}

$url = esc_url( $url );

// Determine if this item matches the currently viewed page.
$is_current = beplus_vmn_is_url_active( $url, $is_custom_link ? 0 : $id );

// Build inline CSS variables for custom colors.
// Active colors default to the theme button background & text colors.
// Suppress legacy defaults (#111827, #0a0a0a, contrast, or old yellow combo) so items
// dynamically inherit the theme button styling across all skins.
$legacy_dark_colors   = [ '#111827', '#0a0a0a', 'var(--wp--preset--color--contrast)', 'contrast' ];
$legacy_default_combo = ( strtolower( $active_bg_color ) === '#ffe600' && in_array( strtolower( $active_text_color ), [ '#111827', '#0a0a0a' ], true ) );

$inline_styles = [];
if ( '' !== $active_bg_color && ! $legacy_default_combo ) {
	$inline_styles[] = sprintf( '--beplus-vmn-item-active-bg:%s', $active_bg_color );
}
if ( '' !== $active_text_color && ! $legacy_default_combo && ( '' !== $active_bg_color || ! in_array( strtolower( $active_text_color ), $legacy_dark_colors, true ) ) ) {
	$inline_styles[] = sprintf( '--beplus-vmn-item-active-color:%s', $active_text_color );
}
if ( '' !== $active_font_weight ) {
	$inline_styles[] = sprintf( '--beplus-vmn-item-active-weight:%s', $active_font_weight );
}
if ( '' !== $hover_bg_color ) {
	$inline_styles[] = sprintf( '--beplus-vmn-item-hover-bg:%s', $hover_bg_color );
}
if ( '' !== $hover_text_color ) {
	$inline_styles[] = sprintf( '--beplus-vmn-item-hover-color:%s', $hover_text_color );
}
if ( '' !== $badge_bg_color ) {
	$inline_styles[] = sprintf( '--beplus-vmn-item-badge-bg:%s', $badge_bg_color );
}
if ( '' !== $badge_text_color ) {
	$inline_styles[] = sprintf( '--beplus-vmn-item-badge-color:%s', $badge_text_color );
}

$list_item_padding_v = isset( $context['beplus-visual-mega-nav/itemPaddingVertical'] )
	? (int) $context['beplus-visual-mega-nav/itemPaddingVertical']
	: null;
$list_item_padding_h = isset( $context['beplus-visual-mega-nav/itemPaddingHorizontal'] )
	? (int) $context['beplus-visual-mega-nav/itemPaddingHorizontal']
	: null;

if ( null !== $list_item_padding_v ) {
	$inline_styles[] = sprintf( '--beplus-vmn-list-item-padding-v:%dpx', $list_item_padding_v );
}
if ( null !== $list_item_padding_h ) {
	$inline_styles[] = sprintf( '--beplus-vmn-list-item-padding-h:%dpx', $list_item_padding_h );
}

$style_attr = ! empty( $inline_styles ) ? implode( ';', $inline_styles ) : '';

// Build class list.
$classes = [
	'beplus-vmn-menu-item',
	sprintf( 'beplus-vmn-menu-item--active-%s', esc_attr( $active_style ) ),
];

if ( '' !== $badge && 'top' === $badge_position ) {
	$classes[] = 'beplus-vmn-menu-item--has-badge-top';
}

if ( $is_current && $highlight_current ) {
	$classes[] = 'is-current';
	$classes[] = 'current-menu-item';
	$classes[] = 'current_page_item';
}

$wrapper_args = [
	'class' => implode( ' ', $classes ),
];
if ( '' !== $style_attr ) {
	$wrapper_args['style'] = $style_attr;
}

$wrapper_attributes = function_exists( 'get_block_wrapper_attributes' )
	? get_block_wrapper_attributes( $wrapper_args )
	: sprintf( 'class="%s"%s', esc_attr( implode( ' ', $classes ) ), '' !== $style_attr ? ' style="' . esc_attr( $style_attr ) . '"' : '' );

$rel_parts = array_filter( array_map( 'trim', preg_split( '/\s+/', $rel ) ?: [] ) );
if ( $opens_new ) {
	$rel_parts[] = 'noopener';
	$rel_parts[] = 'noreferrer';
}
$final_rel = implode( ' ', array_unique( $rel_parts ) );
if ( function_exists( 'wp_rel_uristring' ) && '' !== $final_rel ) {
	$final_rel = wp_rel_uristring( $final_rel );
}
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( '' !== $url ) : ?>
		<a
			class="beplus-vmn-menu-item__link"
			href="<?php echo esc_url( $url ); ?>"
			<?php
			if ( $opens_new ) :
				?>
				target="_blank"<?php endif; ?>
			<?php
			if ( '' !== $final_rel ) :
				?>
				rel="<?php echo esc_attr( $final_rel ); ?>"<?php endif; ?>
			<?php
			if ( $is_current && $highlight_current ) :
				?>
				aria-current="page"<?php endif; ?>
		>
			<span class="beplus-vmn-menu-item__label-wrap">
				<span class="beplus-vmn-menu-item__label"><?php echo esc_html( '' !== $label ? $label : $url ); ?></span>
				<?php if ( '' !== $badge ) : ?>
					<span class="beplus-vmn-menu-item__badge beplus-vmn-menu-item__badge--<?php echo esc_attr( $badge_position ); ?>" aria-hidden="true">
						<?php echo esc_html( $badge ); ?>
					</span>
				<?php endif; ?>
			</span>
			<?php if ( $opens_new && '' !== $label ) : ?>
				<span class="screen-reader-text"><?php esc_html_e( '(opens in a new tab)', 'beplus-visual-mega-nav' ); ?></span>
			<?php endif; ?>
		</a>
	<?php else : ?>
		<span class="beplus-vmn-menu-item__label beplus-vmn-menu-item__label--placeholder">
			<?php echo esc_html( '' !== $label ? $label : __( 'Menu Item', 'beplus-visual-mega-nav' ) ); ?>
		</span>
	<?php endif; ?>
</div>
