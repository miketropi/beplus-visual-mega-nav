<?php
/**
 * Link Item block — frontend markup.
 *
 * @package Snap\MegaMenuBuilder\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks (unused).
 * @var WP_Block             $block      Block instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
	$attributes = []; // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- WordPress block convention
}

echo \Snap\MegaMenuBuilder\Blocks\LinkItemRenderer::render( $attributes, $block ?? null ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
