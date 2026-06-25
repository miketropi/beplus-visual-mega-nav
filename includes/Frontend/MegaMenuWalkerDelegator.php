<?php
/**
 * Wraps a theme walker and injects mega menu panels.
 *
 * @package Snap\MegaMenuBuilder\Frontend
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Frontend;

use Walker;
use Walker_Nav_Menu;

/**
 * Delegates nav markup to an inner walker while appending mega menu panels.
 */
final class MegaMenuWalkerDelegator extends Walker_Nav_Menu {

	/**
	 * Inner walker (theme-specific markup).
	 *
	 * @var \Walker|null
	 */
	private ?Walker $delegate;

	/**
	 * Root-level item IDs that use mega menu (skip default sub-menus).
	 *
	 * @var int[]
	 */
	private array $mega_item_ids = [];

	/**
	 * Most recent depth-0 item ID (parent for the next sub-menu level).
	 *
	 * @var int
	 */
	private int $current_depth_0_item_id = 0;

	/**
	 * Depth at which sub-menu output is suppressed.
	 *
	 * @var int|null
	 */
	private ?int $suppress_submenu_depth = null;

	/**
	 * Set the delegate walker.
	 *
	 * @param Walker|null $delegate Theme walker to delegate to.
	 */
	public function __construct( ?Walker $delegate = null ) {
		$this->delegate = $delegate;
	}

	/**
	 * Start a sub-menu level, suppressing output for mega menu items.
	 *
	 * @inheritDoc
	 *
	 * @param string    $output HTML output string passed by reference.
	 * @param int       $depth  Current depth level.
	 * @param \stdClass $args   Array of nav menu arguments.
	 */
	public function start_lvl( &$output, $depth = 0, $args = array() ): void {
		if ( $this->should_suppress_submenu( $depth ) ) {
			$this->suppress_submenu_depth = (int) $depth;
			return;
		}

		if ( $this->delegate ) {
			$this->delegate->start_lvl( $output, $depth, $args );
			return;
		}

		parent::start_lvl( $output, $depth, $args );
	}

	/**
	 * End a sub-menu level, restoring normal output after suppression.
	 *
	 * @inheritDoc
	 *
	 * @param string    $output HTML output string passed by reference.
	 * @param int       $depth  Current depth level.
	 * @param \stdClass $args   Array of nav menu arguments.
	 */
	public function end_lvl( &$output, $depth = 0, $args = array() ): void {
		if ( null !== $this->suppress_submenu_depth && (int) $depth === $this->suppress_submenu_depth ) {
			$this->suppress_submenu_depth = null;
			return;
		}

		if ( $this->delegate ) {
			$this->delegate->end_lvl( $output, $depth, $args );
			return;
		}

		parent::end_lvl( $output, $depth, $args );
	}

	/**
	 * Start a menu item element. Tracks depth-0 items for mega menu panel injection.
	 *
	 * @inheritDoc
	 *
	 * @param string    $output HTML output string passed by reference.
	 * @param \WP_Post  $item   Menu item data object.
	 * @param int       $depth  Current depth level.
	 * @param \stdClass $args   Array of nav menu arguments.
	 * @param int       $id     Current menu item ID.
	 */
	public function start_el( &$output, $item, $depth = 0, $args = array(), $id = 0 ): void {
		if ( $this->delegate ) {
			$this->delegate->start_el( $output, $item, $depth, $args, $id );
		} else {
			parent::start_el( $output, $item, $depth, $args, $id );
		}

		if ( 0 === (int) $depth && $item instanceof \WP_Post ) {
			$this->current_depth_0_item_id = (int) $item->ID;

			if ( MegaMenuPanelRenderer::append( $output, $item, (int) $depth ) ) {
				$this->mega_item_ids[] = (int) $item->ID;
			}
		}
	}

	/**
	 * End a menu item element.
	 *
	 * @inheritDoc
	 *
	 * @param string    $output HTML output string passed by reference.
	 * @param \WP_Post  $item   Menu item data object.
	 * @param int       $depth  Current depth level.
	 * @param \stdClass $args   Array of nav menu arguments.
	 */
	public function end_el( &$output, $item, $depth = 0, $args = array() ): void {
		if ( $this->delegate ) {
			$this->delegate->end_el( $output, $item, $depth, $args );
			return;
		}

		parent::end_el( $output, $item, $depth, $args );
	}

	/**
	 * Whether to skip rendering a sub-menu for a mega menu parent item.
	 *
	 * @param int $depth Sub-menu depth.
	 * @return bool
	 */
	private function should_suppress_submenu( int $depth ): bool {
		return 0 === $depth
			&& $this->current_depth_0_item_id > 0
			&& in_array( $this->current_depth_0_item_id, $this->mega_item_ids, true );
	}
}
