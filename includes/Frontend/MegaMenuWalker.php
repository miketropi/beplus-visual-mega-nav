<?php
/**
 * Custom nav menu walker for mega menu panels.
 *
 * @deprecated 1.0.1 Use MegaMenuWalkerDelegator instead.
 * @package Beplus\VisualMegaNav\Frontend
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Frontend;

/**
 * Walker that injects mega menu panel HTML after root-level items.
 *
 * Kept for backward compatibility — delegates to MegaMenuWalkerDelegator.
 */
class MegaMenuWalker extends MegaMenuWalkerDelegator {

	// phpcs:disable Generic.CodeAnalysis.UselessOverridingMethod.Found -- kept for backwards compatibility
	/**
	 * Constructor — delegates to parent for backwards compatibility.
	 *
	 * @param \Walker|null $delegate Optional inner walker.
	 */
	public function __construct( ?\Walker $delegate = null ) {
		parent::__construct( $delegate );
	}
	// phpcs:enable Generic.CodeAnalysis.UselessOverridingMethod.Found
}
