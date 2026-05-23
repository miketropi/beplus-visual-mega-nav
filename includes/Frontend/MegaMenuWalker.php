<?php
/**
 * Custom nav menu walker for mega menu panels.
 *
 * @deprecated 1.0.1 Use MegaMenuWalkerDelegator instead.
 * @package Snap\MegaMenuBuilder\Frontend
 */

declare(strict_types=1);

namespace Snap\MegaMenuBuilder\Frontend;

/**
 * Walker that injects mega menu panel HTML after root-level items.
 *
 * Kept for backward compatibility — delegates to MegaMenuWalkerDelegator.
 */
class MegaMenuWalker extends MegaMenuWalkerDelegator {

	/**
	 * @param \Walker|null $delegate Optional inner walker.
	 */
	public function __construct( ?\Walker $delegate = null ) {
		parent::__construct( $delegate );
	}
}
