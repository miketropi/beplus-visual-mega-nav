<?php
/**
 * Blog List block — frontend markup.
 *
 * @package Beplus\VisualMegaNav\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var WP_Block             $block      Block instance.
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
	$attributes = [];
}

$posts_to_show  = isset( $attributes['postsToShow'] ) ? max( 1, min( 10, absint( $attributes['postsToShow'] ) ) ) : 5;
$show_thumbnail = isset( $attributes['showThumbnail'] ) ? (bool) $attributes['showThumbnail'] : true;
$show_date      = isset( $attributes['showDate'] ) ? (bool) $attributes['showDate'] : true;
$show_category  = isset( $attributes['showCategory'] ) ? (bool) $attributes['showCategory'] : false;
$show_excerpt   = isset( $attributes['showExcerpt'] ) ? (bool) $attributes['showExcerpt'] : false;
$show_author    = isset( $attributes['showAuthor'] ) ? (bool) $attributes['showAuthor'] : false;

$order_by         = isset( $attributes['orderBy'] ) ? (string) $attributes['orderBy'] : 'date';
$allowed_order_by = [ 'date', 'title', 'rand' ];
if ( ! in_array( $order_by, $allowed_order_by, true ) ) {
	$order_by = 'date';
}

$sort_order = isset( $attributes['order'] ) ? strtoupper( (string) $attributes['order'] ) : 'DESC';
if ( ! in_array( $sort_order, [ 'ASC', 'DESC' ], true ) ) {
	$sort_order = 'DESC';
}

$query_args = [
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => $posts_to_show,
	'orderby'             => $order_by,
	'order'               => $sort_order,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
];

// Filter by selected categories (empty array = all categories).
if ( isset( $attributes['categories'] ) && is_array( $attributes['categories'] ) ) {
	$category_ids = array_filter(
		array_map( 'absint', $attributes['categories'] ),
		static function ( int $id ): bool {
			return $id > 0;
		}
	);
	if ( ! empty( $category_ids ) ) {
		$query_args['category__in'] = $category_ids;
	}
}

$blog_posts = get_posts( $query_args );

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'beplus-vmn-blog-list',
		'style' => '--beplus-bl-thumb-w:220px;--beplus-bl-thumb-h:140px;',
	]
);

if ( empty( $blog_posts ) ) {
	printf(
		'<div %s><p class="beplus-vmn-blog-list__empty">%s</p></div>',
		$wrapper_attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		esc_html__( 'No posts found.', 'beplus-visual-mega-nav' )
	);
	return;
}

$output = sprintf( '<div %s><ul class="beplus-vmn-blog-list__items">', $wrapper_attributes );

foreach ( $blog_posts as $index => $post_item ) {
	$post_title   = get_the_title( $post_item );
	$post_url     = get_permalink( $post_item );
	$post_date    = $show_date ? get_the_date( '', $post_item ) : '';
	$post_excerpt = $show_excerpt ? get_the_excerpt( $post_item ) : '';
	$post_author  = $show_author ? get_the_author_meta( 'display_name', $post_item->post_author ) : '';

	$categories = [];
	if ( $show_category ) {
		$cats = get_the_category( $post_item->ID );
		if ( ! empty( $cats ) ) {
			$categories = wp_list_pluck( $cats, 'name' );
		}
	}

	// Resolve larger thumbnail URL for the floating hover preview.
	$float_thumb_url = '';
	$thumb_id        = get_post_thumbnail_id( $post_item );
	if ( $thumb_id ) {
		$float_thumb_url = wp_get_attachment_image_url( $thumb_id, 'medium' );
		if ( ! $float_thumb_url ) {
			$float_thumb_url = wp_get_attachment_image_url( $thumb_id, 'large' );
		}
		if ( ! $float_thumb_url ) {
			$float_thumb_url = (string) wp_get_attachment_image_url( $thumb_id, 'full' );
		}
	}

	$data_thumbnail_attr = '';
	if ( '' !== $float_thumb_url ) {
		$data_thumbnail_attr = ' data-thumbnail="' . esc_url( $float_thumb_url ) . '"';
	}

	$thumbnail = '';
	if ( $show_thumbnail ) {
		if ( $thumb_id ) {
			$thumb_url = wp_get_attachment_image_url( $thumb_id, 'thumbnail' );
			if ( $thumb_url ) {
				$thumbnail = sprintf(
					'<div class="beplus-vmn-blog-list__thumb"><img src="%s" alt="%s" loading="lazy" width="56" height="56" /></div>',
					esc_url( $thumb_url ),
					esc_attr( $post_title )
				);
			}
		}
	}

	$meta_parts = [];
	if ( '' !== $post_date ) {
		$meta_parts[] = sprintf(
			'<time class="beplus-vmn-blog-list__date" datetime="%s">%s</time>',
			esc_attr( get_the_date( 'c', $post_item ) ),
			esc_html( $post_date )
		);
	}
	if ( ! empty( $categories ) ) {
		$cat_labels = [];
		foreach ( $categories as $category_name ) {
			$cat_labels[] = sprintf(
				'<span class="beplus-vmn-blog-list__category">%s</span>',
				esc_html( $category_name )
			);
		}
		$meta_parts[] = '<span class="beplus-vmn-blog-list__cats">' . implode( ', ', $cat_labels ) . '</span>';
	}
	if ( '' !== $post_author ) {
		$meta_parts[] = sprintf(
			'<span class="beplus-vmn-blog-list__author">%s</span>',
			esc_html( $post_author )
		);
	}

	$meta_html = '';
	if ( ! empty( $meta_parts ) ) {
		$meta_html = '<div class="beplus-vmn-blog-list__meta">' . implode( ' · ', $meta_parts ) . '</div>';
	}

	$excerpt_html = '';
	if ( '' !== $post_excerpt ) {
		$excerpt_html = sprintf(
			'<p class="beplus-vmn-blog-list__excerpt">%s</p>',
			esc_html( wp_trim_words( $post_excerpt, 12, '…' ) )
		);
	}

	$stagger_delay = $index * 60;

	$li_attrs = sprintf(
		'class="beplus-vmn-blog-list__item" style="--beplus-vmn-enter-delay:%dms"%s',
		$stagger_delay,
		$data_thumbnail_attr
	);

	$output .= sprintf(
		'<li %s>'
			. '<a href="%s" class="beplus-vmn-blog-list__link">'
				. '%s'
				. '<div class="beplus-vmn-blog-list__body">'
					. '<span class="beplus-vmn-blog-list__title">%s</span>'
					. '%s'
					. '%s'
				. '</div>'
			. '</a>'
		. '</li>',
		$li_attrs,
		esc_url( $post_url ),
		$thumbnail,
		esc_html( $post_title ),
		$meta_html,
		$excerpt_html
	);
}

$output .= '</ul>'
	. '<img class="beplus-blog-list-float-thumb" src="" alt="" aria-hidden="true" '
	. 'width="220" height="140" loading="eager" />'
	. '</div>';

echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- all dynamic values escaped above.

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
