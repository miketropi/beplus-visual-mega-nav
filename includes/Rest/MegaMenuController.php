<?php
/**
 * REST API controller for mega menu item data.
 *
 * Endpoints:
 *   GET  /beplus-visual-mega-nav/v1/item/<id>   — Retrieve settings + content.
 *   POST /beplus-visual-mega-nav/v1/item/<id>   — Save settings + content.
 *
 * @package Beplus\VisualMegaNav\Rest
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Rest;

use Beplus\VisualMegaNav\Core\BlockContentSanitizer;
use Beplus\VisualMegaNav\Core\MetaKeys;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Register and handle mega menu REST routes.
 */
final class MegaMenuController {

	private const NAMESPACE = 'beplus-visual-mega-nav/v1';

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/item/(?P<id>[\d]+)',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_item' ],
					'permission_callback' => [ $this, 'check_permission' ],
					'args'                => $this->get_id_args(),
				],
				[
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'save_item' ],
					'permission_callback' => [ $this, 'check_permission' ],
					'args'                => array_merge(
						$this->get_id_args(),
						$this->get_save_args()
					),
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
			esc_html__( 'You do not have permission to manage mega menus.', 'beplus-visual-mega-nav' ),
			[ 'status' => 403 ]
		);
	}

	/**
	 * GET handler — retrieve mega menu data for a nav menu item.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_item( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		// Verify the post is a nav_menu_item.
		$post = get_post( $id );
		if ( ! $post || 'nav_menu_item' !== $post->post_type ) {
			return new WP_REST_Response(
				[ 'error' => 'Invalid menu item ID.' ],
				404
			);
		}

		$enabled  = (bool) MetaKeys::get( $id, MetaKeys::ENABLED );
		$settings = MetaKeys::get( $id, MetaKeys::SETTINGS );
		$content  = MetaKeys::get( $id, MetaKeys::CONTENT );

		// Decode any `&amp;` / `\u0026` that survived the storage pipeline.
		if ( is_string( $content ) && '' !== $content ) {
			$content = html_entity_decode( $content, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
			$content = preg_replace_callback(
				'/\\\\u([0-9a-fA-F]{4})/',
				static function ( array $m ): string {
					$char = mb_chr( (int) hexdec( $m[1] ), 'UTF-8' );
					return is_string( $char ) ? $char : $m[0];
				},
				$content
			);
		}

		return new WP_REST_Response(
			[
				'id'       => $id,
				'enabled'  => $enabled,
				'settings' => json_decode( $settings ?: '{}', true ),
				'content'  => $content ?: '',
			]
		);
	}

	/**
	 * POST handler — save mega menu data for a nav menu item.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function save_item( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		// Verify the post is a nav_menu_item.
		$post = get_post( $id );
		if ( ! $post || 'nav_menu_item' !== $post->post_type ) {
			return new WP_REST_Response(
				[ 'error' => 'Invalid menu item ID.' ],
				404
			);
		}

		$enabled  = (bool) $request->get_param( 'enabled' );
		$settings = $request->get_param( 'settings' );
		$content  = $request->get_param( 'content' );

		// Save enabled flag.
		MetaKeys::update( $id, MetaKeys::ENABLED, $enabled );

		// Save settings as JSON string.
		if ( null !== $settings ) {
			MetaKeys::update(
				$id,
				MetaKeys::SETTINGS,
				wp_json_encode( $settings )
			);
		}

		// Save content — already sanitized by REST arg schema callback.
		if ( null !== $content ) {
			MetaKeys::update(
				$id,
				MetaKeys::CONTENT,
				(string) $content
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'id'      => $id,
			]
		);
	}

	/**
	 * Argument schema for the `id` parameter.
	 *
	 * @return array<string, mixed>
	 */
	private function get_id_args(): array {
		return [
			'id' => [
				'required'          => true,
				'type'              => 'integer',
				'validate_callback' => static fn( $value ): bool => is_numeric( $value ) && (int) $value > 0,
				'sanitize_callback' => 'absint',
			],
		];
	}

	/**
	 * Argument schema for the save (POST) parameters.
	 *
	 * @return array<string, mixed>
	 */
	private function get_save_args(): array {
		return [
			'enabled'  => [
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			],
			'settings' => [
				'type'    => 'object',
				'default' => new \stdClass(),
			],
			'content'  => [
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => [ BlockContentSanitizer::class, 'sanitize' ],
			],
		];
	}
}
