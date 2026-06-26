<?php
/**
 * Tab Container block — frontend markup.
 *
 * Supports two layout modes controlled by the "layoutMode" attribute:
 *   - "vertical"   (default): tab labels stacked left, content right.
 *   - "horizontal": tab labels as a top row, content below.
 *
 * A sliding indicator bar (left-edge for vertical, bottom-edge for
 * horizontal) follows the active tab on hover/click.
 *
 * The "indicatorColor" attribute controls the accent bar.
 * Text and divider colours follow the active theme automatically.
 *
 * @package Snap\MegaMenuBuilder\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks.
 * @var WP_Block             $block      Block instance.
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- WordPress block render convention

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
	$attributes = [];
}

$layout_mode = isset( $attributes['layoutMode'] ) && 'horizontal' === $attributes['layoutMode']
	? 'horizontal'
	: 'vertical';

// Build container class string.
$extra_class  = 'snap-megamenu-tab-container';
$extra_class .= ' snap-megamenu-tab-container--' . $layout_mode;

// Collect colour overrides that will be output as inline CSS custom properties.
$colour_overrides = [];

$indicator_color = isset( $attributes['indicatorColor'] ) ? sanitize_hex_color( (string) $attributes['indicatorColor'] ) : '';
if ( '' !== $indicator_color ) {
	$colour_overrides[] = sprintf( '--snap-mm-tab-text-color:%s', $indicator_color );
	$colour_overrides[] = sprintf( '--snap-mm-tab-indicator-color:%s', $indicator_color );
}

$container_style = '';
if ( [] !== $colour_overrides ) {
	$container_style = ' style="' . esc_attr( implode( ';', $colour_overrides ) ) . '"';
}

$wrapper_attributes = function_exists( 'get_block_wrapper_attributes' )
	? get_block_wrapper_attributes( [ 'class' => $extra_class ] )
	: sprintf( 'class="%s"', esc_attr( $extra_class ) );

// Collect tab labels from inner blocks.
$labels = [];
if ( $block instanceof \WP_Block && isset( $block->inner_blocks ) ) {
	foreach ( $block->inner_blocks as $child ) {
		if ( $child instanceof \WP_Block ) {
			$labels[] = isset( $child->attributes['tabLabel'] )
				? sanitize_text_field( (string) $child->attributes['tabLabel'] )
				: '';
		}
	}
}

$panel_count = count( $labels );

if ( 0 === $panel_count ) {
	return;
}

$instance_id = wp_unique_id( 'snap-mm-' );

printf(
	'<div %1$s data-snap-mm-tabs="%2$s" data-snap-mm-layout="%3$s"%4$s>',
	$wrapper_attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	esc_attr( $instance_id ),
	esc_attr( $layout_mode ),
	$container_style // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above.
);

// ---- Tab list ----
if ( 'horizontal' === $layout_mode ) {
	echo '<div class="snap-megamenu-tab-container__tablist" role="tablist" aria-label="' . esc_attr__( 'Tabs', 'snap-megamenu-builder' ) . '">';
	echo '<span class="snap-megamenu-tab-container__indicator" aria-hidden="true"></span>';
} else {
	echo '<div class="snap-megamenu-tab-container__sidebar">';
	echo '<div class="snap-megamenu-tab-container__tablist" role="tablist" aria-orientation="vertical">';
	echo '<span class="snap-megamenu-tab-container__indicator" aria-hidden="true"></span>';
}

for ( $i = 0; $i < $panel_count; $i++ ) {
	$is_active = 0 === $i;
	$label     = $labels[ $i ];

	if ( '' === $label ) {
		/* translators: %d: tab number */
		$label = sprintf( __( 'Tab %d', 'snap-megamenu-builder' ), $i + 1 );
	}

	printf(
		'<div class="snap-megamenu-tab-container__tab" role="tab" id="%1$s" aria-selected="%2$s" aria-controls="%3$s" tabindex="%4$d">%5$s</div>',
		esc_attr( $instance_id . '-tab-' . $i ),
		$is_active ? 'true' : 'false',
		esc_attr( $instance_id . '-tabpanel-' . $i ),
		$is_active ? 0 : -1,
		esc_html( $label )
	);
}

echo '</div>'; // Close tablist.

if ( 'vertical' === $layout_mode ) {
	echo '</div>'; // Close sidebar.
}

// ---- Content panels ----
echo '<div class="snap-megamenu-tab-container__content">';

if ( $block instanceof \WP_Block && isset( $block->inner_blocks ) ) {
	$idx = 0;
	foreach ( $block->inner_blocks as $child ) {
		if ( ! ( $child instanceof \WP_Block ) ) {
			continue;
		}

		$is_active = 0 === $idx;

		printf(
			'<div class="snap-megamenu-tab-container__panel" role="tabpanel" id="%1$s" aria-labelledby="%2$s"%3$s>',
			esc_attr( $instance_id . '-tabpanel-' . $idx ),
			esc_attr( $instance_id . '-tab-' . $idx ),
			$is_active ? '' : ' hidden'
		);

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered block content
		echo $child->render();

		echo '</div>';

		++$idx;
	}
}

echo '</div>'; // Close content.

echo '</div>'; // Close container.

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
