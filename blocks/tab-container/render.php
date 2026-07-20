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
 * @package Beplus\VisualMegaNav\Blocks
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
$extra_class  = 'beplus-vmn-tab-container';
$extra_class .= ' beplus-vmn-tab-container--' . $layout_mode;

// Collect colour overrides that will be output as inline CSS custom properties.
$colour_overrides = [];

$indicator_color = isset( $attributes['indicatorColor'] ) ? sanitize_hex_color( (string) $attributes['indicatorColor'] ) : '';
if ( '' !== $indicator_color ) {
	$colour_overrides[] = sprintf( '--beplus-vmn-tab-text-color:%s', $indicator_color );
	$colour_overrides[] = sprintf( '--beplus-vmn-tab-indicator-color:%s', $indicator_color );
}

$container_style = '';
if ( [] !== $colour_overrides ) {
	$container_style = ' style="' . esc_attr( implode( ';', $colour_overrides ) ) . '"';
}

$wrapper_attributes = function_exists( 'get_block_wrapper_attributes' )
	? get_block_wrapper_attributes( [ 'class' => $extra_class ] )
	: sprintf( 'class="%s"', esc_attr( $extra_class ) );

// Collect tab labels, sub-labels, icons, and icon colors from inner blocks.
$labels      = [];
$sublabels   = [];
$icons       = [];
$icon_colors = [];
if ( $block instanceof \WP_Block && isset( $block->inner_blocks ) ) {
	foreach ( $block->inner_blocks as $child ) {
		if ( ! ( $child instanceof \WP_Block ) ) {
			continue;
		}

		$raw_label    = isset( $child->attributes['tabLabel'] )
			? (string) $child->attributes['tabLabel']
			: '';
		$raw_sublabel = isset( $child->attributes['tabSubLabel'] )
			? (string) $child->attributes['tabSubLabel']
			: '';

		// Decode HTML entities (&amp; → &).
		$raw_label    = html_entity_decode( $raw_label, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$raw_sublabel = html_entity_decode( $raw_sublabel, ENT_QUOTES | ENT_HTML5, 'UTF-8' );

		// Decode JSON-style unicode escapes (\u0026 → &).
		if ( '' !== $raw_label && str_contains( $raw_label, '\\' ) ) {
			$safe    = str_replace( '"', '\\"', $raw_label );
			$decoded = json_decode( '"' . $safe . '"' );
			if ( is_string( $decoded ) ) {
				$raw_label = $decoded;
			}
		}
		if ( '' !== $raw_sublabel && str_contains( $raw_sublabel, '\\' ) ) {
			$safe    = str_replace( '"', '\\"', $raw_sublabel );
			$decoded = json_decode( '"' . $safe . '"' );
			if ( is_string( $decoded ) ) {
				$raw_sublabel = $decoded;
			}
		}

		$labels[]    = wp_strip_all_tags( $raw_label, true );
		$sublabels[] = wp_strip_all_tags( $raw_sublabel, true );

		$icons[]       = isset( $child->attributes['tabIcon'] )
			? sanitize_text_field( (string) $child->attributes['tabIcon'] )
			: '';
		$icon_colors[] = isset( $child->attributes['tabIconColor'] )
			? sanitize_text_field( (string) $child->attributes['tabIconColor'] )
			: '';
	}
}

$panel_count = count( $labels );

if ( 0 === $panel_count ) {
	return;
}

$instance_id = wp_unique_id( 'beplus-vmn-' );

printf(
	'<div %1$s data-beplus-vmn-tabs="%2$s" data-beplus-vmn-layout="%3$s"%4$s>',
	$wrapper_attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	esc_attr( $instance_id ),
	esc_attr( $layout_mode ),
	$container_style // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above.
);

// ---- Tab list ----
if ( 'horizontal' === $layout_mode ) {
	echo '<div class="beplus-vmn-tab-container__tablist" role="tablist" aria-label="' . esc_attr__( 'Tabs', 'beplus-visual-mega-nav' ) . '">';
	echo '<span class="beplus-vmn-tab-container__indicator" aria-hidden="true"></span>';
} else {
	echo '<div class="beplus-vmn-tab-container__sidebar">';
	echo '<div class="beplus-vmn-tab-container__tablist" role="tablist" aria-orientation="vertical">';
	echo '<span class="beplus-vmn-tab-container__indicator" aria-hidden="true"></span>';
}

for ( $i = 0; $i < $panel_count; $i++ ) {
	$is_active  = 0 === $i;
	$label      = $labels[ $i ];
	$sublabel   = $sublabels[ $i ] ?? '';
	$icon       = $icons[ $i ] ?? '';
	$icon_color = $icon_colors[ $i ] ?? '';
	$has_extra  = '' !== $sublabel || '' !== $icon;

	if ( '' === $label ) {
		/* translators: %d: tab number */
		$label = sprintf( __( 'Tab %d', 'beplus-visual-mega-nav' ), $i + 1 );
	}

	$label_html = '';
	if ( $has_extra ) {
		$label_html .= '<span class="beplus-vmn-tab-container__tab-inner">';

		if ( '' !== $icon ) {
			$icon_style = '';
			$icon_class = 'beplus-vmn-tab-container__tab-icon beplus-vmn-tab-container__tab-icon--stacked';

			if ( '' !== $icon_color ) {
				if ( preg_match( '/^[a-z0-9-]+$/', $icon_color ) ) {
					$resolved_color = sprintf( 'var(--wp--preset--color--%s)', $icon_color );
				} else {
					$resolved_color = $icon_color;
				}

				$icon_style = sprintf(
					' style="--beplus-vmn-tab-icon-color:%s"',
					esc_attr( $resolved_color )
				);
			}
			$label_html .= sprintf(
				'<span class="%s" data-beplus-vmn-icon="%s" aria-hidden="true"%s></span>',
				esc_attr( $icon_class ),
				esc_attr( $icon ),
				$icon_style // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above.
			);
		}

		$label_html .= '<span class="beplus-vmn-tab-container__tab-text">';
		$label_html .= sprintf(
			'<span class="beplus-vmn-tab-container__tab-label">%s</span>',
			esc_html( $label )
		);
		if ( '' !== $sublabel ) {
			$label_html .= sprintf(
				'<span class="beplus-vmn-tab-container__tab-sublabel">%s</span>',
				esc_html( $sublabel )
			);
		}
		$label_html .= '</span>'; // Close tab-text.
		$label_html .= '</span>'; // Close tab-inner.
	} else {
		$label_html = esc_html( $label );
	}

	// Build tab colour data attribute for dynamic indicator.
	$tab_color_attr = '';
	if ( '' !== $icon && '' !== $icon_color ) {
		if ( preg_match( '/^[a-z0-9-]+$/', $icon_color ) ) {
			$resolved_color = sprintf( 'var(--wp--preset--color--%s)', $icon_color );
		} else {
			$resolved_color = $icon_color;
		}
		$tab_color_attr = sprintf(
			' data-beplus-vmn-tab-color="%s"',
			esc_attr( $resolved_color )
		);
	}

	printf(
		'<div class="beplus-vmn-tab-container__tab" role="tab" id="%1$s" aria-selected="%2$s" aria-controls="%3$s" tabindex="%4$d"%5$s>%6$s</div>',
		esc_attr( $instance_id . '-tab-' . $i ),
		$is_active ? 'true' : 'false',
		esc_attr( $instance_id . '-tabpanel-' . $i ),
		$is_active ? 0 : -1,
		$tab_color_attr, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above.
		$label_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above.
	);
}

echo '</div>'; // Close tablist.

if ( 'vertical' === $layout_mode ) {
	echo '</div>'; // Close sidebar.
}

// ---- Content panels ----
echo '<div class="beplus-vmn-tab-container__content">';

if ( $block instanceof \WP_Block && isset( $block->inner_blocks ) ) {
	$idx = 0;
	foreach ( $block->inner_blocks as $child ) {
		if ( ! ( $child instanceof \WP_Block ) ) {
			continue;
		}

		$is_active = 0 === $idx;

		printf(
			'<div class="beplus-vmn-tab-container__panel" role="tabpanel" id="%1$s" aria-labelledby="%2$s"%3$s>',
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
