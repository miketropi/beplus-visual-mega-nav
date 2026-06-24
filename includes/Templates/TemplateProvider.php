<?php
/**
 * Provides FSE template parts from the plugin's parts/ directory.
 *
 * @package Snap\MegaMenuBuilder\Templates
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Templates;

/**
 * Injects template parts into the Site Editor.
 */
final class TemplateProvider {

	/**
	 * Hook into the template system.
	 *
	 * @return void
	 */
	public function register(): void {
		add_filter( 'get_block_templates', [ $this, 'inject_template_parts' ], 10, 3 );
		add_filter( 'pre_get_block_template', [ $this, 'inject_single_template' ], 10, 3 );
		add_filter( 'pre_get_block_file_template', [ $this, 'inject_single_template' ], 10, 3 );

		add_action( 'save_post_wp_template_part', [ $this, 'flush_db_cache' ] );
		add_action( 'deleted_post', [ $this, 'flush_db_cache' ] );
	}

	/**
	 * Inject plugin template parts into query results.
	 *
	 * Skips slugs that already have a DB record returned (user edits win).
	 *
	 * @param array<int, \WP_Block_Template> $query_result  Current templates.
	 * @param array<string, mixed>           $query         Query arguments.
	 * @param string                         $template_type 'wp_template' or 'wp_template_part'.
	 * @return array<int, \WP_Block_Template>
	 */
	public function inject_template_parts( array $query_result, array $query, string $template_type ): array {
		if ( 'wp_template_part' !== $template_type ) {
			return $query_result;
		}

		// Collect slugs already present (DB records take precedence).
		$existing_slugs = [];
		foreach ( $query_result as $tpl ) {
			if ( ! empty( $tpl->slug ) ) {
				$existing_slugs[] = $tpl->slug;
			}
		}

		$parts = $this->get_builtin_parts();

		foreach ( $parts as $slug => $data ) {
			// Don't inject if a template with this slug already exists (DB version).
			if ( in_array( $slug, $existing_slugs, true ) ) {
				continue;
			}

			if ( $this->should_skip( $query, $slug ) ) {
				continue;
			}

			$query_result[] = $this->build_template( $slug, $data );
		}

		return $query_result;
	}

	/**
	 * Resolve a single template part for pre_get_block_template
	 * and pre_get_block_file_template. Returns null when a DB
	 * record already exists so user edits take precedence.
	 *
	 * @param \WP_Block_Template|null $template      Pre-resolved template, or null.
	 * @param string                  $id            Template id, formatted as "theme//slug".
	 * @param string                  $template_type 'wp_template' or 'wp_template_part'.
	 * @return \WP_Block_Template|null
	 */
	public function inject_single_template( $template, $id, $template_type ) {
		// Already resolved upstream — don't override.
		if ( null !== $template ) {
			return $template;
		}

		if ( ! is_string( $id ) || false === strpos( $id, '//' ) ) {
			return $template;
		}

		list( $theme, $slug ) = explode( '//', $id, 2 );

		if ( get_stylesheet() !== $theme ) {
			return $template;
		}

		$parts = $this->get_builtin_parts();
		if ( ! isset( $parts[ $slug ] ) ) {
			return $template;
		}

		// A saved (customized) DB record must win — return null so core uses the DB version.
		if ( $this->db_template_exists( $slug ) ) {
			return $template;
		}

		return $this->build_template( $slug, $parts[ $slug ], $theme );
	}

	/**
	 * Built-in template part definitions.
	 *
	 * @return array<string, array{title: string, description: string, file: string}>
	 */
	private function get_builtin_parts(): array {
		return [
			'header-centered' => [
				'title'       => __( 'Snap Header — Centered Logo / Nav Below', 'snap-megamenu-builder' ),
				'description' => __( 'Center-aligned site header with logo on top and navigation menu below. Includes mobile toggle.', 'snap-megamenu-builder' ),
				'file'        => 'header-centered.html',
			],
			'header-split'    => [
				'title'       => __( 'Snap Header — Logo Left / Nav Right', 'snap-megamenu-builder' ),
				'description' => __( 'Site header with logo on the left and classic navigation menu on the right. Includes mobile toggle.', 'snap-megamenu-builder' ),
				'file'        => 'header-split.html',
			],
		];
	}

	/**
	 * Build a WP_Block_Template object from a slug and definition.
	 *
	 * @param string                                                  $slug  Template slug.
	 * @param array{title: string, description: string, file: string} $data  Template definition.
	 * @param string                                                  $theme Theme namespace for the id (default: plugin slug).
	 * @return \WP_Block_Template
	 */
	private function build_template( string $slug, array $data, string $theme = '' ): \WP_Block_Template {
		$theme     = '' !== $theme ? $theme : get_stylesheet();
		$file_path = SNAP_MEGAMENU_DIR . 'parts/' . $data['file'];

		$template       = new \WP_Block_Template();
		$template->id   = $theme . '//' . $slug;
		$template->slug = $slug;
		$template->type = 'wp_template_part';

		$template->title       = $data['title'];
		$template->description = $data['description'];
		$template->area        = 'header';

		$template->source         = 'plugin';
		$template->origin         = 'plugin';
		$template->plugin         = 'snap-megamenu-builder';
		$template->theme          = $theme;
		$template->status         = 'publish';
		$template->is_custom      = false;
		$template->has_theme_file = true;
		$template->wp_id          = null;
		$template->modified       = null;

		if ( file_exists( $file_path ) ) {
			$content           = file_get_contents( $file_path );
			$template->content = false !== $content ? $content : '';
		} else {
			$template->content = '';
		}

		/**
		 * Filter the template content before it is registered.
		 *
		 * @param string $content Raw block markup.
		 * @param string $slug    Template slug.
		 */
		$template->content = apply_filters(
			'snap_megamenu_template_part_content',
			$template->content,
			$slug
		);

		return $template;
	}

	/**
	 * Determine if a template part should be omitted from the current query.
	 *
	 * @param array<string, mixed> $query Query arguments.
	 * @param string               $slug  Template slug to check.
	 * @return bool
	 */
	private function should_skip( array $query, string $slug ): bool {
		// If a specific slug is requested, skip others.
		if ( ! empty( $query['slug__in'] ) && is_array( $query['slug__in'] ) ) {
			return ! in_array( $slug, $query['slug__in'], true );
		}

		// If area is filtered, only header parts match.
		if ( ! empty( $query['area'] ) && 'header' !== $query['area'] ) {
			return true;
		}

		return false;
	}

	/**
	 * Check whether a DB record (user-edited version) exists for the given slug.
	 *
	 * @param string $slug Template part slug.
	 * @return bool
	 */
	private function db_template_exists( string $slug ): bool {
		$cache_key = 'snap_megamenu_db_tpl_' . get_stylesheet() . '_' . $slug;
		$cached    = wp_cache_get( $cache_key, 'snap-megamenu' );

		if ( false !== $cached ) {
			return (bool) $cached;
		}

		$posts = get_posts(
			[
				'post_type'      => 'wp_template_part',
				'name'           => $slug,
				'posts_per_page' => 1,
				'post_status'    => [ 'publish', 'draft', 'auto-draft', 'inherit' ],
				'no_found_rows'  => true,
				'fields'         => 'ids',
				'tax_query'      => [
					[
						'taxonomy' => 'wp_theme',
						'field'    => 'name',
						'terms'    => get_stylesheet(),
					],
				],
			]
		);

		$exists = ! empty( $posts );
		wp_cache_set( $cache_key, $exists ? 1 : 0, 'snap-megamenu', 300 );

		return $exists;
	}

	/**
	 * Invalidate the cache on save/delete so the next read picks up the DB version.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function flush_db_cache( $post_id ): void {
		$post = get_post( (int) $post_id );
		if ( $post && 'wp_template_part' === $post->post_type ) {
			wp_cache_delete(
				'snap_megamenu_db_tpl_' . get_stylesheet() . '_' . $post->post_name,
				'snap-megamenu'
			);
		}
	}
}
