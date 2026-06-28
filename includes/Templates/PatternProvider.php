<?php
/**
 * Registers header block patterns from the plugin's parts/ directory.
 *
 * @package Beplus\VisualMegaNav\Templates
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Templates;

/**
 * Registers plugin header layouts as block patterns.
 */
final class PatternProvider {

	/**
	 * Pattern category slug.
	 */
	private const CATEGORY = 'beplus-vmn';

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
			[ 'label' => __( 'Mega Menu', 'beplus-visual-mega-nav' ) ]
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
				'beplus-visual-mega-nav/' . $slug,
				[
					'title'       => $data['title'],
					'description' => $data['description'],
					'content'     => $content,
					'categories'  => [ self::CATEGORY ],
					'blockTypes'  => $data['blockTypes'] ?? [ 'core/template-part/header' ],
					'inserter'    => true,
				]
			);
		}
	}

	/**
	 * Pattern definitions.
	 *
	 * @return array<string, array{title: string, description: string, file: string, blockTypes?: string[]}>
	 */
	private function get_patterns(): array {
		return [
			'header-logo-menu-toggle' => [
				'title'       => __( 'BePlus Header Inline — Logo / Menu / Toggle', 'beplus-visual-mega-nav' ),
				'description' => __( 'A header with site logo, classic navigation menu, and a mobile hamburger toggle.', 'beplus-visual-mega-nav' ),
				'file'        => 'header-inline.html',
				'blockTypes'  => [ 'core/template-part/header' ],
			],
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
		$path = BEPLUS_VISUAL_MEGA_NAV_DIR . 'parts/' . $file;

		if ( ! file_exists( $path ) ) {
			return '';
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- reading local plugin file, not a remote URL
		$content = file_get_contents( $path );
		$content = false !== $content ? $content : '';

		/**
		 * Filter the pattern markup before registration.
		 *
		 * @param string $content Raw block markup.
		 * @param string $slug    Pattern slug.
		 */
		return (string) apply_filters( 'beplus_vmn_template_part_content', $content, $slug );
	}
}
