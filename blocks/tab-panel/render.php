<?php
/**
 * Tab Panel block — frontend markup.
 *
 * Outputs inner blocks only. The parent Tab Container wraps each panel
 * with the tabpanel role, ID, and hidden state.
 *
 * @package Snap\MegaMenuBuilder\Blocks
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Inner blocks.
 * @var WP_Block             $block      Block instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered block content
