/**
 * Entry point for the Mega Menu Builder admin UI.
 *
 * Runs on nav-menus.php — detects root-level menu items,
 * injects "Mega Menu" config buttons, and mounts the React
 * modal when a button is clicked.
 *
 * @package
 */

import { createRoot, render } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';
import domReady from '@wordpress/dom-ready';
import MegaMenuApp from './components/MegaMenuApp';

import './css/admin.css';
import './blocks/link-item';
import './blocks/beplus-header';
import './blocks/beplus-navigation';
import './blocks/nav-menu-area';
import './blocks/nav-toggle';
import './blocks/tab-container';
import './blocks/tab-panel';
import './blocks/hero-artwork-dock';

// Register core blocks so they're available in the isolated editor.
registerCoreBlocks();

// Format types (bold, italic, link, …) are registered by wp-format-library
// enqueued in NavMenuPage.php — required for Paragraph rich-text toolbar controls.

domReady(() => {
	const menuContainer = document.getElementById('menu-to-edit');
	if (!menuContainer) {
		return;
	}

	// Mount React app.
	const mountPoint = document.getElementById('beplus-vmn-root');
	if (!mountPoint) {
		return;
	}

	if (createRoot) {
		const root = createRoot(mountPoint);
		root.render(<MegaMenuApp menuContainer={menuContainer} />);
	} else {
		render(<MegaMenuApp menuContainer={menuContainer} />, mountPoint);
	}
});
