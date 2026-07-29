/**
 * Blog List — mouse-tracking thumbnail preview.
 *
 * On hover of a list item with a data-thumbnail attribute, a
 * single floating <img> element follows the cursor with soft
 * lerp-based easing.  Inspired by the Nextora Related Posts
 * effect but implemented without GSAP.
 *
 * Uses event delegation on the parent <ul> (not per-item
 * listeners) and preloads thumbnail URLs so the first hover
 * shows an already-cached image.
 *
 * @package
 */
(function () {
	'use strict';

	const LIST_SEL = '.beplus-vmn-blog-list';
	const ITEMS_SEL = '.beplus-vmn-blog-list__items';
	const ITEM_SEL = '.beplus-vmn-blog-list__item[data-thumbnail]';
	const THUMB_SEL = '.beplus-blog-list-float-thumb';
	const VISIBLE_CLASS = 'is-visible';
	const HIDING_CLASS = 'is-hiding';

	/** Horizontal / vertical offset from cursor (px). */
	const OFFSET_X = 24;
	const OFFSET_Y = -24;

	/** Minimum distance from viewport edges (px). */
	const EDGE_PAD = 20;

	/** Lerp factor per frame — ~0.12 gives a GSAP 0.15 s feel at 60 fps. */
	const LERP = 0.12;

	/** Thumbnail dimensions (must match CSS custom properties). */
	const THUMB_W = 220;
	const THUMB_H = 140;

	/**
	 * Delay before clearing src after hide animation starts (ms).
	 *  Must be ≥ the CSS .is-hiding transition duration (0.2 s).
	 */
	const HIDE_CLEANUP_DELAY = 250;

	let instances = new WeakMap();

	/** Active motion-query listener so we can disconnect on teardown. */
	const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	let motionListener = null;
	let disabledByMotion = false;

	/**
	 * Linear interpolation.
	 *
	 * @param {number} a Start value.
	 * @param {number} b Target value.
	 * @param {number} t Interpolation factor (0–1).
	 * @return {number} Interpolated value.
	 */
	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	/**
	 * Check whether the device supports touch (no fine pointer).
	 *
	 * @return {boolean} True if touch-only.
	 */
	function isTouchDevice() {
		return (
			'ontouchstart' in window ||
			(navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
		);
	}

	/* --------------------------------------------------------------------
	 * Preloading — create hidden Image() objects so the browser caches
	 * thumbnail URLs before the first hover.
	 * ----------------------------------------------------------------- */

	function preloadThumbnails(list) {
		const items = list.querySelectorAll(ITEM_SEL);
		Array.prototype.forEach.call(items, function (item) {
			const url = item.getAttribute('data-thumbnail');
			if (url) {
				new Image().src = url;
			}
		});
	}

	/* --------------------------------------------------------------------
	 * Bootstrap
	 * ----------------------------------------------------------------- */

	function init() {
		if (isTouchDevice()) {
			return;
		}

		if (motionQuery.matches) {
			disabledByMotion = true;
			return;
		}

		const lists = document.querySelectorAll(LIST_SEL);
		if (!lists.length) {
			return;
		}
		Array.prototype.forEach.call(lists, initList);

		// Listen for OS-level reduced-motion changes.  If the user
		// enables it while the page is open, tear down all instances.
		motionListener = function (e) {
			if (e.matches) {
				disabledByMotion = true;
				teardownAll();
			} else if (disabledByMotion) {
				disabledByMotion = false;
				init();
			}
		};
		motionQuery.addEventListener('change', motionListener);
	}

	/**
	 * Initialize one blog list instance.
	 *
	 * @param {HTMLElement} list The .beplus-vmn-blog-list element.
	 */
	function initList(list) {
		if (instances.has(list)) {
			return;
		}

		const thumb = list.querySelector(THUMB_SEL);
		if (!(thumb instanceof HTMLImageElement)) {
			return;
		}

		const ul = list.querySelector(ITEMS_SEL);
		if (!ul) {
			return;
		}

		// Preload thumbnails so the first hover shows a cached image.
		preloadThumbnails(list);

		const state = {
			list,
			ul,
			thumb,
			currentX: 0,
			currentY: 0,
			targetX: 0,
			targetY: 0,
			active: false,
			rafId: null,
			visible: false,
			_hideTimer: null,
		};

		instances.set(list, state);
		bindDelegatedEvents(state);
	}

	/* --------------------------------------------------------------------
	 * Event delegation — listeners on the <ul>, match items via closest().
	 * ----------------------------------------------------------------- */

	function bindDelegatedEvents(state) {
		function onOver(e) {
			const item = e.target.closest(ITEM_SEL);
			if (!item) return;
			// Ignore internal moves within the same item — check if
			// the pointer came from outside this item.
			const prev = e.relatedTarget;
			if (prev && item.contains(prev)) return;
			onItemEnter(state, item, e);
		}

		function onMove(e) {
			if (!state.active) return;
			state.targetX = e.clientX + OFFSET_X;
			state.targetY = e.clientY + OFFSET_Y;
		}

		function onOut(e) {
			const item = e.target.closest(ITEM_SEL);
			if (!item) return;
			// Ignore internal moves — only fire when the pointer is
			// actually leaving this item.
			const next = e.relatedTarget;
			if (next && item.contains(next)) return;
			onItemLeave(state);
		}

		state.ul.addEventListener('mouseover', onOver, { passive: true });
		state.ul.addEventListener('mousemove', onMove, { passive: true });
		state.ul.addEventListener('mouseout', onOut);

		state._onOver = onOver;
		state._onMove = onMove;
		state._onOut = onOut;
	}

	/**
	 * Handle mouseenter on a list item.
	 *
	 * @param {Object}      state Instance state.
	 * @param {HTMLElement} item  The list item.
	 * @param {MouseEvent}  e     Mouse event.
	 */
	function onItemEnter(state, item, e) {
		const url = item.getAttribute('data-thumbnail');
		if (!url) {
			return;
		}

		// Cancel any pending hide-cleanup from a previous leave.
		if (state._hideTimer) {
			clearTimeout(state._hideTimer);
			state._hideTimer = null;
		}

		// Set the image source immediately.
		state.thumb.src = url;

		// Jump to initial position near cursor (no lerp on first frame).
		state.currentX = e.clientX + OFFSET_X;
		state.currentY = e.clientY + OFFSET_Y;
		state.targetX = state.currentX;
		state.targetY = state.currentY;
		clampPosition(state);

		state.thumb.style.left = state.currentX + 'px';
		state.thumb.style.top = state.currentY + 'px';

		// Show with enter animation.
		state.thumb.classList.remove(HIDING_CLASS);
		state.thumb.classList.add(VISIBLE_CLASS);
		state.active = true;
		state.visible = true;

		// Start the rAF loop.
		if (!state.rafId) {
			state.rafId = requestAnimationFrame(function () {
				tick(state);
			});
		}
	}

	/**
	 * Handle mouseleave — hide the floating thumbnail.
	 *
	 * @param {Object} state Instance state.
	 */
	function onItemLeave(state) {
		if (!state.active) {
			return;
		}
		state.active = false;

		state.thumb.classList.remove(VISIBLE_CLASS);
		state.thumb.classList.add(HIDING_CLASS);

		// Schedule cleanup after the CSS fade-out finishes.
		// The _hideTimer is the sole owner of src clearing — the rAF
		// loop never touches src.
		if (state._hideTimer) {
			clearTimeout(state._hideTimer);
		}
		state._hideTimer = setTimeout(function () {
			state._hideTimer = null;
			state.visible = false;
			state.thumb.src = '';
		}, HIDE_CLEANUP_DELAY);
	}

	/**
	 * rAF tick — lerp the current position toward the target and
	 * clamp to viewport edges.  Stops when active is false and the
	 * hide animation has finished.
	 *
	 * @param {Object} state Instance state.
	 */
	function tick(state) {
		if (state.active) {
			state.currentX = lerp(state.currentX, state.targetX, LERP);
			state.currentY = lerp(state.currentY, state.targetY, LERP);
			clampPosition(state);

			state.thumb.style.left = state.currentX + 'px';
			state.thumb.style.top = state.currentY + 'px';
		}

		// Keep looping while active or while the hide animation plays.
		// When both stop we just park the rAF — _hideTimer owns src
		// cleanup entirely so there is no dual code path.
		if (state.active || state.visible) {
			state.rafId = requestAnimationFrame(function () {
				tick(state);
			});
		} else {
			state.rafId = null;
		}
	}

	/**
	 * Clamp the current position so the thumbnail stays within the
	 * viewport with EDGE_PAD clearance on all sides.
	 *
	 * @param {Object} state Instance state.
	 */
	function clampPosition(state) {
		const maxX =
			(window.innerWidth || document.documentElement.clientWidth) -
			THUMB_W -
			EDGE_PAD;
		const maxY =
			(window.innerHeight || document.documentElement.clientHeight) -
			THUMB_H -
			EDGE_PAD;

		if (state.currentX < EDGE_PAD) {
			state.currentX = EDGE_PAD;
		}
		if (state.currentY < EDGE_PAD) {
			state.currentY = EDGE_PAD;
		}
		if (state.currentX > maxX) {
			state.currentX = maxX;
		}
		if (state.currentY > maxY) {
			state.currentY = maxY;
		}
	}

	/* --------------------------------------------------------------------
	 * Teardown
	 * ----------------------------------------------------------------- */

	function teardown(state) {
		if (state.rafId) {
			cancelAnimationFrame(state.rafId);
			state.rafId = null;
		}

		if (state._hideTimer) {
			clearTimeout(state._hideTimer);
			state._hideTimer = null;
		}

		if (state._onOver) {
			state.ul.removeEventListener('mouseover', state._onOver);
			state.ul.removeEventListener('mousemove', state._onMove);
			state.ul.removeEventListener('mouseout', state._onOut);
		}

		state.thumb.classList.remove(VISIBLE_CLASS, HIDING_CLASS);
		state.thumb.style.left = '';
		state.thumb.style.top = '';
		state.thumb.src = '';
		state.active = false;
		state.visible = false;
	}

	function teardownAll() {
		document.querySelectorAll(LIST_SEL).forEach(function (list) {
			if (instances.has(list)) {
				teardown(instances.get(list));
			}
		});
		instances = new WeakMap();
	}

	/* --------------------------------------------------------------------
	 * Bootstrap
	 * ----------------------------------------------------------------- */

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.beplusBlogListTeardown = function () {
		teardownAll();
		if (motionListener) {
			motionQuery.removeEventListener('change', motionListener);
			motionListener = null;
		}
	};

	// Re-scan when the mobile navigation portal clones blocks.
	document.addEventListener('beplus:portal-ready', function () {
		init();
	});
})();
