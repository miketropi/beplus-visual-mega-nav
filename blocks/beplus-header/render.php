<?php
/**
 * Snap Header block — frontend markup.
 *
 * @package Beplus\VisualMegaNav\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks.
 * @var WP_Block             $block      Block instance.
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
	$attributes = [];
}

$instance_id = ! empty( $attributes['instanceId'] )
	? sanitize_html_class( (string) $attributes['instanceId'] )
	: wp_unique_id( 'hdr-' );

$breakpoint = isset( $attributes['mobileBreakpoint'] )
	? absint( $attributes['mobileBreakpoint'] )
	: 782;
$breakpoint = max( 320, min( 1200, $breakpoint ) );

$effect          = isset( $attributes['scrollEffect'] ) ? (string) $attributes['scrollEffect'] : 'none';
$allowed_effects = [ 'none', 'shrink', 'hide-on-scroll', 'bg-on-scroll' ];
if ( ! in_array( $effect, $allowed_effects, true ) ) {
	$effect = 'none';
}

$classes = [
	'wp-block-beplus-visual-mega-nav-beplus-header',
	'beplus-hdr-' . $instance_id,
	'is-layout-grid',
];

if ( ! empty( $attributes['sticky'] ) ) {
	$classes[] = 'is-sticky';
}

if ( ! empty( $attributes['transparentTop'] ) ) {
	$classes[] = 'is-transparent-top';
}

if ( 'none' !== $effect ) {
	$classes[] = 'has-scroll-effect';
	$classes[] = 'scroll-' . $effect;
}

$wrapper_style = '';

if ( 'bg-on-scroll' === $effect && ! empty( $attributes['scrollBgColor'] ) ) {
	$scroll_bg = trim( (string) $attributes['scrollBgColor'] );
	$is_hex    = (bool) sanitize_hex_color( $scroll_bg );
	$is_preset = (bool) preg_match( '/^var\(--wp--preset--color--[\w-]+\)$/', $scroll_bg );
	if ( $is_hex || $is_preset ) {
		$wrapper_style = sprintf( '--beplus-hdr-scroll-bg:%s;', $scroll_bg );
	}
}

// Sanitize grid-template-columns value.
$grid_columns = \Beplus\VisualMegaNav\Core\CssSanitizer::sanitizeGridColumns(
	isset( $attributes['gridColumns'] ) ? (string) $attributes['gridColumns'] : 'auto 1fr'
);
$grid_style   = 'grid-template-columns:' . $grid_columns . ';';

$classes[] = 'wp-container-beplus-header-' . $instance_id;

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class'              => implode( ' ', $classes ),
		'data-breakpoint'    => $breakpoint,
		'data-instance'      => $instance_id,
		'data-scroll-effect' => $effect,
		'style'              => $wrapper_style,
	]
);

$inline_css = sprintf(
	'.wp-container-beplus-header-%2$s{display:grid;%3$s}'
	. '@media (max-width:%1$dpx){.beplus-hdr-%2$s .is-desktop-only{display:none}}'
	. '@media (min-width:%4$dpx){.beplus-hdr-%2$s .is-mobile-only{display:none}}'
	. '@media (min-width:%4$dpx){.beplus-nav-portal[data-instance="%2$s"]{display:none}}',
	$breakpoint,
	esc_attr( $instance_id ),
	$grid_style,
	$breakpoint + 1
);

if ( ! wp_style_is( 'beplus-vmn-header-inline', 'registered' ) ) {
	wp_register_style( 'beplus-vmn-header-inline', false, [], BEPLUS_VISUAL_MEGA_NAV_VERSION );
}
wp_add_inline_style( 'beplus-vmn-header-inline', $inline_css );
wp_enqueue_style( 'beplus-vmn-header-inline' );
printf( '<div %1$s>%2$s</div>', $wrapper_attributes, wp_kses_post( $content ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() returns pre-escaped attributes.

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
