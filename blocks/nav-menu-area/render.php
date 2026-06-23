<?php
/**
 * Menu Area block — frontend markup.
 *
 * Renders a classic WordPress menu via wp_nav_menu(), delegating to
 * the existing mega menu walker engine (MegaMenuWalkerDelegator).
 *
 * @package Snap\MegaMenuBuilder\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks (unused).
 * @var WP_Block             $block      Block instance.
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
	$attributes = [];
}

$menu_id = isset( $attributes['menuId'] ) ? absint( $attributes['menuId'] ) : 0;

if ( $menu_id <= 0 ) {
	return;
}

$menu_exists = is_nav_menu( $menu_id );
if ( ! $menu_exists ) {
	return;
}

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'is-desktop-only',
	]
);

$menu_args = [
	'menu'            => $menu_id,
	'container'       => '',
	'container_class' => '',
	'menu_class'      => 'snap-nav-menu',
	'echo'            => false,
	'fallback_cb'     => false,
	'depth'           => 0,
];

$menu_html = wp_nav_menu( $menu_args );

if ( ! is_string( $menu_html ) || '' === trim( $menu_html ) ) {
	return;
}

printf( '<nav %1$s>%2$s</nav>', $wrapper_attributes, $menu_html ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes and wp_nav_menu output are pre-escaped.

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
