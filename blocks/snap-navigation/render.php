<?php
/**
 * Snap Navigation block — frontend markup.
 *
 * @package Snap\MegaMenuBuilder\Blocks
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

$instance_id = $block->context['snap-megamenu/instanceId'] ?? '';
$overlay_id  = ! empty( $attributes['overlayId'] )
	? sanitize_html_class( (string) $attributes['overlayId'] )
	: ( '' !== $instance_id ? sanitize_html_class( 'overlay-' . $instance_id ) : '' );

// Resolves a WordPress preset reference ("var:preset|spacing|50") to CSS var() syntax,
// or returns the raw value as-is if it's not a preset reference.
$resolve_preset = static function ( string $value ): string {
	if ( str_starts_with( $value, 'var:preset|' ) ) {
		// Format: var:preset|category|slug
		$parts   = explode( '|', $value );
		$cat     = $parts[1] ?? '';
		$slug    = $parts[2] ?? '';
		if ( '' !== $cat && '' !== $slug ) {
			return 'var(--wp--preset--' . esc_attr( $cat ) . '--' . esc_attr( $slug ) . ')';
		}
	}
	return $value;
};

// Build inline flex layout styles from the layout attribute.
$layout       = isset( $attributes['layout'] ) && is_array( $attributes['layout'] ) ? $attributes['layout'] : [];
$style_attr   = isset( $attributes['style'] ) && is_array( $attributes['style'] ) ? $attributes['style'] : [];
$spacing      = isset( $style_attr['spacing'] ) && is_array( $style_attr['spacing'] ) ? $style_attr['spacing'] : [];

$inline_css  = 'display:flex;';
$inline_css .= 'flex-direction:' . ( isset( $layout['orientation'] ) && 'vertical' === $layout['orientation'] ? 'column' : 'row' ) . ';';
$inline_css .= 'flex-wrap:' . ( isset( $layout['flexWrap'] ) ? esc_attr( $layout['flexWrap'] ) : 'wrap' ) . ';';

if ( isset( $layout['justifyContent'] ) && '' !== $layout['justifyContent'] ) {
	$inline_css .= 'justify-content:' . esc_attr( $layout['justifyContent'] ) . ';';
} else {
	$inline_css .= 'justify-content:right;';
}

if ( isset( $layout['verticalAlignment'] ) && '' !== $layout['verticalAlignment'] ) {
	$align_map = [
		'top'    => 'flex-start',
		'center' => 'center',
		'bottom' => 'flex-end',
	];
	$css_align = $align_map[ $layout['verticalAlignment'] ] ?? $layout['verticalAlignment'];
	$inline_css .= 'align-items:' . esc_attr( $css_align ) . ';';
}

// Merge spacing (padding per-side) into inline CSS.
$padding = isset( $spacing['padding'] ) && is_array( $spacing['padding'] ) ? $spacing['padding'] : [];
if ( isset( $padding['top'] ) && '' !== $padding['top'] ) {
	$inline_css .= 'padding-top:' . $resolve_preset( (string) $padding['top'] ) . ';';
}
if ( isset( $padding['right'] ) && '' !== $padding['right'] ) {
	$inline_css .= 'padding-right:' . $resolve_preset( (string) $padding['right'] ) . ';';
}
if ( isset( $padding['bottom'] ) && '' !== $padding['bottom'] ) {
	$inline_css .= 'padding-bottom:' . $resolve_preset( (string) $padding['bottom'] ) . ';';
}
if ( isset( $padding['left'] ) && '' !== $padding['left'] ) {
	$inline_css .= 'padding-left:' . $resolve_preset( (string) $padding['left'] ) . ';';
}

// Block gap.
if ( isset( $spacing['blockGap'] ) && '' !== $spacing['blockGap'] ) {
	$inline_css .= 'gap:' . $resolve_preset( (string) $spacing['blockGap'] ) . ';';
}

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'style'           => $inline_css,
		'data-overlay-id' => '' !== $overlay_id ? $overlay_id : null,
	]
);

printf( '<div %1$s>%2$s</div>', $wrapper_attributes, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() and InnerBlocks $content are pre-escaped.

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
