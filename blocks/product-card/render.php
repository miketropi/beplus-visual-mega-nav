<?php
/**
 * Product Card block — frontend markup (vanilla JS + GSAP carousel).
 *
 * @package Beplus\VisualMegaNav\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var WP_Block             $block      Block instance.
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
	$attributes = [];
}

// ---------------------------------------------------------------------------
// WooCommerce guard.
// ---------------------------------------------------------------------------
if ( ! class_exists( 'WooCommerce' ) ) {
	$wrapper = get_block_wrapper_attributes( [ 'class' => 'beplus-vmn-product-card' ] );
	printf(
		'<div %s><p class="beplus-vmn-product-card__empty">%s</p></div>',
		$wrapper, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		esc_html__( 'WooCommerce is required to display products.', 'beplus-visual-mega-nav' )
	);
	return;
}

// ---------------------------------------------------------------------------
// Extract and sanitize attributes.
// ---------------------------------------------------------------------------
$posts_to_show    = isset( $attributes['postsToShow'] ) ? max( 3, min( 20, absint( $attributes['postsToShow'] ) ) ) : 6;
$show_price       = isset( $attributes['showPrice'] ) ? (bool) $attributes['showPrice'] : true;
$show_rating      = isset( $attributes['showRating'] ) ? (bool) $attributes['showRating'] : false;
$show_add_to_cart = isset( $attributes['showAddToCart'] ) ? (bool) $attributes['showAddToCart'] : true;
$show_title       = isset( $attributes['showTitle'] ) ? (bool) $attributes['showTitle'] : true;
$autoplay         = isset( $attributes['autoplay'] ) ? (bool) $attributes['autoplay'] : false;
$autoplay_delay   = isset( $attributes['autoplayDelay'] ) ? max( 500, absint( $attributes['autoplayDelay'] ) ) : 3000;

// Filter by — whitelist.
$filter_by = isset( $attributes['filterBy'] ) ? sanitize_text_field( (string) $attributes['filterBy'] ) : 'all';
$allowed_filter_by = [ 'all', 'category', 'tag', 'ids', 'featured', 'onsale' ];
if ( ! in_array( $filter_by, $allowed_filter_by, true ) ) {
	$filter_by = 'all';
}

// Card width — clamp to a sane range.
$card_width = isset( $attributes['cardWidth'] ) ? absint( $attributes['cardWidth'] ) : 320;
$card_width = max( 180, $card_width );

// Image ratio — whitelist.
$image_ratio = isset( $attributes['imageRatio'] ) ? sanitize_text_field( (string) $attributes['imageRatio'] ) : 'auto';
$allowed_image_ratios = [ 'auto', '16-9', '4-3', '1-1' ];
if ( ! in_array( $image_ratio, $allowed_image_ratios, true ) ) {
	$image_ratio = 'auto';
}

// ---------------------------------------------------------------------------
// Build WP_Query args.
// ---------------------------------------------------------------------------
$query_args = [
	'post_type'           => 'product',
	'post_status'         => 'publish',
	'posts_per_page'      => $posts_to_show,
	'orderby'             => 'date',
	'order'               => 'DESC',
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
];

// ---------------------------------------------------------------------------
// Apply filterBy.
// ---------------------------------------------------------------------------
switch ( $filter_by ) {
	case 'category':
		$category_ids = [];
		if ( isset( $attributes['productCategories'] ) && is_array( $attributes['productCategories'] ) ) {
			$category_ids = array_filter(
				array_map( 'absint', $attributes['productCategories'] ),
				static function ( int $id ): bool {
					return $id > 0;
				}
			);
		}
		if ( ! empty( $category_ids ) ) {
			$query_args['tax_query'] = [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
				[
					'taxonomy' => 'product_cat',
					'field'    => 'term_id',
					'terms'    => $category_ids,
				],
			];
		}
		break;

	case 'tag':
		$tag_ids = [];
		if ( isset( $attributes['productTags'] ) && is_array( $attributes['productTags'] ) ) {
			$tag_ids = array_filter(
				array_map( 'absint', $attributes['productTags'] ),
				static function ( int $id ): bool {
					return $id > 0;
				}
			);
		}
		if ( ! empty( $tag_ids ) ) {
			$query_args['tax_query'] = [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
				[
					'taxonomy' => 'product_tag',
					'field'    => 'term_id',
					'terms'    => $tag_ids,
				],
			];
		}
		break;

	case 'ids':
		$ids_string = isset( $attributes['productIds'] ) ? sanitize_text_field( (string) $attributes['productIds'] ) : '';
		if ( '' !== $ids_string ) {
			$ids = array_filter(
				array_map( 'absint', explode( ',', $ids_string ) ),
				static function ( int $id ): bool {
					return $id > 0;
				}
			);
			if ( ! empty( $ids ) ) {
				$query_args['post__in']       = $ids;
				$query_args['orderby']        = 'post__in';
				$query_args['posts_per_page'] = count( $ids );
			}
		}
		break;

	case 'featured':
		$query_args['tax_query'] = [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
			[
				'taxonomy' => 'product_visibility',
				'field'    => 'name',
				'terms'    => 'featured',
			],
		];
		break;

	case 'onsale':
		$sale_ids = function_exists( 'wc_get_product_ids_on_sale' ) ? wc_get_product_ids_on_sale() : [];
		if ( ! empty( $sale_ids ) ) {
			$query_args['post__in'] = $sale_ids;
		} else {
			// Fallback: meta query for products with active sale price.
			$query_args['meta_query'] = [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'relation' => 'AND',
				[
					'key'     => '_sale_price',
					'value'   => '',
					'compare' => '!=',
				],
				[
					'key'     => '_sale_price',
					'value'   => '0',
					'compare' => '>',
					'type'    => 'NUMERIC',
				],
			];
		}
		break;

	case 'all':
	default:
		break;
}

// ---------------------------------------------------------------------------
// Query products.
// ---------------------------------------------------------------------------
$products = get_posts( $query_args );

// Image sizing — auto uses a proportional height; named ratios use
// aspect-ratio instead. Height is always explicit so the ratio wins.
$card_img_style = '';
if ( 'auto' === $image_ratio ) {
	$card_img_height = (int) round( $card_width * 0.625 ); // 16:10-ish.
	$card_img_style .= '--card-img-height:' . $card_img_height . 'px;';
} else {
	$ratio_value = [ '16-9' => '16/9', '4-3' => '4/3', '1-1' => '1/1' ][ $image_ratio ] ?? '';
	if ( '' !== $ratio_value ) {
		$card_img_style .= '--card-img-height:auto;--card-img-ratio:' . $ratio_value . ';';
	}
}

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class'         => 'beplus-vmn-product-card',
		'data-autoplay' => $autoplay ? 'true' : 'false',
		'data-delay'    => (string) $autoplay_delay,
		'style'         => '--card-width:' . $card_width . 'px;' . $card_img_style,
	]
);

if ( empty( $products ) ) {
	printf(
		'<div %s><p class="beplus-vmn-product-card__empty">%s</p></div>',
		$wrapper_attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		esc_html__( 'No products found.', 'beplus-visual-mega-nav' )
	);
	return;
}

// ---------------------------------------------------------------------------
// Enqueue GSAP vendor asset.
//
// view.js (block.json viewScript) is enqueued automatically when this block
// renders, but it cannot import this library — plain vanilla JS. Enqueue it
// here so it loads exactly when the carousel renders (works inside mega menu
// panels too, where a wp_enqueue_scripts + has_block() check could not detect
// blocks stored in nav-menu meta).
// ---------------------------------------------------------------------------
$gsap_js = BEPLUS_VISUAL_MEGA_NAV_DIR . 'assets/vendor/gsap/gsap.min.js';
wp_register_script(
	'beplus-vmn-gsap',
	BEPLUS_VISUAL_MEGA_NAV_URL . 'assets/vendor/gsap/gsap.min.js',
	[],
	(string) filemtime( $gsap_js ),
	true
);
wp_enqueue_script( 'beplus-vmn-gsap' );

// ---------------------------------------------------------------------------
// Render card carousel.
// ---------------------------------------------------------------------------
$output = sprintf( '<div %s>', $wrapper_attributes );
$output .= '<div class="beplus-vmn-product-card__deck">';
$output .= '<div class="beplus-vmn-product-card__carousel">';
$output .= '<div class="beplus-vmn-product-card__track">';

foreach ( $products as $post_item ) {
	$product_id   = $post_item->ID;
	$product      = wc_get_product( $product_id );
	$product_name = get_the_title( $post_item );
	$product_url  = get_permalink( $post_item );

	if ( ! $product instanceof \WC_Product ) {
		continue;
	}

	// Image (woocommerce_single size).
	$image_html = '';
	$image_url  = '';
	$thumbnail_id = get_post_thumbnail_id( $product_id );
	if ( $thumbnail_id ) {
		$src = wp_get_attachment_image_src( $thumbnail_id, 'woocommerce_single' );
		if ( is_array( $src ) && ! empty( $src[0] ) ) {
			$image_url = $src[0];
		}
	}
	// Fallback to WooCommerce placeholder.
	if ( '' === $image_url ) {
		$image_url = function_exists( 'wc_placeholder_img_src' )
			? wc_placeholder_img_src( 'woocommerce_single' )
			: '';
	}
	if ( '' !== $image_url ) {
		$image_html = sprintf(
			'<div class="beplus-vmn-product-card__image"><img src="%s" alt="%s" loading="lazy" /></div>',
			esc_url( $image_url ),
			esc_attr( $product_name )
		);
	}

	// Title.
	$title_html = '';
	if ( $show_title ) {
		$title_html = sprintf(
			'<h3 class="beplus-vmn-product-card__title"><a href="%s">%s</a></h3>',
			esc_url( $product_url ),
			esc_html( $product_name )
		);
	}

	// Price.
	$price_html = '';
	if ( $show_price ) {
		$price_html = sprintf(
			'<div class="beplus-vmn-product-card__price">%s</div>',
			$product->get_price_html() // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — WC returns escaped HTML.
		);
	}

	// Rating.
	$rating_html = '';
	if ( $show_rating ) {
		$rating_count = $product->get_rating_count();
		$average      = $product->get_average_rating();

		if ( $rating_count > 0 ) {
			$star_width  = ( $average / 5 ) * 100;
			$rating_html = sprintf(
				'<div class="beplus-vmn-product-card__rating" aria-label="%s">
					<span class="beplus-vmn-product-card__rating-stars">
						<span class="beplus-vmn-product-card__rating-stars-empty">★★★★★</span>
						<span class="beplus-vmn-product-card__rating-stars-filled" style="width:%d%%">★★★★★</span>
					</span>
					<span class="beplus-vmn-product-card__rating-count">(%d)</span>
				</div>',
				/* translators: %1$d rating, %2$d total. */
				esc_attr( sprintf( __( 'Rated %1$.1f out of 5 based on %2$d reviews', 'beplus-visual-mega-nav' ), $average, $rating_count ) ),
				absint( $star_width ),
				absint( $rating_count )
			);
		}
	}

	// Add to cart.
	$cart_html = '';
	if ( $show_add_to_cart ) {
		$cart_html = sprintf(
			'<a href="%s" class="beplus-vmn-product-card__add-to-cart" data-product_id="%d">%s</a>',
			esc_url( $product->add_to_cart_url() ),
			absint( $product_id ),
			esc_html( $product->add_to_cart_text() )
		);
	}

	$output .= '<div class="beplus-vmn-product-card__slide">';
	$output .= '<div class="beplus-vmn-product-card__card">';
	$output .= $image_html;
	$output .= '<div class="beplus-vmn-product-card__content">';
	$output .= $title_html;
	$output .= $price_html;
	$output .= $rating_html;
	$output .= $cart_html;
	$output .= '</div>'; // .beplus-vmn-product-card__content
	$output .= '</div>'; // .beplus-vmn-product-card__card
	$output .= '</div>'; // .beplus-vmn-product-card__slide
}

$output .= '</div>'; // .beplus-vmn-product-card__track

// Prev / next arrow buttons.
$output .= '<button type="button" class="beplus-vmn-product-card__arrow beplus-vmn-product-card__arrow--prev" aria-label="' . esc_attr__( 'Previous product', 'beplus-visual-mega-nav' ) . '">';
$output .= '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 18l-6-6 6-6"/></svg>';
$output .= '</button>';

$output .= '<button type="button" class="beplus-vmn-product-card__arrow beplus-vmn-product-card__arrow--next" aria-label="' . esc_attr__( 'Next product', 'beplus-visual-mega-nav' ) . '">';
$output .= '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6"/></svg>';
$output .= '</button>';

// Dot navigation — one per slide.
$output .= '<div class="beplus-vmn-product-card__dots">';
foreach ( $products as $index => $post_item ) {
	$output .= sprintf(
		'<button type="button" class="beplus-vmn-product-card__dot" data-index="%d" aria-label="%s"></button>',
		absint( $index ),
		/* translators: %d: slide number (1-based). */
		esc_attr( sprintf( __( 'Go to slide %d', 'beplus-visual-mega-nav' ), absint( $index ) + 1 ) )
	);
}
$output .= '</div>'; // .beplus-vmn-product-card__dots

$output .= '</div>'; // .beplus-vmn-product-card__carousel
$output .= '</div>'; // .beplus-vmn-product-card__deck
$output .= '</div>'; // .beplus-vmn-product-card

echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
