<?php
/**
 * Registers block patterns for Snap Mega Menu blocks.
 *
 * @package Snap\MegaMenuBuilder\Patterns
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Patterns;

/**
 * Block pattern registration.
 */
final class PatternRegistry {

	/**
	 * Hook pattern registration.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'init', [ $this, 'register_patterns' ] );
	}

	/**
	 * Register built-in block patterns.
	 *
	 * @return void
	 */
	public function register_patterns(): void {
		if ( ! function_exists( 'register_block_pattern' ) ) {
			return;
		}

		register_block_pattern(
			'snap-megamenu/header-logo-menu-toggle',
			[
				'title'       => __( 'Snap Header — Logo / Menu / Toggle', 'snap-megamenu-builder' ),
				'description' => __( 'A header with site logo, classic navigation menu, and a mobile hamburger toggle.', 'snap-megamenu-builder' ),
				'categories'  => [ 'header' ],
				'content'     => $this->get_pattern_content(),
			]
		);

		register_block_pattern(
			'snap-megamenu/header-centered',
			[
				'title'       => __( 'Snap Header — Centered Logo + Nav Below', 'snap-megamenu-builder' ),
				'description' => __( 'Centered site logo with navigation menu stacked below, plus mobile toggle.', 'snap-megamenu-builder' ),
				'categories'  => [ 'header' ],
				'content'     => $this->get_centered_header_content(),
			]
		);
	}

	/**
	 * Get the block markup for the default header pattern.
	 *
	 * @return string
	 */
	private function get_pattern_content(): string {
		return sprintf(
			'<!-- wp:snap-megamenu/snap-header {"sticky":true,"mobileBreakpoint":782,"layout":{"type":"flex","justifyContent":"space-between","verticalAlignment":"center"}} -->
			<div class="wp-block-snap-megamenu-snap-header is-sticky"><!-- wp:site-logo /-->

			<!-- wp:snap-megamenu/snap-navigation {"layout":{"type":"flex","justifyContent":"right"}} -->
			<div class="wp-block-snap-megamenu-snap-navigation"><!-- wp:snap-megamenu/nav-menu-area /-->

			<!-- wp:snap-megamenu/nav-toggle /--></div>
			<!-- /wp:snap-megamenu/snap-navigation --></div>
			<!-- /wp:snap-megamenu/snap-header -->'
		);
	}

	/**
	 * Get the block markup for the centered header pattern.
	 *
	 * @return string
	 */
	private function get_centered_header_content(): string {
		return sprintf(
			'<!-- wp:snap-megamenu/snap-header {"sticky":true,"mobileBreakpoint":782,"layout":{"type":"flex","orientation":"vertical","justifyContent":"center","verticalAlignment":"center"}} -->
			<div class="wp-block-snap-megamenu-snap-header is-sticky"><!-- wp:site-logo {"align":"center"} /-->

			<!-- wp:snap-megamenu/snap-navigation {"layout":{"type":"flex","justifyContent":"center"}} -->
			<div class="wp-block-snap-megamenu-snap-navigation"><!-- wp:snap-megamenu/nav-menu-area /-->

			<!-- wp:snap-megamenu/nav-toggle /--></div>
			<!-- /wp:snap-megamenu/snap-navigation --></div>
			<!-- /wp:snap-megamenu/snap-header -->'
		);
	}
}
