/**
 * Frontend: mega menu interaction & accessibility.
 *
 * Desktop (≥1024px): hover / focus flyout + optional click toggle.
 * Tablet (768–1023px): off-canvas panel sliding from right.
 * Mobile (<768px): accordion inline panels (works in cloned mobile nav portals).
 *
 * @package
 */

(function () {
	'use strict';

	const MEGA_ITEMS = '.has-mega-menu';
	const PANEL_CLASS = 'beplus-vmn-mega-panel';
	const OPEN_CLASS = 'is-open';
	const ACCORDION_CLASS = 'beplus-vmn--open';
	const TOGGLE_CLASS = 'beplus-vmn-toggle';
	const ENHANCED_ATTR = 'data-beplus-vmn-enhanced';
	const ARIA_EXPANDED = 'aria-expanded';

	/** Accordion mode — mobile only (<768px). */
	const ACCORDION_MQ = window.matchMedia('(max-width: 767px)');

	/**
	 * Whether the UI should use inline accordion instead of hover flyout.
	 *
	 * @return {boolean} Whether the viewport is in the accordion breakpoint.
	 */
	function isAccordionMode() {
		return ACCORDION_MQ.matches;
	}

	/** Off-canvas mode — tablet (768px–1023px). */
	const OFFCANVAS_MQ = window.matchMedia(
		'(min-width: 768px) and (max-width: 1023px)'
	);

	/**
	 * Whether to show the mega panel as a right-to-left off-canvas drawer.
	 *
	 * @return {boolean} Whether the viewport is in the off-canvas breakpoint.
	 */
	function isOffcanvasMode() {
		return OFFCANVAS_MQ.matches;
	}

	/**
	 * Get the cached panel element for a mega menu item.
	 *
	 * @param {HTMLElement} item The .has-mega-menu element.
	 * @return {HTMLElement|null} The panel element, or null if not found.
	 */
	function getPanel(item) {
		if (item._snapPanel instanceof HTMLElement) {
			return item._snapPanel;
		}

		const panel = item.querySelector(`:scope > .${PANEL_CLASS}`);
		if (panel instanceof HTMLElement) {
			item._snapPanel = panel;
			return panel;
		}

		return null;
	}

	/**
	 * Get the cached trigger link for a mega menu item.
	 *
	 * @param {HTMLElement} item The .has-mega-menu element.
	 * @return {HTMLElement|null} The anchor element, or null if not found.
	 */
	function getLink(item) {
		if (item._snapLink instanceof HTMLElement) {
			return item._snapLink;
		}

		const link = item.querySelector(':scope > a');
		if (link instanceof HTMLElement) {
			item._snapLink = link;
			return link;
		}

		return null;
	}

	/**
	 * Get or create the backdrop overlay used in off-canvas mode.
	 *
	 * @return {HTMLElement} The overlay element.
	 */
	function getOrCreateOverlay() {
		let overlay = document.querySelector('.beplus-vmn-overlay');
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.className = 'beplus-vmn-overlay';
			overlay.setAttribute('aria-hidden', 'true');
			document.body.appendChild(overlay);
			overlay.addEventListener('click', closeAll);
		}
		return overlay;
	}

	/**
	 * Show the off-canvas backdrop overlay.
	 */
	function showOverlay() {
		getOrCreateOverlay().classList.add('is-visible');
	}

	/**
	 * Hide the backdrop overlay and unlock body scroll.
	 */
	function hideOverlay() {
		const overlay = document.querySelector('.beplus-vmn-overlay');
		if (overlay) {
			overlay.classList.remove('is-visible');
		}
		document.body.style.overflow = '';
	}

	/**
	 * Initialize mega menu interactions.
	 */
	function init() {
		if (!document.querySelector(MEGA_ITEMS)) {
			return;
		}

		enhanceItems(document);
		observeNavClones();
		bindDelegatedEvents();

		ACCORDION_MQ.addEventListener('change', () => {
			closeAll();
			document.querySelectorAll(`[${ENHANCED_ATTR}]`).forEach((item) => {
				item.removeAttribute(ENHANCED_ATTR);
			});
			enhanceItems(document);
		});

		OFFCANVAS_MQ.addEventListener('change', () => {
			closeAll();
		});
	}

	/**
	 * Enhance mega menu items inside a root node (document or portal mount).
	 *
	 * @param {HTMLElement|Document} root Root to scan.
	 */
	function enhanceItems(root) {
		root.querySelectorAll(MEGA_ITEMS).forEach((item) => {
			if (!(item instanceof HTMLElement)) {
				return;
			}

			if (item.hasAttribute(ENHANCED_ATTR)) {
				return;
			}

			item.setAttribute(ENHANCED_ATTR, 'true');
			setupItem(item);
		});
	}

	/**
	 * Watch for nav clones (e.g. Nextora mobile portal) and enhance them.
	 */
	function observeNavClones() {
		const mounts = document.querySelectorAll(
			'[data-nextora-nav-portal-mount], [data-nextora-nav-source-panel]'
		);

		if (!mounts.length) {
			return;
		}

		mounts.forEach((mount) => {
			if (!(mount instanceof HTMLElement)) {
				return;
			}

			enhanceItems(mount);

			const observer = new MutationObserver(() => {
				enhanceItems(mount);
			});

			observer.observe(mount, { childList: true, subtree: true });
		});
	}

	/**
	 * Global delegated handlers — survive DOM clones and dynamic inserts.
	 */
	function bindDelegatedEvents() {
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				closeAll();
			}
		});

		document.addEventListener(
			'click',
			(e) => {
				const target = e.target;

				if (!(target instanceof Element)) {
					return;
				}

				// Nextora mobile accordion toggle on mega items (capture before theme handler).
				const nextoraToggle = target.closest('.nextora-submenu-toggle');
				if (nextoraToggle) {
					const megaItem = nextoraToggle.closest(MEGA_ITEMS);
					if (
						megaItem instanceof HTMLElement &&
						(isAccordionMode() || isOffcanvasMode())
					) {
						e.preventDefault();
						e.stopImmediatePropagation();
						toggleAccordion(megaItem, nextoraToggle);
						return;
					}
				}

				const snapToggle = target.closest(`.${TOGGLE_CLASS}`);
				if (snapToggle) {
					const megaItem = snapToggle.closest(MEGA_ITEMS);
					if (megaItem instanceof HTMLElement) {
						e.preventDefault();
						e.stopPropagation();
						toggleAccordion(megaItem, snapToggle);
						return;
					}
				}

				const link = target.closest(`${MEGA_ITEMS} > a`);
				if (link) {
					const megaItem = link.closest(MEGA_ITEMS);
					const panel =
						megaItem instanceof HTMLElement
							? getPanel(megaItem)
							: null;

					if (megaItem instanceof HTMLElement && panel) {
						handleLinkClick(e, megaItem, panel, link);
						return;
					}
				}

				if (
					!target.closest(MEGA_ITEMS) &&
					!target.closest(`.${PANEL_CLASS}`)
				) {
					closeAll();
				}
			},
			true
		);

		document.addEventListener(
			'focusout',
			(e) => {
				if (isAccordionMode()) {
					return;
				}

				const related = e.relatedTarget;
				if (!(related instanceof Node)) {
					return;
				}

				document.querySelectorAll(`${MEGA_ITEMS}`).forEach((item) => {
					if (!(item instanceof HTMLElement)) {
						return;
					}

					if (item.contains(related)) {
						return;
					}

					const panel = getPanel(item);

					if (panel && panel.contains(related)) {
						return;
					}

					const link = getLink(item);

					if (panel?.classList.contains(OPEN_CLASS) && link) {
						closePanel(panel, link, item);
					}
				});
			},
			true
		);
	}

	/**
	 * Set up a single mega menu item (ARIA + mobile toggle injection).
	 *
	 * @param {HTMLElement} item The li.has-mega-menu element.
	 */
	function setupItem(item) {
		const link = item.querySelector(':scope > a');
		const panel = item.querySelector(`:scope > .${PANEL_CLASS}`);

		if (!link || !panel) {
			return;
		}

		item._snapPanel = panel;
		item._snapLink = link;

		const panelId =
			panel.id ||
			'snap-mega-panel-' +
				(item.id || Math.random().toString(36).slice(2, 8));

		panel.id = panelId;
		link.setAttribute('aria-haspopup', 'true');
		link.setAttribute(ARIA_EXPANDED, 'false');
		link.setAttribute('aria-controls', panelId);

		maybeInjectToggle(item, link);
	}

	/**
	 * Inject accordion toggle when theme does not provide one (mobile/tablet).
	 *
	 * @param {HTMLElement} item Menu item.
	 * @param {HTMLElement} link Trigger link.
	 */
	function maybeInjectToggle(item, link) {
		if (item.querySelector(`:scope > .${TOGGLE_CLASS}`)) {
			return;
		}

		if (item.querySelector(':scope > .nextora-submenu-toggle')) {
			return;
		}

		const toggle = document.createElement('button');
		toggle.type = 'button';
		toggle.className = TOGGLE_CLASS;
		toggle.setAttribute('aria-expanded', 'false');
		toggle.setAttribute('aria-haspopup', 'true');

		const label = link.textContent?.trim() || '';
		toggle.setAttribute(
			'aria-label',
			label ? `Toggle mega menu for ${label}` : 'Toggle mega menu'
		);

		toggle.innerHTML =
			'<span class="beplus-vmn-toggle__icon" aria-hidden="true">' +
			'<svg viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
			'<path d="M1.5 1.75 6 6.25l4.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
			'</svg></span>';

		link.insertAdjacentElement('afterend', toggle);
	}

	/**
	 * Handle top-level link clicks.
	 *
	 * @param {Event}       e     Click event.
	 * @param {HTMLElement} item  Menu item.
	 * @param {HTMLElement} panel Mega panel.
	 * @param {HTMLElement} link  Trigger link.
	 */
	function handleLinkClick(e, item, panel, link) {
		if (!isAccordionMode() && !isOffcanvasMode()) {
			const isOpen = panel.classList.contains(OPEN_CLASS);

			if (isOpen && link.getAttribute('href') !== '#') {
				return;
			}

			e.preventDefault();
			toggleFlyout(item, panel, link);
			return;
		}

		// Accordion / off-canvas: link navigates; panel opens via toggle button only.
		if (
			link.getAttribute('href') === '#' ||
			link.getAttribute('href') === ''
		) {
			e.preventDefault();
			const toggle =
				item.querySelector(`:scope > .${TOGGLE_CLASS}`) ||
				item.querySelector(':scope > .nextora-submenu-toggle');
			toggleAccordion(item, toggle);
		}
	}

	/**
	 * Toggle desktop flyout panel.
	 *
	 * @param {HTMLElement} item  Menu item.
	 * @param {HTMLElement} panel Panel element.
	 * @param {HTMLElement} link  Trigger link.
	 */
	function toggleFlyout(item, panel, link) {
		const isOpen = panel.classList.contains(OPEN_CLASS);

		closeAll();

		if (!isOpen) {
			openPanel(panel, link, item);
		}
	}

	/**
	 * Toggle mobile/tablet accordion panel.
	 *
	 * @param {HTMLElement}      item   Menu item.
	 * @param {HTMLElement|null} toggle Toggle control, if any.
	 */
	function toggleAccordion(item, toggle) {
		const panel = getPanel(item);
		const link = getLink(item);

		if (!panel || !link) {
			return;
		}

		const isOpen = item.classList.contains(ACCORDION_CLASS);

		closeSiblingAccordions(item);

		if (isOpen) {
			closePanel(panel, link, item);
		} else {
			openPanel(panel, link, item);
		}

		if (toggle) {
			toggle.setAttribute(ARIA_EXPANDED, isOpen ? 'false' : 'true');
		}
	}

	/**
	 * Close other open accordions at the same menu level.
	 *
	 * @param {HTMLElement} item Current item.
	 */
	function closeSiblingAccordions(item) {
		const parent = item.parentElement;

		if (!parent) {
			return;
		}

		parent
			.querySelectorAll(`:scope > ${MEGA_ITEMS}.${ACCORDION_CLASS}`)
			.forEach((sibling) => {
				if (sibling === item || !(sibling instanceof HTMLElement)) {
					return;
				}

				const panel = getPanel(sibling);
				const link = getLink(sibling);
				const toggle =
					sibling.querySelector(`:scope > .${TOGGLE_CLASS}`) ||
					sibling.querySelector(':scope > .nextora-submenu-toggle');

				if (panel && link) {
					closePanel(panel, link, sibling);
				}

				toggle?.setAttribute(ARIA_EXPANDED, 'false');
			});
	}

	/**
	 * Open a panel.
	 *
	 * @param {HTMLElement} panel Panel element.
	 * @param {HTMLElement} link  Trigger link.
	 * @param {HTMLElement} item  Menu item.
	 */
	function openPanel(panel, link, item) {
		panel.classList.add(OPEN_CLASS);
		item.classList.add(ACCORDION_CLASS);
		link.setAttribute(ARIA_EXPANDED, 'true');

		if (isOffcanvasMode()) {
			portalToBody(panel);
			showOverlay();
			document.body.style.overflow = 'hidden';
		}
	}

	/**
	 * Close a single panel.
	 *
	 * @param {HTMLElement} panel Panel element.
	 * @param {HTMLElement} link  Trigger link.
	 * @param {HTMLElement} item  Menu item.
	 */
	function closePanel(panel, link, item) {
		panel.classList.remove(OPEN_CLASS);
		item.classList.remove(ACCORDION_CLASS);
		link.setAttribute(ARIA_EXPANDED, 'false');

		restoreFromBody(panel);

		const toggle =
			item.querySelector(`:scope > .${TOGGLE_CLASS}`) ||
			item.querySelector(':scope > .nextora-submenu-toggle');
		toggle?.setAttribute(ARIA_EXPANDED, 'false');
	}

	/**
	 * Move panel to document.body for reliable off-canvas fixed positioning.
	 *
	 * @param {HTMLElement} panel The panel element.
	 */
	function portalToBody(panel) {
		if (panel.parentElement && panel.parentElement !== document.body) {
			panel._snapOriginalParent = panel.parentElement;
			panel._snapOriginalNext = panel.nextSibling;
			document.body.appendChild(panel);
		}
	}

	/**
	 * Restore a previously portaled panel back to its original DOM position.
	 *
	 * @param {HTMLElement} panel The panel element.
	 */
	function restoreFromBody(panel) {
		if (!panel._snapOriginalParent) {
			return;
		}

		const parent = panel._snapOriginalParent;
		const next = panel._snapOriginalNext;

		if (next && next.parentElement === parent) {
			parent.insertBefore(panel, next);
		} else {
			parent.appendChild(panel);
		}

		panel._snapOriginalParent = null;
		panel._snapOriginalNext = null;
	}

	/**
	 * Close all open mega panels.
	 */
	function closeAll() {
		document.querySelectorAll(`${MEGA_ITEMS}`).forEach((item) => {
			if (!(item instanceof HTMLElement)) {
				return;
			}

			const panel = getPanel(item);
			const link = getLink(item);

			if (panel && link) {
				closePanel(panel, link, item);
			}
		});

		hideOverlay();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Public API for external scripts to re-init the menu engine
	// on a cloned subtree (e.g. Snap Header clone-to-body portal).
	window.beplusVmnReInit = enhanceItems;
})();
