<?php
/**
 * Product List block — frontend markup.
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
	$wrapper = get_block_wrapper_attributes( [ 'class' => 'beplus-vmn-product-list' ] );
	printf(
		'<div %s><p class="beplus-vmn-product-list__empty">%s</p></div>',
		$wrapper, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		esc_html__( 'WooCommerce is required to display products.', 'beplus-visual-mega-nav' )
	);
	return;
}

// ---------------------------------------------------------------------------
// Extract and sanitize attributes.
// ---------------------------------------------------------------------------
$posts_to_show     = isset( $attributes['postsToShow'] ) ? max( 1, min( 12, absint( $attributes['postsToShow'] ) ) ) : 4;
$show_image        = isset( $attributes['showImage'] ) ? (bool) $attributes['showImage'] : true;
$show_price        = isset( $attributes['showPrice'] ) ? (bool) $attributes['showPrice'] : true;
$show_rating       = isset( $attributes['showRating'] ) ? (bool) $attributes['showRating'] : false;
$show_add_to_cart  = isset( $attributes['showAddToCart'] ) ? (bool) $attributes['showAddToCart'] : false;
$filter_by         = isset( $attributes['filterBy'] ) ? sanitize_text_field( (string) $attributes['filterBy'] ) : 'all';

// Order by — whitelist WC-compatible values.
$order_by         = isset( $attributes['orderBy'] ) ? sanitize_text_field( (string) $attributes['orderBy'] ) : 'date';
$allowed_order_by = [ 'date', 'title', 'price', 'rand', 'popularity', 'rating' ];
if ( ! in_array( $order_by, $allowed_order_by, true ) ) {
	$order_by = 'date';
}

// Sort order.
$sort_order = isset( $attributes['order'] ) ? strtoupper( sanitize_text_field( (string) $attributes['order'] ) ) : 'DESC';
if ( ! in_array( $sort_order, [ 'ASC', 'DESC' ], true ) ) {
	$sort_order = 'DESC';
}

// ---------------------------------------------------------------------------
// Build WP_Query args.
// ---------------------------------------------------------------------------
$query_args = [
	'post_type'           => 'product',
	'post_status'         => 'publish',
	'posts_per_page'      => $posts_to_show,
	'order'               => $sort_order,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
];

// Map orderBy to WC-compatible query values.
switch ( $order_by ) {
	case 'price':
		$query_args['orderby']  = 'meta_value_num';
		$query_args['meta_key'] = '_price'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		break;
	case 'popularity':
		$query_args['orderby']  = 'meta_value_num';
		$query_args['meta_key'] = 'total_sales'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		break;
	case 'rating':
		$query_args['orderby']  = 'meta_value_num';
		$query_args['meta_key'] = '_wc_average_rating'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		break;
	case 'title':
		$query_args['orderby'] = 'title';
		break;
	case 'rand':
		$query_args['orderby'] = 'rand';
		break;
	case 'date':
	default:
		$query_args['orderby'] = 'date';
		break;
}

// ---------------------------------------------------------------------------
// Apply filterBy.
// ---------------------------------------------------------------------------
switch ( $filter_by ) {
	case 'category':
		$category_ids = [];
		if ( isset( $attributes['productCategories'] ) && is_array( $attributes['productCategories'] ) ) {
			$category_ids = array_filter( array_map( 'absint', $attributes['productCategories'] ), static function ( int $id ): bool {
				return $id > 0;
			} );
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
			$tag_ids = array_filter( array_map( 'absint', $attributes['productTags'] ), static function ( int $id ): bool {
				return $id > 0;
			} );
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
			$ids = array_filter( array_map( 'absint', explode( ',', $ids_string ) ), static function ( int $id ): bool {
				return $id > 0;
			} );
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

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'beplus-vmn-product-list',
	]
);

if ( empty( $products ) ) {
	printf(
		'<div %s><p class="beplus-vmn-product-list__empty">%s</p></div>',
		$wrapper_attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		esc_html__( 'No products found.', 'beplus-visual-mega-nav' )
	);
	return;
}

// ---------------------------------------------------------------------------
// Render product list.
// ---------------------------------------------------------------------------
$output = sprintf( '<div %s><ul class="beplus-vmn-product-list__items">', $wrapper_attributes );

foreach ( $products as $index => $post_item ) {
	$product_id   = $post_item->ID;
	$product      = wc_get_product( $product_id );
	$product_name = get_the_title( $post_item );
	$product_url  = get_permalink( $post_item );

	if ( ! $product instanceof \WC_Product ) {
		continue;
	}

	// Thumbnail.
	$image_html = '';
	if ( $show_image ) {
		$thumbnail_id  = get_post_thumbnail_id( $product_id );
		$thumbnail_url = '';
		if ( $thumbnail_id ) {
			$thumb = wp_get_attachment_image_src( $thumbnail_id, 'thumbnail' );
			if ( is_array( $thumb ) && ! empty( $thumb[0] ) ) {
				$thumbnail_url = $thumb[0];
			}
		}
		// Fallback to WooCommerce placeholder.
		if ( '' === $thumbnail_url ) {
			$thumbnail_url = function_exists( 'wc_placeholder_img_src' )
				? wc_placeholder_img_src( 'thumbnail' )
				: '';
		}
		if ( '' !== $thumbnail_url ) {
			$image_html = sprintf(
				'<div class="beplus-vmn-product-list__thumb"><img src="%s" alt="%s" loading="lazy" width="56" height="56" /></div>',
				esc_url( $thumbnail_url ),
				esc_attr( $product_name )
			);
		}
	}

	// Price.
	$price_html = '';
	if ( $show_price && $product instanceof \WC_Product ) {
		$price_html = sprintf(
			'<span class="beplus-vmn-product-list__price">%s</span>',
			$product->get_price_html() // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — WC returns escaped HTML.
		);
	}

	// Rating.
	$rating_html = '';
	if ( $show_rating && $product instanceof \WC_Product ) {
		$rating_count = $product->get_rating_count();
		$average      = $product->get_average_rating();

		if ( $rating_count > 0 ) {
			$star_width = ( $average / 5 ) * 100;
			$rating_html = sprintf(
				'<div class="beplus-vmn-product-list__rating" aria-label="%s">
					<span class="beplus-vmn-product-list__rating-stars">
						<span class="beplus-vmn-product-list__rating-stars-empty">★★★★★</span>
						<span class="beplus-vmn-product-list__rating-stars-filled" style="width:%d%%">★★★★★</span>
					</span>
					<span class="beplus-vmn-product-list__rating-count">(%d)</span>
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
	if ( $show_add_to_cart && $product instanceof \WC_Product ) {
		$add_to_cart_url = $product->add_to_cart_url();
		$cart_text       = $product->add_to_cart_text();

		$cart_html = sprintf(
			'<a href="%s" class="beplus-vmn-product-list__add-to-cart" data-product_id="%d">%s</a>',
			esc_url( $add_to_cart_url ),
			absint( $product_id ),
			esc_html( $cart_text )
		);
	}

	// Build bottom row: price + rating + cart.
	$bottom_parts = [];
	if ( '' !== $price_html ) {
		$bottom_parts[] = $price_html;
	}
	if ( '' !== $rating_html ) {
		$bottom_parts[] = $rating_html;
	}
	if ( '' !== $cart_html ) {
		$bottom_parts[] = $cart_html;
	}
	$bottom_html = '';
	if ( ! empty( $bottom_parts ) ) {
		$bottom_html = '<div class="beplus-vmn-product-list__bottom">' . implode( '', $bottom_parts ) . '</div>';
	}

	$stagger_delay = $index * 60;

	$li_attrs = sprintf(
		'class="beplus-vmn-product-list__item" style="--beplus-vmn-enter-delay:%dms"',
		$stagger_delay
	);

	$output .= sprintf(
		'<li %s>'
			. '<a href="%s" class="beplus-vmn-product-list__link">'
				. '%s'
				. '<div class="beplus-vmn-product-list__body">'
					. '<span class="beplus-vmn-product-list__title">%s</span>'
					. '%s'
				. '</div>'
			. '</a>'
		. '</li>',
		$li_attrs,
		esc_url( $product_url ),
		$image_html,
		esc_html( $product_name ),
		$bottom_html
	);
}

$output .= '</ul></div>';

echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — all dynamic values escaped above.

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
