<?php
/**
 * Nav Toggle block — frontend markup.
 *
 * @package Beplus\VisualMegaNav\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks (unused).
 * @var WP_Block             $block      Block instance.
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
	$attributes = [];
}

$overlay_id = $block->context['beplus-visual-mega-nav/overlayId'] ?? '';

$label         = sanitize_text_field( (string) ( $attributes['label'] ?? '' ) );
$label_visible = (bool) ( $attributes['labelVisible'] ?? false );
$icon_style    = sanitize_html_class( (string) ( $attributes['iconStyle'] ?? 'lines-3' ) );

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'is-mobile-only',
	]
);

$aria_label    = '' !== $label ? $label : __( 'Open menu', 'beplus-visual-mega-nav' );
$aria_controls = '' !== $overlay_id ? ' aria-controls="' . esc_attr( $overlay_id ) . '"' : '';

$icon_markup = sprintf(
	'<span class="beplus-nav-toggle__icon beplus-nav-toggle__icon--%s" aria-hidden="true">
		<span></span>
		<span></span>
		<span></span>
	</span>',
	esc_attr( $icon_style )
);

$label_markup = '';
if ( $label_visible && '' !== $label ) {
	$label_markup = sprintf(
		'<span class="beplus-nav-toggle__label">%s</span>',
		esc_html( $label )
	);
} elseif ( ! $label_visible ) {
	$label_markup = sprintf(
		'<span class="screen-reader-text">%s</span>',
		esc_html( $aria_label )
	);
}

printf(
	'<button %1$s type="button" aria-expanded="false"%2$s%3$s>%4$s%5$s</button>',
	$wrapper_attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	$aria_controls, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	'' !== $label || ! $label_visible ? '' : ' aria-label="' . esc_attr( $aria_label ) . '"',
	$icon_markup, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- safe static HTML.
	$label_markup // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
);

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
