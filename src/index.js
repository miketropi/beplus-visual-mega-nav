/**
 * Entry point for the Mega Menu Builder admin UI.
 *
 * Runs on nav-menus.php — detects root-level menu items,
 * injects "Mega Menu" config buttons, and mounts the React
 * modal when a button is clicked.
 *
 * @package Snap\MegaMenu
 */

import { createRoot, render } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';
import domReady from '@wordpress/dom-ready';
import MegaMenuApp from './components/MegaMenuApp';

import './css/admin.css';
import './blocks/link-item';

// Register core blocks so they're available in the isolated editor.
registerCoreBlocks();

// Format types (bold, italic, link, …) are registered by wp-format-library
// enqueued in NavMenuPage.php — required for Paragraph rich-text toolbar controls.

domReady( () => {
	const menuContainer = document.getElementById( 'menu-to-edit' );
	if ( ! menuContainer ) {
		return;
	}

	// Mount React app.
	const mountPoint = document.getElementById( 'snap-megamenu-root' );
	if ( ! mountPoint ) {
		return;
	}

	if ( createRoot ) {
		const root = createRoot( mountPoint );
		root.render( <MegaMenuApp menuContainer={ menuContainer } /> );
	} else {
		render( <MegaMenuApp menuContainer={ menuContainer } />, mountPoint );
	}
} );
