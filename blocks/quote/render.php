<?php
/**
 * Quote block — frontend markup.
 *
 * @package Beplus\VisualMegaNav\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var WP_Block             $block      Block instance.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$attrs = $attributes ?? [];

$quotes_raw = isset( $attrs['quotes'] ) && is_array( $attrs['quotes'] ) ? $attrs['quotes'] : [];

$transition_speed  = isset( $attrs['transitionSpeed'] ) ? max( 100, min( 2000, absint( $attrs['transitionSpeed'] ) ) ) : 400;
$autoplay          = isset( $attrs['autoPlay'] ) ? (bool) $attrs['autoPlay'] : true;
$autoplay_interval = isset( $attrs['autoPlayInterval'] ) ? max( 1000, min( 30000, absint( $attrs['autoPlayInterval'] ) ) ) : 5000;
$text_animation    = isset( $attrs['textAnimation'] ) ? (bool) $attrs['textAnimation'] : true;

// Sanitize quotes.
$quotes = [];
foreach ( $quotes_raw as $q ) {
	if ( ! is_array( $q ) ) {
		continue;
	}
	$avatar_url = '';
	$avatar_id  = isset( $q['avatar']['id'] ) ? absint( $q['avatar']['id'] ) : 0;
	if ( $avatar_id > 0 ) {
		$resolved = wp_get_attachment_image_url( $avatar_id, 'thumbnail' );
		if ( $resolved ) {
			$avatar_url = $resolved;
		}
	}
	if ( '' === $avatar_url && ! empty( $q['avatar']['url'] ) ) {
		$avatar_url = esc_url( (string) $q['avatar']['url'] );
	}

	$quotes[] = [
		'avatar_url' => $avatar_url,
		'name'       => sanitize_text_field( (string) ( $q['name'] ?? '' ) ),
		'position'   => sanitize_text_field( (string) ( $q['position'] ?? '' ) ),
		'text'       => wp_kses_post( (string) ( $q['text'] ?? '' ) ),
	];
}

// Font family setup — must precede wrapper_attributes which uses $font_family.
$font_family_raw = isset( $attrs['quoteFontFamily'] ) ? sanitize_text_field( (string) $attrs['quoteFontFamily'] ) : '';
$allowed_fonts   = [
	''                               => '',
	'Cedarville Cursive'             => "'Cedarville Cursive', cursive",
	'Shadows Into Light Two'         => "'Shadows Into Light Two', cursive",
];
$font_family = $allowed_fonts[ $font_family_raw ] ?? '';

// Enqueue Google Fonts only when a handwritten font is selected.
if ( '' !== $font_family ) {
	wp_enqueue_style(
		'beplus-vmn-quote-fonts',
		'https://fonts.googleapis.com/css2?family=Cedarville+Cursive&family=Shadows+Into+Light+Two&display=swap',
		[],
		null
	);
}

// Font — already set above.

// Text color.
$text_color = isset( $attrs['quoteTextColor'] ) ? sanitize_text_field( (string) $attrs['quoteTextColor'] ) : '';

// Text size.
$size_map  = [
	'small'  => '1em',
	'medium' => '1.25em',
	'large'  => '1.5em',
	'xlarge' => '1.75em',
];
$text_size_raw = isset( $attrs['quoteTextSize'] ) ? sanitize_text_field( (string) $attrs['quoteTextSize'] ) : '';
$text_size     = $size_map[ $text_size_raw ] ?? '';

// Build inline style string.
$wrapper_style = '';
if ( '' !== $font_family ) {
	$wrapper_style .= '--beplus-vmn-quote-font:' . $font_family . ';';
}
if ( '' !== $text_color ) {
	$wrapper_style .= '--beplus-vmn-quote-color:' . $text_color . ';';
}
if ( '' !== $text_size ) {
	$wrapper_style .= '--beplus-vmn-quote-size:' . $text_size . ';';
}

$wrapper_attributes = get_block_wrapper_attributes( [
	'class' => 'beplus-vmn-quote',
	'style' => $wrapper_style,
] );

if ( empty( $quotes ) ) {
	printf(
		'<div %s><p class="beplus-vmn-quote__empty">%s</p></div>',
		$wrapper_attributes,
		esc_html__( 'No quotes added yet.', 'beplus-visual-mega-nav' )
	);
	return;
}

$show_arrows = isset( $attrs['showArrows'] ) ? (bool) $attrs['showArrows'] : true;
$show_dots   = isset( $attrs['showDots'] ) ? (bool) $attrs['showDots'] : true;

$data_attrs = sprintf(
	' data-speed="%d" data-autoplay="%d" data-interval="%d" data-text-anim="%d" data-arrows="%d" data-dots="%d"',
	$transition_speed,
	$autoplay ? 1 : 0,
	$autoplay_interval,
	$text_animation ? 1 : 0,
	$show_arrows ? 1 : 0,
	$show_dots ? 1 : 0
);

// Build static HTML with first card active, up to 2 behind stacked.
$dots  = '';
$cards = '';
$count = count( $quotes );

$stack_rotations = [
	'--beplus-vmn-card-rot: -3deg; --beplus-vmn-card-offset: 8px;',
	'--beplus-vmn-card-rot: 2deg;  --beplus-vmn-card-offset: 16px;',
];

foreach ( $quotes as $i => $quote ) {
	// Determine card state: active (0), stacked (next 2), hidden (rest).
	$card_state = '';
	$card_style = '';
	if ( 0 === $i ) {
		$card_state = ' is-active';
	} elseif ( $i <= 2 ) {
		$card_state = ' is-stacked';
		$j = $i - 1;
		$card_style = ' style="' . $stack_rotations[ $j ] . '"';
	}
	$dots .= sprintf(
		'<button type="button" class="beplus-vmn-quote__dot%s" data-index="%d" aria-label="%s %d"></button>',
		0 === $i ? ' is-active' : '',
		$i,
		esc_attr__( 'Go to slide', 'beplus-visual-mega-nav' ),
		$i + 1
	);

	$avatar_html = '';
	if ( '' !== $quote['avatar_url'] ) {
		$avatar_html = sprintf(
			'<div class="beplus-vmn-quote__avatar"><img src="%s" alt="%s" loading="lazy" width="56" height="56" /></div>',
			esc_url( $quote['avatar_url'] ),
			esc_attr( $quote['name'] )
		);
	}

	$name_html = '';
	if ( '' !== $quote['name'] ) {
		$name_html = sprintf(
			'<span class="beplus-vmn-quote__name">%s</span>',
			esc_html( $quote['name'] )
		);
	}

	$pos_html = '';
	if ( '' !== $quote['position'] ) {
		$pos_html = sprintf(
			'<span class="beplus-vmn-quote__position">%s</span>',
			esc_html( $quote['position'] )
		);
	}

	$cards .= sprintf(
		'<div class="beplus-vmn-quote__card%s" data-index="%d"%s>'
			. '<div class="beplus-vmn-quote__content">'
				. '<blockquote class="beplus-vmn-quote__text"><p>%s</p></blockquote>'
				. '<footer class="beplus-vmn-quote__attribution">'
					. '%s'
					. '<div class="beplus-vmn-quote__meta">%s%s</div>'
				. '</footer>'
			. '</div>'
		. '</div>',
		$card_state,
		$i,
		$card_style,
		$quote['text'],
		$avatar_html,
		$name_html,
		$pos_html
	);
}

printf(
	'<div %s%s>'
		. '<div class="beplus-vmn-quote__stage">%s</div>'
		. '%s'
		. '%s'
	. '</div>',
	$wrapper_attributes,
	$data_attrs,
	$cards,
	$show_arrows
		? sprintf(
			'<button type="button" class="beplus-vmn-quote__arrow beplus-vmn-quote__arrow--prev" aria-label="%s"></button>'
			. '<button type="button" class="beplus-vmn-quote__arrow beplus-vmn-quote__arrow--next" aria-label="%s"></button>',
			esc_attr__( 'Previous quote', 'beplus-visual-mega-nav' ),
			esc_attr__( 'Next quote', 'beplus-visual-mega-nav' )
		)
		: '',
	$show_dots
		? '<div class="beplus-vmn-quote__dots">' . $dots . '</div>'
		: ''
);
