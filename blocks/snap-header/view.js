/**
 * Snap Header — frontend JS engine.
 *
 * Handles sticky positioning (spacer + sentinel), scroll effects,
 * Nav Toggle activation, clone-to-body mobile portal, focus trap,
 * scroll lock, and resume-aware teardown.
 *
 * Loaded via viewScript — only when a snap-header block is on the page.
 *
 * @package Snap\MegaMenu
 */
(function () {
	'use strict';

	var HEADER_SELECTOR = '.wp-block-snap-megamenu-snap-header.is-sticky';
	var TOGGLE_SELECTOR = '.wp-block-snap-megamenu-nav-toggle';
	var NAV_SELECTOR = '.wp-block-snap-megamenu-snap-navigation';
	var PORTAL_CLASS = 'snap-nav-portal';
	var FIXED_CLASS = 'is-fixed-active';

	var instances = new WeakMap();

	/**
	 * Locate all sticky headers on the page and initialize them.
	 */
	function init() {
		var headers = document.querySelectorAll(HEADER_SELECTOR);
		if (!headers.length) {
			return;
		}
		Array.prototype.forEach.call(headers, initHeader);
	}

	/**
	 * Initialize one Snap Header instance.
	 *
	 * @param {HTMLElement} header The .wp-block-snap-megamenu-snap-header element.
	 */
	function initHeader(header) {
		if (instances.has(header)) {
			return;
		}

		var breakpointRaw = header.getAttribute('data-breakpoint');
		var breakpoint = parseInt(breakpointRaw, 10) || 782;
		var instanceId = header.getAttribute('data-instance') || '';

		var state = {
			header: header,
			breakpoint: breakpoint,
			instanceId: instanceId,
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
		var effect = header.getAttribute('data-scroll-effect') || 'none';

		// Sentinel — 1px tall, positioned just before the header.
		var sentinel = document.createElement('div');
		sentinel.className = 'snap-hdr-sentinel';
		sentinel.style.cssText =
			'height:1px;width:1px;position:absolute;top:-1px;left:0;pointer-events:none;';
		header.parentNode.insertBefore(sentinel, header);

		// Spacer — keeps page content from jumping when header becomes fixed.
		var spacer = document.createElement('div');
		spacer.className = 'snap-hdr-spacer';
		spacer.setAttribute('aria-hidden', 'true');
		header.parentNode.insertBefore(spacer, header);

		function measureSpacer() {
			if (!header.classList.contains('is-stuck')) {
				spacer.style.height = header.offsetHeight + 'px';
			}
		}

		var ro = new ResizeObserver(measureSpacer);
		ro.observe(header);
		measureSpacer();

		// IntersectionObserver for "stuck" detection.
		var io = new IntersectionObserver(
			function (entries) {
				var isStuck = !entries[0].isIntersecting;
				header.classList.toggle('is-stuck', isStuck);
			},
			{ threshold: 0 }
		);
		io.observe(sentinel);

		// Enable fixed positioning AFTER spacer is sized (no FOUC).
		header.classList.add(FIXED_CLASS);

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
		var ticking = false;

		function onScroll() {
			if (ticking) {
				return;
			}
			ticking = true;
			requestAnimationFrame(function () {
				var scrollY = window.pageYOffset || document.documentElement.scrollTop;
				var isDown = scrollY > state.lastScrollY && scrollY > 100;

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
		var toggles = header.querySelectorAll(TOGGLE_SELECTOR);
		Array.prototype.forEach.call(toggles, function (toggle) {
			if (!(toggle instanceof HTMLElement)) {
				return;
			}

			// Skip editor-only preview buttons.
			if (toggle.classList.contains('snap-nav-toggle-preview')) {
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
		var isBelowBreakpoint = window.innerWidth <= state.breakpoint;
		if (!isBelowBreakpoint) {
			return;
		}

		if (state.isPortalOpen) {
			closePortal(state);
			toggle.setAttribute('aria-expanded', 'false');
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
	 * Deep-clone the Snap Navigation subtree, sanitize it, wrap in portal,
	 * and append to document.body.
	 *
	 * @param {Object} state Instance state.
	 */
	function createPortal(state) {
		var header = state.header;
		var nav = header.querySelector(NAV_SELECTOR);

		if (!(nav instanceof HTMLElement)) {
			return;
		}

		// Clone the entire navigation subtree.
		var clone = nav.cloneNode(true);

		// Sanitize: rewrite all IDs to avoid duplicates.
		sanitizeClone(clone, state.instanceId);

		// Create portal root.
		var portalRoot = document.createElement('div');
		portalRoot.className = PORTAL_CLASS;
		portalRoot.id = 'overlay-' + state.instanceId;
		portalRoot.setAttribute('data-state', 'closed');
		portalRoot.setAttribute('data-instance', state.instanceId);
		portalRoot.setAttribute('role', 'dialog');
		portalRoot.setAttribute('aria-modal', 'true');
		portalRoot.setAttribute('aria-label', 'Site navigation');

		// Mirror critical CSS custom properties from the header.
		mirrorCSSVariables(header, portalRoot);

		portalRoot.appendChild(clone);
		document.body.appendChild(portalRoot);

		// Re-init the existing menu engine on the cloned subtree.
		if (typeof window.snapMegaMenuReInit === 'function') {
			window.snapMegaMenuReInit(portalRoot);
		}

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
	 * @param {Node}   subtree   Cloned node.
	 * @param {string} instanceId Instance ID for suffix.
	 */
	function sanitizeClone(subtree, instanceId) {
		if (!(subtree instanceof Element)) {
			return;
		}

		// Rewrite IDs.
		if (subtree.hasAttribute('id')) {
			var originalId = subtree.getAttribute('id');
			subtree.setAttribute('id', originalId + '--portal-' + instanceId);
		}

		// Strip editor-only attributes.
		var editorAttrs = ['data-block', 'data-type', 'data-title'];
		for (var i = 0; i < editorAttrs.length; i++) {
			if (subtree.hasAttribute(editorAttrs[i])) {
				subtree.removeAttribute(editorAttrs[i]);
			}
		}

		// Walk children.
		var children = subtree.children;
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
		var computed = getComputedStyle(source);
		var varsToMirror = [
			'--wp--preset--color--background',
			'--wp--preset--color--foreground',
			'--wp--preset--color--primary',
			'--wp--preset--font-size--medium',
			'--wp--preset--font-family--body',
			'--wp--style--root--padding-left',
			'--wp--style--root--padding-right',
			'--snap-megamenu-mega-bg',
			'--snap-megamenu-mega-shadow',
			'--snap-megamenu-mega-padding',
			'--snap-megamenu-mega-z',
		];

		var styles = '';
		for (var i = 0; i < varsToMirror.length; i++) {
			var val = computed.getPropertyValue(varsToMirror[i]).trim();
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
		var portalRoot = state.portalRoot;
		if (!portalRoot) {
			return;
		}

		portalRoot.setAttribute('data-state', 'open');
		portalRoot.style.display = '';
		state.isPortalOpen = true;

		// Body scroll lock.
		lockScroll(state);

		// Focus trap: focus first focusable element in the portal.
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
		var portalRoot = state.portalRoot;
		if (!portalRoot) {
			return;
		}

		portalRoot.setAttribute('data-state', 'closed');
		state.isPortalOpen = false;

		// Restore body scroll.
		unlockScroll(state);

		// Return focus to the toggle that opened the portal.
		if (state.activeToggle instanceof HTMLElement) {
			state.activeToggle.focus();
		}
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
		var focusable = getFocusableElements(container);
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
		var focusable = getFocusableElements(container);
		if (!focusable.length) {
			return;
		}

		var first = focusable[0];
		var last = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	/**
	 * Get all focusable elements within a container.
	 *
	 * @param {HTMLElement} container Container element.
	 * @return {HTMLElement[]}
	 */
	function getFocusableElements(container) {
		var selectors = [
			'a[href]',
			'button:not([disabled])',
			'input:not([disabled]):not([type="hidden"])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
		];

		var elements = container.querySelectorAll(selectors.join(','));
		return Array.prototype.filter.call(elements, function (el) {
			return el.offsetParent !== null || el === container;
		});
	}

	/* --------------------------------------------------------------------
	 * Scroll lock
	 * ----------------------------------------------------------------- */

	function lockScroll(state) {
		state.scrollY = window.pageYOffset || document.documentElement.scrollTop;
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
		var previousBelow = window.innerWidth <= state.breakpoint;

		function onResize() {
			var isBelow = window.innerWidth <= state.breakpoint;

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
	window.snapHeaderTeardown = function () {
		document
			.querySelectorAll(HEADER_SELECTOR)
			.forEach(function (header) {
				if (instances.has(header)) {
					teardown(instances.get(header));
				}
			});
	};
})();
