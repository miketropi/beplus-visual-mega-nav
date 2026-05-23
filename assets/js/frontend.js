/**
 * Frontend: mega menu interaction & accessibility.
 *
 * - Keyboard navigation (Enter / Escape / Tab).
 * - Touch device support.
 * - ARIA attributes.
 *
 * @package Snap\MegaMenu
 */

( function () {
	'use strict';

	const MEGA_ITEMS = '.has-mega-menu';
	const PANEL_CLASS = 'snap-megamenu-mega-panel';
	const OPEN_CLASS = 'is-open';
	const ARIA_EXPANDED = 'aria-expanded';

	/**
	 * Initialize mega menu interactions.
	 */
	function init() {
		const items = document.querySelectorAll( MEGA_ITEMS );

		if ( ! items.length ) {
			return;
		}

		items.forEach( setupItem );

		// Close all panels when pressing Escape.
		document.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' ) {
				closeAll();
			}
		} );

		// Close panels when clicking outside.
		document.addEventListener( 'click', ( e ) => {
			if ( ! e.target.closest( MEGA_ITEMS ) ) {
				closeAll();
			}
		} );
	}

	/**
	 * Set up a single mega menu item.
	 *
	 * @param {HTMLElement} item The li.has-mega-menu element.
	 */
	function setupItem( item ) {
		const link = item.querySelector( ':scope > a' );
		const panel = item.querySelector( `.${ PANEL_CLASS }` );

		if ( ! link || ! panel ) {
			return;
		}

		// ARIA setup.
		const panelId =
			'mega-panel-' + ( item.id || Math.random().toString( 36 ).slice( 2, 8 ) );
		panel.id = panelId;
		link.setAttribute( 'aria-haspopup', 'true' );
		link.setAttribute( ARIA_EXPANDED, 'false' );
		link.setAttribute( 'aria-controls', panelId );

		// Toggle on click (for touch / keyboard).
		link.addEventListener( 'click', ( e ) => {
			// If link has a real URL and mega menu is already open, let it navigate.
			const isOpen = panel.classList.contains( OPEN_CLASS );
			if ( isOpen && link.getAttribute( 'href' ) !== '#' ) {
				return; // Allow normal navigation.
			}

			e.preventDefault();
			togglePanel( item, panel, link );
		} );

		// Keyboard: Enter to toggle, Escape to close.
		link.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				e.preventDefault();
				togglePanel( item, panel, link );
			}
		} );

		// Focus trap: when tabbing out of the last element, close panel.
		panel.addEventListener( 'focusout', ( e ) => {
			if ( ! item.contains( e.relatedTarget ) ) {
				closePanel( panel, link );
			}
		} );
	}

	/**
	 * Toggle a mega panel open/closed.
	 *
	 * @param {HTMLElement} item  The li element.
	 * @param {HTMLElement} panel The .snap-megamenu-mega-panel element.
	 * @param {HTMLElement} link  The anchor element.
	 */
	function togglePanel( item, panel, link ) {
		const isOpen = panel.classList.contains( OPEN_CLASS );

		// Close all other panels first.
		closeAll();

		if ( ! isOpen ) {
			panel.classList.add( OPEN_CLASS );
			link.setAttribute( ARIA_EXPANDED, 'true' );
		}
	}

	/**
	 * Close a single panel.
	 *
	 * @param {HTMLElement} panel The panel element.
	 * @param {HTMLElement} link  The trigger link.
	 */
	function closePanel( panel, link ) {
		panel.classList.remove( OPEN_CLASS );
		link.setAttribute( ARIA_EXPANDED, 'false' );
	}

	/**
	 * Close all open mega panels.
	 */
	function closeAll() {
		document.querySelectorAll( `.${ PANEL_CLASS }.${ OPEN_CLASS }` ).forEach( ( panel ) => {
			const item = panel.closest( MEGA_ITEMS );
			const link = item?.querySelector( ':scope > a' );
			if ( link ) {
				closePanel( panel, link );
			}
		} );
	}

	// Init on DOMContentLoaded.
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
