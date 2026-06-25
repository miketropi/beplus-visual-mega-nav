<?php
/**
 * Registers header block patterns from the plugin's parts/ directory.
 *
 * @package Snap\MegaMenuBuilder\Templates
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Templates;

/**
 * Registers plugin header layouts as block patterns.
 */
final class PatternProvider {

	/**
	 * Pattern category slug.
	 */
	private const CATEGORY = 'snap-megamenu';

	/**
	 * Hook into the block patterns system.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'init', [ $this, 'register_category' ] );
		add_action( 'init', [ $this, 'register_patterns' ] );
	}

	/**
	 * Register the pattern category so the patterns group together in the inserter.
	 *
	 * @return void
	 */
	public function register_category(): void {
		register_block_pattern_category(
			self::CATEGORY,
			[ 'label' => __( 'Snap Mega Menu', 'snap-megamenu-builder' ) ]
		);
	}

	/**
	 * Register each header layout as a block pattern.
	 *
	 * @return void
	 */
	public function register_patterns(): void {
		foreach ( $this->get_patterns() as $slug => $data ) {
			$content = $this->load_content( $data['file'], $slug );

			if ( '' === $content ) {
				continue;
			}

			register_block_pattern(
				'snap-megamenu-builder/' . $slug,
				[
					'title'       => $data['title'],
					'description' => $data['description'],
					'content'     => $content,
					'categories'  => [ self::CATEGORY ],
					// Surface the pattern where header template parts are edited/created.
					'blockTypes'  => [ 'core/template-part/header' ],
					'inserter'    => true,
				]
			);
		}
	}

	/**
	 * Pattern definitions (same titles/files as the old template parts).
	 *
	 * @return array<string, array{title: string, description: string, file: string}>
	 */
	private function get_patterns(): array {
		return [
			'header-centered' => [
				'title'       => __( 'Snap Header — Inline Logo / Nav', 'snap-megamenu-builder' ),
				'description' => __( 'Header layout with inline site logo and navigation. Includes mobile toggle.', 'snap-megamenu-builder' ),
				'file'        => 'header-inline.html',
			]
		];
	}

	/**
	 * Read a part file and apply the content filter.
	 *
	 * @param string $file Filename inside parts/.
	 * @param string $slug Pattern slug.
	 * @return string Block markup, or '' if unreadable.
	 */
	private function load_content( string $file, string $slug ): string {
		$path = SNAP_MEGAMENU_DIR . 'parts/' . $file;

		if ( ! file_exists( $path ) ) {
			return '';
		}

		$content = file_get_contents( $path );
		$content = false !== $content ? $content : '';

		/**
		 * Filter the pattern markup before registration.
		 *
		 * @param string $content Raw block markup.
		 * @param string $slug    Pattern slug.
		 */
		return (string) apply_filters( 'snap_megamenu_template_part_content', $content, $slug );
	}
}
