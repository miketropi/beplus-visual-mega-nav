<?php
/**
 * Renders the Link Item block on the frontend.
 *
 * @package Snap\MegaMenuBuilder\Blocks
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Blocks;

/**
 * Dynamic output for snap-megamenu/link-item.
 */
final class LinkItemRenderer {

	/**
	 * Render block HTML.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @param \WP_Block|null       $block      Block instance.
	 * @return string
	 */
	public static function render( array $attributes, ?\WP_Block $block = null ): string {
		$attributes = wp_parse_args(
			$attributes,
			[
				'label'        => '',
				'url'          => '',
				'id'           => 0,
				'kind'         => '',
				'type'         => '',
				'opensInNewTab' => false,
				'rel'          => '',
				'description'  => '',
				'badge'        => '',
				'badgeVariant' => 'default',
			]
		);

		/**
		 * Filter Link Item attributes before render.
		 *
		 * @param array<string, mixed> $attributes Block attributes.
		 * @param \WP_Block|null       $block      Block instance.
		 */
		$attributes = apply_filters( 'snap_megamenu_link_item_attributes', $attributes, $block );

		$label        = sanitize_text_field( (string) $attributes['label'] );
		$url          = (string) $attributes['url'];
		$id           = absint( $attributes['id'] );
		$type         = sanitize_key( (string) $attributes['type'] );
		$description  = sanitize_text_field( (string) $attributes['description'] );
		$badge        = sanitize_text_field( (string) $attributes['badge'] );
		$badge_variant = self::sanitize_badge_variant( (string) $attributes['badgeVariant'] );
		$opens_new    = (bool) $attributes['opensInNewTab'];
		$extra_rel    = sanitize_text_field( (string) $attributes['rel'] );

		if ( $id > 0 && 'custom' !== $type ) {
			$permalink = get_permalink( $id );
			if ( is_string( $permalink ) && '' !== $permalink ) {
				$url = $permalink;
			}
		}

		$url = esc_url( $url );

		$wrapper_class = sprintf(
			'snap-megamenu-link-item snap-megamenu-link-item--badge-%s',
			esc_attr( $badge_variant )
		);

		$wrapper_attributes = function_exists( 'get_block_wrapper_attributes' )
			? get_block_wrapper_attributes( [ 'class' => $wrapper_class ] )
			: sprintf( 'class="%s"', esc_attr( $wrapper_class ) );

		$markup = sprintf( '<div %s>', $wrapper_attributes );

		if ( '' !== $url ) {
			$rel_parts = array_filter(
				array_map(
					'trim',
					preg_split( '/\s+/', $extra_rel ) ?: []
				)
			);

			if ( $opens_new ) {
				$rel_parts[] = 'noopener';
				$rel_parts[] = 'noreferrer';
			}

			$rel = implode( ' ', array_unique( $rel_parts ) );

			if ( function_exists( 'wp_rel_uristring' ) && '' !== $rel ) {
				$rel = wp_rel_uristring( $rel );
			}

			$link_attrs = [
				'class' => 'snap-megamenu-link-item__link',
				'href'  => $url,
			];

			if ( $opens_new ) {
				$link_attrs['target'] = '_blank';
			}

			if ( '' !== $rel ) {
				$link_attrs['rel'] = $rel;
			}

			if ( '' === $label ) {
				$link_attrs['aria-label'] = $url;
			}

			$markup .= sprintf( '<a %s>', self::build_html_attributes( $link_attrs ) );
			$markup .= sprintf(
				'<span class="snap-megamenu-link-item__label">%s</span>',
				esc_html( $label )
			);

			if ( '' !== $badge ) {
				$markup .= sprintf(
					'<span class="snap-megamenu-link-item__badge" aria-hidden="true">%s</span>',
					esc_html( $badge )
				);
			}

			if ( $opens_new && '' !== $label ) {
				$markup .= sprintf(
					'<span class="screen-reader-text">%s</span>',
					esc_html__( '(opens in a new tab)', 'snap-megamenu-builder' )
				);
			}

			$markup .= '</a>';
		} else {
			$markup .= sprintf(
				'<span class="snap-megamenu-link-item__label snap-megamenu-link-item__label--placeholder">%s</span>',
				esc_html( $label ?: __( 'Link Item', 'snap-megamenu-builder' ) )
			);
		}

		if ( '' !== $description ) {
			$markup .= sprintf(
				'<p class="snap-megamenu-link-item__description">%s</p>',
				esc_html( $description )
			);
		}

		$markup .= '</div>';

		/**
		 * Filter rendered Link Item HTML.
		 *
		 * @param string               $markup     Rendered HTML.
		 * @param array<string, mixed> $attributes Block attributes.
		 * @param \WP_Block|null       $block      Block instance.
		 */
		return (string) apply_filters( 'snap_megamenu_link_item_render_markup', $markup, $attributes, $block );
	}

	/**
	 * @param string $variant Badge variant slug.
	 * @return string
	 */
	private static function sanitize_badge_variant( string $variant ): string {
		$allowed = [ 'default', 'accent', 'muted', 'outline' ];

		/**
		 * Filter allowed badge variant slugs.
		 *
		 * @param string[] $allowed Variant slugs.
		 */
		$allowed = apply_filters( 'snap_megamenu_link_item_badge_variants', $allowed );

		if ( ! is_array( $allowed ) ) {
			$allowed = [ 'default', 'accent', 'muted', 'outline' ];
		}

		return in_array( $variant, $allowed, true ) ? $variant : 'default';
	}

	/**
	 * Build HTML attribute string from key/value pairs.
	 *
	 * @param array<string, string> $attributes Attribute map.
	 * @return string
	 */
	private static function build_html_attributes( array $attributes ): string {
		$parts = [];

		foreach ( $attributes as $name => $value ) {
			if ( '' === $value ) {
				continue;
			}

			$parts[] = sprintf(
				'%s="%s"',
				esc_attr( $name ),
				'href' === $name ? esc_url( $value ) : esc_attr( $value )
			);
		}

		return implode( ' ', $parts );
	}
}
