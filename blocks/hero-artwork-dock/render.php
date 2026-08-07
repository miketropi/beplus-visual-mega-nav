<?php
/**
 * Hero Artwork Dock block — frontend markup.
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

$enabled = isset( $attributes['enabled'] ) ? (bool) $attributes['enabled'] : true;

$artwork_height     = isset( $attributes['artworkHeight'] ) ? absint( $attributes['artworkHeight'] ) : 300;
$visible_percentage = isset( $attributes['visiblePercentage'] ) ? absint( $attributes['visiblePercentage'] ) : 50;
$overlap            = isset( $attributes['overlap'] ) ? absint( $attributes['overlap'] ) : 30;
$hover_motion       = isset( $attributes['hoverMotion'] ) ? (bool) $attributes['hoverMotion'] : true;
$floating           = isset( $attributes['floatingAnimation'] ) ? (bool) $attributes['floatingAnimation'] : true;
$perspective        = isset( $attributes['perspectiveStrength'] ) ? absint( $attributes['perspectiveStrength'] ) : 800;

$visible_percentage = max( 30, min( 70, $visible_percentage ) );
$overlap            = max( 0, min( 80, $overlap ) );
$perspective        = max( 400, min( 2000, $perspective ) );

$cards = isset( $attributes['cards'] ) && is_array( $attributes['cards'] ) ? $attributes['cards'] : [];

$instance_id = wp_unique_id( 'hero-' );

$container_classes = [
	'wp-block-beplus-visual-mega-nav-hero-artwork-dock',
	'beplus-hero-' . $instance_id,
];

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class'         => implode( ' ', $container_classes ),
		'data-instance' => $instance_id,
	]
);

// Build artwork inline style.
$artwork_style  = '--beplus-hero-artwork-height:' . $artwork_height . 'px;';
$artwork_style .= '--beplus-hero-visible-pct:' . $visible_percentage . ';';
$artwork_style .= '--beplus-hero-perspective:' . $perspective . 'px;';

$artwork_data  = ' data-instance="' . esc_attr( $instance_id ) . '"';
$artwork_data .= ' data-hover="' . ( $hover_motion ? '1' : '0' ) . '"';
$artwork_data .= ' data-floating="' . ( $floating ? '1' : '0' ) . '"';
$artwork_data .= ' data-perspective="' . esc_attr( (string) $perspective ) . '"';

// Build card HTML.
$cards_html = '';
$card_count = count( $cards );

foreach ( $cards as $index => $card ) {
	if ( ! is_array( $card ) ) {
		continue;
	}

	$card_image_id  = isset( $card['imageId'] ) ? absint( $card['imageId'] ) : 0;
	$card_image_url = isset( $card['imageUrl'] ) ? esc_url( (string) $card['imageUrl'] ) : '';
	$card_width     = isset( $card['width'] ) ? absint( $card['width'] ) : 200;
	$card_rotation  = isset( $card['rotation'] ) ? (float) $card['rotation'] : 0;
	$card_depth     = isset( $card['depth'] ) ? absint( $card['depth'] ) : 0;
	$card_id        = isset( $card['id'] ) ? sanitize_html_class( (string) $card['id'] ) : 'card-' . $index;

	// Resolve image URL — prefer attachment ID for permalink stability.
	if ( $card_image_id > 0 ) {
		$resolved_url = wp_get_attachment_image_url( $card_image_id, 'large' );
		if ( $resolved_url ) {
			$card_image_url = esc_url( $resolved_url );
		}
	}

	$card_width    = max( 120, min( 400, $card_width ) );
	$card_rotation = max( -15, min( 15, $card_rotation ) );

	// Center-grouped layout: cards fan out symmetrically from the middle.
	// Middle card is the hero — slightly taller, highest z-index.
	$mid_index       = (int) floor( $card_count / 2 );
	$distance_center = $index - $mid_index;
	// Card spread spacing — percentage separation between adjacent
	// cards in the fan layout. Must match edit.js (CARD_SPACING = 13).
	$spacing           = 13;
	$spread_percentage = 50 + $distance_center * $spacing;

	// z-index: highest at center, fanning out symmetrically.
	$card_z_index = $mid_index + 1 - abs( $distance_center );

	$card_style  = '--beplus-hero-card-width:' . $card_width . 'px;';
	$card_style .= '--beplus-hero-card-rotation:' . $card_rotation . 'deg;';
	$card_style .= '--beplus-hero-card-depth:' . $card_depth . ';';
	$card_style .= 'left:' . esc_attr( (string) $spread_percentage ) . '%;';
	$card_style .= 'z-index:' . esc_attr( (string) $card_z_index ) . ';';

	// Center card (hero) is taller.
	$is_center   = ( 0 === $distance_center );
	$card_height = $is_center
		? 'calc(var(--beplus-hero-artwork-height) + 90px)'
		: 'calc(var(--beplus-hero-artwork-height) + 60px)';
	$card_style .= 'height:' . $card_height . ';';

	// Bottom offset: cards peek from the bottom by visiblePercentage.
	// The artwork container clips at the bottom so we offset cards up.
	$clip_offset = $artwork_height * ( ( 100 - $visible_percentage ) / 100 );
	// Center card also gets a slight bottom boost so its extra height doesn't push it down.
	$bottom_offset = $is_center ? $clip_offset + 15 : $clip_offset;
	$depth_shift   = $card_depth * 5; // depth affects vertical stagger.
	$card_style   .= 'bottom:-' . esc_attr( (string) $bottom_offset ) . 'px;';
	$card_style   .= 'margin-bottom:' . esc_attr( (string) $depth_shift ) . 'px;';

	if ( '' !== $card_image_url ) {
		$card_style .= 'background-image:url(' . $card_image_url . ');';
	} else {
		// Fallback gradient when no image is set — keeps the stack visible.
		// Palette shifts per card for a curated look.
		$gradients      = [
			'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 40%, #93c5fd 100%)',
			'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 40%, #c4b5fd 100%)',
			'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 40%, #f9a8d4 100%)',
			'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 40%, #6ee7b7 100%)',
			'linear-gradient(135deg, #ffedd5 0%, #fed7aa 40%, #fdba74 100%)',
		];
		$gradient_index = $index % count( $gradients );
		$card_style    .= 'background-image:' . $gradients[ $gradient_index ] . ';';
	}

	$card_data  = ' data-card-id="' . esc_attr( $card_id ) . '"';
	$card_data .= ' data-depth="' . esc_attr( (string) $card_depth ) . '"';
	$card_data .= ' data-rotation="' . esc_attr( (string) $card_rotation ) . '"';
	$card_data .= ' data-width="' . esc_attr( (string) $card_width ) . '"';

	$cards_html .= sprintf(
		'<div class="beplus-hero-card" style="%s"%s></div>',
		$card_style,
		$card_data
	);
}

?>
<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() returns pre-escaped attributes. ?>>
	<div class="beplus-hero-content">
		<?php echo wp_kses_post( $content ); ?>
	</div>

	<?php if ( $enabled && '' !== $cards_html ) : ?>
		<div
			class="beplus-hero-artwork"
			style="<?php echo esc_attr( $artwork_style ); ?>"
			<?php echo $artwork_data; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- all values escaped above. ?>
		>
			<?php echo $cards_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- all values escaped in card loop above. ?>
		</div>
	<?php endif; ?>
</section>

<?php
// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
