<?php
/**
 * Load mega menu templates from the plugin and active theme.
 *
 * Template files are JSON documents in:
 *   - {plugin}/templates/*.json
 *   - {parent-theme}/mega-menu-templates/*.json
 *   - {child-theme}/mega-menu-templates/*.json  (overrides same slug)
 *
 * @package Snap\MegaMenuBuilder\Templates
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Templates;

use Snap\MegaMenuBuilder\Core\BlockContentSanitizer;

/**
 * Discovers, validates, and returns mega menu templates.
 */
final class TemplateRepository {

	private const TEMPLATE_VERSION = '1.0';

	/**
	 * Registered template directories keyed by source label.
	 *
	 * @return array<string, string> source => absolute directory path.
	 */
	public function get_template_directories(): array {
		$directories = [
			'plugin' => SNAP_MEGAMENU_DIR . 'templates',
			'theme'  => get_template_directory() . '/mega-menu-templates',
		];

		if ( get_stylesheet_directory() !== get_template_directory() ) {
			$directories['child-theme'] = get_stylesheet_directory() . '/mega-menu-templates';
		}

		/**
		 * Filter template scan directories.
		 *
		 * @param array<string, string> $directories Source label => absolute path.
		 */
		return apply_filters( 'snap_megamenu_template_directories', $directories );
	}

	/**
	 * List all templates (summary fields only).
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_all(): array {
		$templates = [];

		foreach ( $this->get_template_directories() as $source => $directory ) {
			if ( ! is_dir( $directory ) ) {
				continue;
			}

			$files = glob( trailingslashit( $directory ) . '*.json' );

			if ( ! is_array( $files ) ) {
				continue;
			}

			foreach ( $files as $file ) {
				$template = $this->load_file( $file, $source );

				if ( null === $template ) {
					continue;
				}

				$slug               = $template['slug'];
				$templates[ $slug ] = $this->to_summary( $template );
			}
		}

		/**
		 * Filter the template list before it is returned to REST/JS.
		 *
		 * @param array<string, array<string, mixed>> $templates Keyed by slug.
		 */
		$templates = apply_filters( 'snap_megamenu_templates', $templates );

		return array_values( $templates );
	}

	/**
	 * Load a single template by slug.
	 *
	 * @param string $slug Template slug.
	 * @return array<string, mixed>|null
	 */
	public function get_by_slug( string $slug ): ?array {
		$slug = sanitize_key( $slug );

		if ( '' === $slug ) {
			return null;
		}

		$found = null;

		foreach ( $this->get_template_directories() as $source => $directory ) {
			if ( ! is_dir( $directory ) ) {
				continue;
			}

			$file = trailingslashit( $directory ) . $slug . '.json';

			if ( ! is_readable( $file ) ) {
				continue;
			}

			$template = $this->load_file( $file, $source );

			if ( null !== $template ) {
				$found = $template;
			}
		}

		if ( null === $found ) {
			return null;
		}

		/**
		 * Filter a template before it is returned.
		 *
		 * @param array<string, mixed> $found Full template payload.
		 * @param string               $slug  Requested slug.
		 */
		return apply_filters( 'snap_megamenu_template_data', $found, $slug );
	}

	/**
	 * Parse and validate a template JSON file.
	 *
	 * @param string $file   Absolute path to JSON file.
	 * @param string $source Source label (plugin, theme, child-theme).
	 * @return array<string, mixed>|null
	 */
	private function load_file( string $file, string $source ): ?array {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- reading local template file, not a remote URL
		$raw = file_get_contents( $file );

		if ( false === $raw ) {
			return null;
		}

		$data = json_decode( $raw, true );

		if ( ! is_array( $data ) ) {
			return null;
		}

		$slug = sanitize_key( $data['slug'] ?? basename( $file, '.json' ) );

		if ( '' === $slug ) {
			return null;
		}

		$content = isset( $data['content'] ) && is_string( $data['content'] )
			? BlockContentSanitizer::sanitize( $data['content'] )
			: '';

		if ( '' === $content ) {
			return null;
		}

		$settings = [];
		if ( isset( $data['settings'] ) && is_array( $data['settings'] ) ) {
			$decoded  = json_decode(
				BlockContentSanitizer::sanitize_settings( $data['settings'] ),
				true
			);
			$settings = is_array( $decoded ) ? $decoded : [];
		}

		return [
			'slug'        => $slug,
			'title'       => sanitize_text_field( (string) ( $data['title'] ?? $slug ) ),
			'description' => sanitize_text_field( (string) ( $data['description'] ?? '' ) ),
			'version'     => sanitize_text_field( (string) ( $data['version'] ?? self::TEMPLATE_VERSION ) ),
			'source'      => $source,
			'settings'    => $settings,
			'content'     => $content,
		];
	}

	/**
	 * Strip full content from a template for list responses.
	 *
	 * @param array<string, mixed> $template Full template.
	 * @return array<string, mixed>
	 */
	private function to_summary( array $template ): array {
		return [
			'slug'        => $template['slug'],
			'title'       => $template['title'],
			'description' => $template['description'],
			'version'     => $template['version'],
			'source'      => $template['source'],
		];
	}
}
