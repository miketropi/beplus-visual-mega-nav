<?php
/**
 * REST API controller for mega menu templates.
 *
 * Endpoints:
 *   GET /snap-megamenu/v1/templates          — List available templates.
 *   GET /snap-megamenu/v1/templates/<slug>   — Load a single template.
 *
 * @package Snap\MegaMenuBuilder\Rest
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Rest;

use Snap\MegaMenuBuilder\Templates\TemplateRepository;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Register and handle template REST routes.
 */
final class TemplatesController {

	private const NAMESPACE = 'snap-megamenu/v1';

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/templates',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_templates' ],
					'permission_callback' => [ $this, 'check_permission' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/templates/(?P<slug>[a-z0-9-]+)',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_template' ],
					'permission_callback' => [ $this, 'check_permission' ],
					'args'                => [
						'slug' => [
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_key',
						],
					],
				],
			]
		);
	}

	/**
	 * Permission check — user must be able to edit theme options.
	 *
	 * @return bool|WP_Error
	 */
	public function check_permission(): bool|WP_Error {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			esc_html__( 'You do not have permission to manage mega menus.', 'snap-megamenu-builder' ),
			[ 'status' => 403 ]
		);
	}

	/**
	 * GET /templates — list template summaries.
	 *
	 * @return WP_REST_Response
	 */
	public function get_templates(): WP_REST_Response {
		$repository = new TemplateRepository();

		return new WP_REST_Response(
			[
				'templates' => $repository->get_all(),
			]
		);
	}

	/**
	 * GET /templates/{slug} — load full template payload.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_template( WP_REST_Request $request ): WP_REST_Response {
		$slug       = (string) $request->get_param( 'slug' );
		$repository = new TemplateRepository();
		$template   = $repository->get_by_slug( $slug );

		if ( null === $template ) {
			return new WP_REST_Response(
				[ 'error' => 'Template not found.' ],
				404
			);
		}

		return new WP_REST_Response( $template );
	}
}
