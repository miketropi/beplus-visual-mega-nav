/**
 * BePlus Header — frontend JS engine.
 *
 * Handles sticky positioning (spacer + sentinel), scroll effects,
 * Nav Toggle activation, clone-to-body mobile portal, focus trap,
 * scroll lock, and resume-aware teardown.
 *
 * Loaded via viewScript — only when a beplus-header block is on the page.
 *
 * @package
 */
(function () {
	'use strict';

	const HEADER_SELECTOR =
		'.wp-block-beplus-visual-mega-nav-beplus-header.is-sticky';
	const NAVIGATION_SELECTOR =
		'.wp-block-beplus-visual-mega-nav-beplus-navigation';
	const TOGGLE_SELECTOR = '.wp-block-beplus-visual-mega-nav-nav-toggle';
	const MENU_AREA_SELECTOR = '.wp-block-beplus-visual-mega-nav-nav-menu-area';
	const PORTAL_CLASS = 'beplus-nav-portal';
	const FIXED_CLASS = 'is-fixed-active';

	const instances = new WeakMap();

	/**
	 * Locate all sticky headers on the page and initialize them.
	 */
	function init() {
		const headers = document.querySelectorAll(HEADER_SELECTOR);
		if (!headers.length) {
			return;
		}
		Array.prototype.forEach.call(headers, initHeader);
	}

	/**
	 * Initialize one BePlus Header instance.
	 *
	 * @param {HTMLElement} header The .wp-block-beplus-visual-mega-nav-beplus-header element.
	 */
	function initHeader(header) {
		if (instances.has(header)) {
			return;
		}

		// Prefer the Navigation block's mobile breakpoint; fall back
		// to the Header block's data-breakpoint for backward compatibility.
		const navBlock = header.querySelector(NAVIGATION_SELECTOR);
		const breakpointRaw =
			(navBlock && navBlock.getAttribute('data-mobile-breakpoint')) ||
			header.getAttribute('data-breakpoint');
		const breakpoint = parseInt(breakpointRaw, 10) || 782;
		const instanceId = header.getAttribute('data-instance') || '';

		const state = {
			header,
			breakpoint,
			instanceId,
			portalRoot: null,
			portalCreated: false,
			activeToggle: null,
			lastScrollY: 0,
			isPortalOpen: false,
		};

		instances.set(header, state);

		initSticky(header, state);
		initToggles(header, state);
		bindResize(header, state);
	}

	/* --------------------------------------------------------------------
	 * Sticky header (sentinel + spacer)
	 * ----------------------------------------------------------------- */

	/**
	 * Create sentinel, spacer, and observers for a sticky header.
	 *
	 * @param {HTMLElement} header Header element.
	 * @param {Object}      state  Instance state.
	 */
	function initSticky(header, state) {
		const effect = header.getAttribute('data-scroll-effect') || 'none';

		// Sentinel — 1px tall block in normal flow, right before the header.
		const sentinel = document.createElement('div');
		sentinel.className = 'beplus-hdr-sentinel';
		sentinel.style.cssText = 'height:1px;pointer-events:none;';
		header.parentNode.insertBefore(sentinel, header);

		// Spacer — keeps page content from jumping when header becomes fixed.
		const spacer = document.createElement('div');
		spacer.className = 'beplus-hdr-spacer';
		spacer.setAttribute('aria-hidden', 'true');
		spacer.style.display = 'none';
		header.parentNode.insertBefore(spacer, header);

		function measureSpacer() {
			spacer.style.height = header.offsetHeight + 'px';
		}

		const ro = new ResizeObserver(measureSpacer);
		ro.observe(header);
		measureSpacer();

		// IntersectionObserver with admin bar offset so the sentinel
		// triggers when it scrolls past the admin bar, not the viewport top.
		function createStickyIO() {
			const bar = document.getElementById('wpadminbar');
			const barHeight = bar ? bar.offsetHeight : 0;
			const obs = new IntersectionObserver(
				function (entries) {
					const isStuck = !entries[0].isIntersecting;
					header.classList.toggle('is-stuck', isStuck);
					header.classList.toggle(FIXED_CLASS, isStuck);
					spacer.style.display = isStuck ? 'block' : 'none';
				},
				{
					threshold: 0,
					rootMargin: '-' + barHeight + 'px 0px 0px 0px',
				}
			);
			obs.observe(sentinel);
			return obs;
		}

		const io = createStickyIO();

		// Watch admin bar for height changes (desktop 32 px ↔ mobile 46 px).
		const adminBar = document.getElementById('wpadminbar');
		if (adminBar) {
			const barRO = new ResizeObserver(function () {
				if (state.io) {
					state.io.disconnect();
				}
				state.io = createStickyIO();
			});
			barRO.observe(adminBar);
			state.barRO = barRO;
		}

		// Scroll effects that need a scroll listener.
		if (effect === 'hide-on-scroll') {
			bindScrollHide(header, state);
		}

		// Persist for teardown.
		state.sentinel = sentinel;
		state.spacer = spacer;
		state.ro = ro;
		state.io = io;
		state.effect = effect;
	}

	/**
	 * Track scroll direction for "hide-on-scroll" effect.
	 *
	 * @param {HTMLElement} header Header element.
	 * @param {Object}      state  Instance state.
	 */
	function bindScrollHide(header, state) {
		let ticking = false;

		function onScroll() {
			if (ticking) {
				return;
			}
			ticking = true;
			requestAnimationFrame(function () {
				const scrollY =
					window.pageYOffset || document.documentElement.scrollTop;
				const isDown = scrollY > state.lastScrollY && scrollY > 100;

				if (isDown) {
					header.classList.add('is-hidden');
				} else {
					header.classList.remove('is-hidden');
				}

				state.lastScrollY = scrollY;
				ticking = false;
			});
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		state.scrollListener = onScroll;
	}

	/* --------------------------------------------------------------------
	 * Nav Toggle → mobile portal
	 * ----------------------------------------------------------------- */

	/**
	 * Attach click handlers to every Nav Toggle inside this header.
	 *
	 * @param {HTMLElement} header Header element.
	 * @param {Object}      state  Instance state.
	 */
	function initToggles(header, state) {
		const toggles = header.querySelectorAll(TOGGLE_SELECTOR);
		Array.prototype.forEach.call(toggles, function (toggle) {
			if (!(toggle instanceof HTMLElement)) {
				return;
			}

			// Skip editor-only preview buttons.
			if (toggle.classList.contains('beplus-nav-toggle-preview')) {
				return;
			}

			toggle.addEventListener('click', function (e) {
				e.preventDefault();
				handleToggleClick(toggle, state);
			});

			toggle.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleToggleClick(toggle, state);
				}
			});
		});
	}

	/**
	 * Toggle the mobile portal open/closed.
	 *
	 * @param {HTMLElement} toggle The toggle button.
	 * @param {Object}      state  Instance state.
	 */
	function handleToggleClick(toggle, state) {
		const isBelowBreakpoint = window.innerWidth <= state.breakpoint;
		if (!isBelowBreakpoint) {
			return;
		}

		if (state.isPortalOpen) {
			state.activeToggle = toggle;
			closePortal(state);
			state.activeToggle = null;
		} else {
			// Lazy-create portal on first activation.
			if (!state.portalCreated) {
				createPortal(state);
			}
			openPortal(state);
			toggle.setAttribute('aria-expanded', 'true');
			state.activeToggle = toggle;
		}
	}

	/**
	 * Deep-clone the BePlus Navigation subtree, sanitize it, wrap in portal,
	 * and append to document.body.
	 *
	 * @param {Object} state Instance state.
	 */
	function createPortal(state) {
		const header = state.header;
		const menuArea = header.querySelector(MENU_AREA_SELECTOR);

		if (!(menuArea instanceof HTMLElement)) {
			return;
		}

		// Clone the menu area subtree (nav menu only, no toggle).
		const clone = menuArea.cloneNode(true);

		// Sanitize: rewrite all IDs to avoid duplicates.
		sanitizeClone(clone, state.instanceId);

		// Create portal root.
		const portalRoot = document.createElement('div');
		portalRoot.className = PORTAL_CLASS;
		portalRoot.id = 'overlay-' + state.instanceId;
		portalRoot.setAttribute('data-state', 'closed');
		portalRoot.setAttribute('data-instance', state.instanceId);
		portalRoot.setAttribute('role', 'dialog');
		portalRoot.setAttribute('aria-modal', 'true');
		portalRoot.setAttribute('aria-label', 'Site navigation');

		// Mirror critical CSS custom properties from the header.
		mirrorCSSVariables(header, portalRoot);

		// Close button.
		const closeBtn = document.createElement('button');
		closeBtn.className = 'beplus-nav-portal__close';
		closeBtn.type = 'button';
		closeBtn.setAttribute('aria-label', 'Close navigation');
		closeBtn.innerHTML =
			'<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
			'<span>Close</span>';
		closeBtn.addEventListener('click', function () {
			closePortal(state);
		});
		portalRoot.appendChild(closeBtn);

		portalRoot.appendChild(clone);
		document.body.appendChild(portalRoot);

		// Re-init the existing mega menu engine on the cloned subtree.
		if (typeof window.beplusVmnReInit === 'function') {
			window.beplusVmnReInit(portalRoot);
		}

		// Notify block viewScripts (Quote, Blog List, Hero Artwork, etc.)
		// that a fresh clone of the nav DOM exists so they can re-scan
		// for new block instances inside the portal.
		document.dispatchEvent(
			new CustomEvent('beplus:portal-ready', {
				detail: { portal: portalRoot },
			})
		);

		// Bind close-on-backdrop-click.
		portalRoot.addEventListener('click', function (e) {
			if (e.target === portalRoot) {
				closePortal(state);
			}
		});

		state.portalRoot = portalRoot;
		state.portalCreated = true;
	}

	/**
	 * Walk the cloned subtree and rewrite all id attributes to avoid
	 * duplicates with the original DOM. Also strips editor-only attrs.
	 *
	 * @param {Node}   subtree    Cloned node.
	 * @param {string} instanceId Instance ID for suffix.
	 */
	function sanitizeClone(subtree, instanceId) {
		if (!(subtree instanceof Element)) {
			return;
		}

		// Rewrite IDs.
		if (subtree.hasAttribute('id')) {
			const originalId = subtree.getAttribute('id');
			subtree.setAttribute('id', originalId + '--portal-' + instanceId);
		}

		// Strip editor-only attributes.
		const editorAttrs = ['data-block', 'data-type', 'data-title'];
		for (let i = 0; i < editorAttrs.length; i++) {
			if (subtree.hasAttribute(editorAttrs[i])) {
				subtree.removeAttribute(editorAttrs[i]);
			}
		}

		// Walk children.
		const children = subtree.children;
		if (children) {
			Array.prototype.forEach.call(children, function (child) {
				sanitizeClone(child, instanceId);
			});
		}
	}

	/**
	 * Copy critical CSS custom properties from the source header to the
	 * portal root so it inherits theme-driven colors and typography.
	 *
	 * @param {HTMLElement} source     The header element.
	 * @param {HTMLElement} portalRoot The portal root element.
	 */
	function mirrorCSSVariables(source, portalRoot) {
		const computed = getComputedStyle(source);
		const varsToMirror = [
			'--wp--preset--color--background',
			'--wp--preset--color--foreground',
			'--wp--preset--color--primary',
			'--wp--preset--font-size--medium',
			'--wp--preset--font-family--body',
			'--wp--style--root--padding-left',
			'--wp--style--root--padding-right',
			'--beplus-vmn-mega-bg',
			'--beplus-vmn-mega-shadow',
			'--beplus-vmn-mega-padding',
			'--beplus-vmn-mega-z',
		];

		let styles = '';
		for (let i = 0; i < varsToMirror.length; i++) {
			const val = computed.getPropertyValue(varsToMirror[i]).trim();
			if (val) {
				styles += varsToMirror[i] + ':' + val + ';';
			}
		}

		if (styles) {
			portalRoot.style.cssText += styles;
		}
	}

	/**
	 * Open the mobile portal: show, focus-trap, scroll-lock.
	 *
	 * @param {Object} state Instance state.
	 */
	function openPortal(state) {
		const portalRoot = state.portalRoot;
		if (!portalRoot || state.isPortalOpen) {
			return;
		}

		// Body scroll lock (immediate, before animation).
		lockScroll(state);

		portalRoot.setAttribute('data-state', 'open');
		state.isPortalOpen = true;

		// Focus first focusable element (close button) after transition starts.
		requestAnimationFrame(function () {
			focusFirst(portalRoot);
		});

		// Esc key handler.
		if (!state.escHandler) {
			state.escHandler = function (e) {
				if (e.key === 'Escape' && state.isPortalOpen) {
					closePortal(state);
				}
			};
			document.addEventListener('keydown', state.escHandler);
		}

		// Tab trap.
		if (!state.tabTrapHandler) {
			state.tabTrapHandler = function (e) {
				if (e.key !== 'Tab' || !state.isPortalOpen) {
					return;
				}
				trapFocus(e, state.portalRoot);
			};
			document.addEventListener('keydown', state.tabTrapHandler);
		}
	}

	/**
	 * Close the mobile portal: hide, restore scroll, return focus.
	 *
	 * @param {Object} state Instance state.
	 */
	function closePortal(state) {
		const portalRoot = state.portalRoot;
		if (!portalRoot || !state.isPortalOpen) {
			return;
		}

		portalRoot.setAttribute('data-state', 'closed');
		state.isPortalOpen = false;

		// Return focus and update aria.
		if (state.activeToggle instanceof HTMLElement) {
			state.activeToggle.focus();
			state.activeToggle.setAttribute('aria-expanded', 'false');
		}

		// Delay scroll unlock until transition finishes.
		let done = false;
		function finish() {
			if (done) {
				return;
			}
			done = true;
			unlockScroll(state);
			portalRoot.removeEventListener('transitionend', finish);
		}
		portalRoot.addEventListener('transitionend', finish);
		// Fallback in case transitionend doesn't fire (e.g. reduced motion).
		setTimeout(finish, 400);
	}

	/* --------------------------------------------------------------------
	 * Focus management
	 * ----------------------------------------------------------------- */

	/**
	 * Focus the first focusable element inside a container.
	 *
	 * @param {HTMLElement} container Container element.
	 */
	function focusFirst(container) {
		const focusable = getFocusableElements(container);
		if (focusable.length) {
			focusable[0].focus();
		} else {
			container.focus();
		}
	}

	/**
	 * Trap Tab / Shift+Tab within a container.
	 *
	 * @param {KeyboardEvent} e         Event.
	 * @param {HTMLElement}   container Container element.
	 */
	function trapFocus(e, container) {
		const focusable = getFocusableElements(container);
		if (!focusable.length) {
			return;
		}

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else if (document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	/**
	 * Get all focusable elements within a container.
	 *
	 * @param {HTMLElement} container Container element.
	 * @return {HTMLElement[]} Array of focusable elements.
	 */
	function getFocusableElements(container) {
		const selectors = [
			'a[href]',
			'button:not([disabled])',
			'input:not([disabled]):not([type="hidden"])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
		];

		const elements = container.querySelectorAll(selectors.join(','));
		return Array.prototype.filter.call(elements, function (el) {
			return el.offsetParent !== null || el === container;
		});
	}

	/* --------------------------------------------------------------------
	 * Scroll lock
	 * ----------------------------------------------------------------- */

	function lockScroll(state) {
		state.scrollY =
			window.pageYOffset || document.documentElement.scrollTop;
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
		document.body.style.position = 'fixed';
		document.body.style.top = '-' + state.scrollY + 'px';
		document.body.style.width = '100%';
	}

	function unlockScroll(state) {
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.width = '';

		if (typeof state.scrollY === 'number') {
			window.scrollTo(0, state.scrollY);
		}
	}

	/* --------------------------------------------------------------------
	 * Resize handling
	 * ----------------------------------------------------------------- */

	/**
	 * Close portal if viewport crosses above the breakpoint while open.
	 *
	 * @param {HTMLElement} header Header element.
	 * @param {Object}      state  Instance state.
	 */
	function bindResize(header, state) {
		let previousBelow = window.innerWidth <= state.breakpoint;

		function onResize() {
			const isBelow = window.innerWidth <= state.breakpoint;

			if (!isBelow && previousBelow && state.isPortalOpen) {
				closePortal(state);
				if (state.activeToggle instanceof HTMLElement) {
					state.activeToggle.setAttribute('aria-expanded', 'false');
				}
				state.activeToggle = null;
			}

			previousBelow = isBelow;
		}

		window.addEventListener('resize', onResize);
		state.resizeListener = onResize;
	}

	/* --------------------------------------------------------------------
	 * Teardown
	 * ----------------------------------------------------------------- */

	/**
	 * Full teardown — remove portal, observers, listeners.
	 *
	 * @param {Object} state Instance state.
	 */
	function teardown(state) {
		if (state.portalRoot && state.portalRoot.parentNode) {
			state.portalRoot.parentNode.removeChild(state.portalRoot);
		}

		if (state.ro) {
			state.ro.disconnect();
		}

		if (state.io) {
			state.io.disconnect();
		}

		if (state.sentinel && state.sentinel.parentNode) {
			state.sentinel.parentNode.removeChild(state.sentinel);
		}

		if (state.spacer && state.spacer.parentNode) {
			state.spacer.parentNode.removeChild(state.spacer);
		}

		if (state.scrollListener) {
			window.removeEventListener('scroll', state.scrollListener);
		}

		if (state.resizeListener) {
			window.removeEventListener('resize', state.resizeListener);
		}

		if (state.escHandler) {
			document.removeEventListener('keydown', state.escHandler);
		}

		if (state.tabTrapHandler) {
			document.removeEventListener('keydown', state.tabTrapHandler);
		}

		if (state.barRO) {
			state.barRO.disconnect();
		}

		state.header.classList.remove(FIXED_CLASS, 'is-stuck', 'is-hidden');
	}

	/* --------------------------------------------------------------------
	 * Bootstrap
	 * ----------------------------------------------------------------- */

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Expose public teardown for hot-module / SPA navigation.
	window.beplusHeaderTeardown = function () {
		document.querySelectorAll(HEADER_SELECTOR).forEach(function (header) {
			if (instances.has(header)) {
				teardown(instances.get(header));
			}
		});
	};
})();
