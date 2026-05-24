/**
 * Frontend: mega menu interaction & accessibility.
 *
 * Desktop (≥1024px): hover / focus flyout + optional click toggle.
 * Tablet & mobile: accordion inline panels (works in cloned mobile nav portals).
 *
 * @package Snap\MegaMenu
 */

( function () {
	'use strict';

	const MEGA_ITEMS = '.has-mega-menu';
	const PANEL_CLASS = 'snap-megamenu-mega-panel';
	const OPEN_CLASS = 'is-open';
	const ACCORDION_CLASS = 'snap-megamenu--open';
	const TOGGLE_CLASS = 'snap-megamenu-toggle';
	const ENHANCED_ATTR = 'data-snap-megamenu-enhanced';
	const ARIA_EXPANDED = 'aria-expanded';

	/** Accordion mode — includes tablets where hover flyouts are unreliable. */
	const ACCORDION_MQ = window.matchMedia( '(max-width: 1023px)' );

	/**
	 * Whether the UI should use inline accordion instead of hover flyout.
	 *
	 * @return {boolean}
	 */
	function isAccordionMode() {
		return ACCORDION_MQ.matches;
	}

	/**
	 * Initialize mega menu interactions.
	 */
	function init() {
		if ( ! document.querySelector( MEGA_ITEMS ) ) {
			return;
		}

		enhanceItems( document );
		observeNavClones();
		bindDelegatedEvents();

		ACCORDION_MQ.addEventListener( 'change', () => {
			closeAll();
			document.querySelectorAll( `[${ ENHANCED_ATTR }]` ).forEach( ( item ) => {
				item.removeAttribute( ENHANCED_ATTR );
			} );
			enhanceItems( document );
		} );
	}

	/**
	 * Enhance mega menu items inside a root node (document or portal mount).
	 *
	 * @param {ParentNode} root Root to scan.
	 */
	function enhanceItems( root ) {
		root.querySelectorAll( MEGA_ITEMS ).forEach( ( item ) => {
			if ( ! ( item instanceof HTMLElement ) ) {
				return;
			}

			if ( item.hasAttribute( ENHANCED_ATTR ) ) {
				return;
			}

			item.setAttribute( ENHANCED_ATTR, 'true' );
			setupItem( item );
		} );
	}

	/**
	 * Watch for nav clones (e.g. Nextora mobile portal) and enhance them.
	 */
	function observeNavClones() {
		const mounts = document.querySelectorAll(
			'[data-nextora-nav-portal-mount], [data-nextora-nav-source-panel]'
		);

		if ( ! mounts.length ) {
			return;
		}

		mounts.forEach( ( mount ) => {
			if ( ! ( mount instanceof HTMLElement ) ) {
				return;
			}

			enhanceItems( mount );

			const observer = new MutationObserver( () => {
				enhanceItems( mount );
			} );

			observer.observe( mount, { childList: true, subtree: true } );
		} );
	}

	/**
	 * Global delegated handlers — survive DOM clones and dynamic inserts.
	 */
	function bindDelegatedEvents() {
		document.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' ) {
				closeAll();
			}
		} );

		document.addEventListener( 'click', ( e ) => {
			const target = e.target;

			if ( ! ( target instanceof Element ) ) {
				return;
			}

			// Nextora mobile accordion toggle on mega items (capture before theme handler).
			const nextoraToggle = target.closest( '.nextora-submenu-toggle' );
			if ( nextoraToggle ) {
				const megaItem = nextoraToggle.closest( MEGA_ITEMS );
				if ( megaItem instanceof HTMLElement && isAccordionMode() ) {
					e.preventDefault();
					e.stopImmediatePropagation();
					toggleAccordion( megaItem, nextoraToggle );
					return;
				}
			}

			const snapToggle = target.closest( `.${ TOGGLE_CLASS }` );
			if ( snapToggle ) {
				const megaItem = snapToggle.closest( MEGA_ITEMS );
				if ( megaItem instanceof HTMLElement ) {
					e.preventDefault();
					e.stopPropagation();
					toggleAccordion( megaItem, snapToggle );
					return;
				}
			}

			const link = target.closest( `${ MEGA_ITEMS } > a` );
			if ( link ) {
				const megaItem = link.closest( MEGA_ITEMS );
				const panel = megaItem?.querySelector( `:scope > .${ PANEL_CLASS }` );

				if ( megaItem instanceof HTMLElement && panel ) {
					handleLinkClick( e, megaItem, panel, link );
					return;
				}
			}

			if ( ! target.closest( MEGA_ITEMS ) ) {
				closeAll();
			}
		}, true );

		document.addEventListener(
			'focusout',
			( e ) => {
				if ( isAccordionMode() ) {
					return;
				}

				const related = e.relatedTarget;
				if ( ! ( related instanceof Node ) ) {
					return;
				}

				document.querySelectorAll( `${ MEGA_ITEMS }` ).forEach( ( item ) => {
					if ( ! ( item instanceof HTMLElement ) ) {
						return;
					}

					if ( item.contains( related ) ) {
						return;
					}

					const panel = item.querySelector( `:scope > .${ PANEL_CLASS }` );
					const link = item.querySelector( ':scope > a' );

					if ( panel?.classList.contains( OPEN_CLASS ) && link ) {
						closePanel( panel, link, item );
					}
				} );
			},
			true
		);
	}

	/**
	 * Set up a single mega menu item (ARIA + mobile toggle injection).
	 *
	 * @param {HTMLElement} item The li.has-mega-menu element.
	 */
	function setupItem( item ) {
		const link = item.querySelector( ':scope > a' );
		const panel = item.querySelector( `:scope > .${ PANEL_CLASS }` );

		if ( ! link || ! panel ) {
			return;
		}

		const panelId =
			panel.id ||
			'snap-mega-panel-' +
				( item.id || Math.random().toString( 36 ).slice( 2, 8 ) );

		panel.id = panelId;
		link.setAttribute( 'aria-haspopup', 'true' );
		link.setAttribute( ARIA_EXPANDED, 'false' );
		link.setAttribute( 'aria-controls', panelId );

		maybeInjectToggle( item, link );
	}

	/**
	 * Inject accordion toggle when theme does not provide one (mobile/tablet).
	 *
	 * @param {HTMLElement} item Menu item.
	 * @param {HTMLElement} link Trigger link.
	 */
	function maybeInjectToggle( item, link ) {
		if ( item.querySelector( `:scope > .${ TOGGLE_CLASS }` ) ) {
			return;
		}

		if ( item.querySelector( ':scope > .nextora-submenu-toggle' ) ) {
			return;
		}

		const toggle = document.createElement( 'button' );
		toggle.type = 'button';
		toggle.className = TOGGLE_CLASS;
		toggle.setAttribute( 'aria-expanded', 'false' );
		toggle.setAttribute( 'aria-haspopup', 'true' );

		const label = link.textContent?.trim() || '';
		toggle.setAttribute(
			'aria-label',
			label ? `Toggle mega menu for ${ label }` : 'Toggle mega menu'
		);

		toggle.innerHTML =
			'<span class="snap-megamenu-toggle__icon" aria-hidden="true">' +
			'<svg viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
			'<path d="M1.5 1.75 6 6.25l4.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
			'</svg></span>';

		link.insertAdjacentElement( 'afterend', toggle );
	}

	/**
	 * Handle top-level link clicks.
	 *
	 * @param {Event}         e     Click event.
	 * @param {HTMLElement}   item  Menu item.
	 * @param {HTMLElement}   panel Mega panel.
	 * @param {HTMLElement}   link  Trigger link.
	 */
	function handleLinkClick( e, item, panel, link ) {
		if ( ! isAccordionMode() ) {
			const isOpen = panel.classList.contains( OPEN_CLASS );

			if ( isOpen && link.getAttribute( 'href' ) !== '#' ) {
				return;
			}

			e.preventDefault();
			toggleFlyout( item, panel, link );
			return;
		}

		// Accordion: link navigates; panel opens via toggle button only.
		if ( link.getAttribute( 'href' ) === '#' || link.getAttribute( 'href' ) === '' ) {
			e.preventDefault();
			const toggle =
				item.querySelector( `:scope > .${ TOGGLE_CLASS }` ) ||
				item.querySelector( ':scope > .nextora-submenu-toggle' );
			toggleAccordion( item, toggle );
		}
	}

	/**
	 * Toggle desktop flyout panel.
	 *
	 * @param {HTMLElement} item  Menu item.
	 * @param {HTMLElement} panel Panel element.
	 * @param {HTMLElement} link  Trigger link.
	 */
	function toggleFlyout( item, panel, link ) {
		const isOpen = panel.classList.contains( OPEN_CLASS );

		closeAll();

		if ( ! isOpen ) {
			openPanel( panel, link, item );
		}
	}

	/**
	 * Toggle mobile/tablet accordion panel.
	 *
	 * @param {HTMLElement}      item   Menu item.
	 * @param {HTMLElement|null} toggle Toggle control, if any.
	 */
	function toggleAccordion( item, toggle ) {
		const panel = item.querySelector( `:scope > .${ PANEL_CLASS }` );
		const link = item.querySelector( ':scope > a' );

		if ( ! panel || ! link ) {
			return;
		}

		const isOpen = item.classList.contains( ACCORDION_CLASS );

		closeSiblingAccordions( item );

		if ( isOpen ) {
			closePanel( panel, link, item );
		} else {
			openPanel( panel, link, item );
		}

		if ( toggle ) {
			toggle.setAttribute( ARIA_EXPANDED, isOpen ? 'false' : 'true' );
		}
	}

	/**
	 * Close other open accordions at the same menu level.
	 *
	 * @param {HTMLElement} item Current item.
	 */
	function closeSiblingAccordions( item ) {
		const parent = item.parentElement;

		if ( ! parent ) {
			return;
		}

		parent.querySelectorAll( `:scope > ${ MEGA_ITEMS }.${ ACCORDION_CLASS }` ).forEach(
			( sibling ) => {
				if ( sibling === item || ! ( sibling instanceof HTMLElement ) ) {
					return;
				}

				const panel = sibling.querySelector( `:scope > .${ PANEL_CLASS }` );
				const link = sibling.querySelector( ':scope > a' );
				const toggle =
					sibling.querySelector( `:scope > .${ TOGGLE_CLASS }` ) ||
					sibling.querySelector( ':scope > .nextora-submenu-toggle' );

				if ( panel && link ) {
					closePanel( panel, link, sibling );
				}

				toggle?.setAttribute( ARIA_EXPANDED, 'false' );
			}
		);
	}

	/**
	 * Open a panel.
	 *
	 * @param {HTMLElement} panel Panel element.
	 * @param {HTMLElement} link  Trigger link.
	 * @param {HTMLElement} item  Menu item.
	 */
	function openPanel( panel, link, item ) {
		panel.classList.add( OPEN_CLASS );
		item.classList.add( ACCORDION_CLASS );
		link.setAttribute( ARIA_EXPANDED, 'true' );
	}

	/**
	 * Close a single panel.
	 *
	 * @param {HTMLElement} panel Panel element.
	 * @param {HTMLElement} link  Trigger link.
	 * @param {HTMLElement} item  Menu item.
	 */
	function closePanel( panel, link, item ) {
		panel.classList.remove( OPEN_CLASS );
		item.classList.remove( ACCORDION_CLASS );
		link.setAttribute( ARIA_EXPANDED, 'false' );

		const toggle =
			item.querySelector( `:scope > .${ TOGGLE_CLASS }` ) ||
			item.querySelector( ':scope > .nextora-submenu-toggle' );
		toggle?.setAttribute( ARIA_EXPANDED, 'false' );
	}

	/**
	 * Close all open mega panels.
	 */
	function closeAll() {
		document
			.querySelectorAll( `${ MEGA_ITEMS }` )
			.forEach( ( item ) => {
				if ( ! ( item instanceof HTMLElement ) ) {
					return;
				}

				const panel = item.querySelector( `:scope > .${ PANEL_CLASS }` );
				const link = item.querySelector( ':scope > a' );

				if ( panel && link ) {
					closePanel( panel, link, item );
				}
			} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
