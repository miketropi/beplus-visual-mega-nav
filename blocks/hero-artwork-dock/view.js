/**
 * Hero Artwork Dock — frontend JS engine.
 *
 * Handles mouse-tracking parallax, idle float animation, and
 * soft entrance animation for artwork cards docked to the
 * bottom of hero containers.
 *
 * When both hover motion and float animation are enabled the two
 * engines cooperate via an idle timer:
 *   - Mousemove  → pause float, apply JS parallax (inline transform)
 *   - Mouse idle → transition to rest position, clear inline style,
 *                  restart CSS float so @keyframes take over.
 *
 * Visibility is controlled via CSS classes (not inline styles):
 *   .beplus-hero-card              → opacity: 0 (hidden by default)
 *   .beplus-hero-card.is-entering  → CSS animation (opacity 0→1 + slide up)
 *   .beplus-hero-card.has-entered  → opacity: 1 (visible, post-entrance)
 *
 * Loaded via viewScript — only when a hero-artwork-dock block is on the page.
 *
 * @package
 */
(function () {
	'use strict';

	const ARTWORK_SEL = '.beplus-hero-artwork';
	const CARD_SEL = '.beplus-hero-card';
	const IDLE_CLASS = 'is-idle';
	const ENTERING_CLASS = 'is-entering';
	const ENTERED_CLASS = 'has-entered';

	/**
	 * Milliseconds of no mousemove before the engine considers the
	 *  pointer "idle" and hands control back to the CSS float animation.
	 */
	const IDLE_TIMEOUT = 500;

	/**
	 * Delay after the idle transform transition (0.4 s) before clearing
	 *  inline styles — gives the smooth return-to-rest time to finish.
	 */
	const FLOAT_RESUME_DELAY = 450;

	let instances = new WeakMap();

	/**
	 * Initialize all hero artwork docks on the page.
	 */
	function init() {
		const artworks = document.querySelectorAll(ARTWORK_SEL);
		if (!artworks.length) {
			return;
		}
		Array.prototype.forEach.call(artworks, initArtwork);
	}

	/**
	 * Initialize one artwork instance.
	 *
	 * @param {HTMLElement} artwork The .beplus-hero-artwork element.
	 */
	function initArtwork(artwork) {
		if (instances.has(artwork)) {
			return;
		}

		const instanceId = artwork.getAttribute('data-instance') || '';
		const hoverEnabled = artwork.getAttribute('data-hover') === '1';
		const floatEnabled = artwork.getAttribute('data-floating') === '1';
		const perspective =
			parseInt(artwork.getAttribute('data-perspective'), 10) || 800;

		const cardEls = artwork.querySelectorAll(CARD_SEL);
		const cards = [];

		// Seed mouse position to viewport center so cards have a neutral
		// starting position before the first mousemove fires.
		const viewportW =
			window.innerWidth || document.documentElement.clientWidth;
		const viewportH =
			window.innerHeight || document.documentElement.clientHeight;

		Array.prototype.forEach.call(cardEls, function (el, idx) {
			cards.push({
				el,
				depth: parseInt(el.getAttribute('data-depth'), 10) || 0,
				rotation: parseFloat(el.getAttribute('data-rotation')) || 0,
				width: parseInt(el.getAttribute('data-width'), 10) || 200,
				index: idx,
				restingTransform: el.style.transform || '',
			});
		});

		const state = {
			artwork,
			instanceId,
			hoverEnabled,
			floatEnabled,
			perspective,
			cards,
			mouseX: viewportW / 2,
			mouseY: viewportH / 2,
			isVisible: true,
			hasEntered: false,
			animationFrameId: null,
			_idleTimer: null,
			_resumeFloatTimer: null,
		};

		instances.set(artwork, state);

		if (hoverEnabled) {
			bindMouseTracking(state);
		}

		// Float starts after entrance completes (see triggerEntrance).
		if (floatEnabled && state.hasEntered) {
			startFloatAnimation(state);
		}

		bindIntersectionObserver(state);

		// Safety net: if the artwork is already in the viewport but the IO
		// hasn't fired (e.g. zero dimensions at observe time), force entrance
		// after two layout passes.
		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				if (state.hasEntered) return;
				const rect = artwork.getBoundingClientRect();
				const isInViewport =
					rect.top < window.innerHeight &&
					rect.bottom > 0 &&
					rect.width > 0 &&
					rect.height > 0;
				if (isInViewport) {
					triggerEntrance(state);
				}
			});
		});
	}

	/* --------------------------------------------------------------------
	 * Mouse tracking — document-level mousemove for page-global parallax.
	 *
	 * Cooperative float handling:
	 *   - Every mousemove pauses the CSS float animation and resets an idle
	 *     timer.  While the timer is live, JS parallax owns the transform.
	 *   - When the idle timer fires we smoothly transition cards back to
	 *     their rest position, then clear all inline transforms and hand
	 *     control to the CSS @keyframes float animation.
	 *   - mouseleave / visibilitychange / blur immediately trigger the same
	 *     return-to-float sequence so cards never freeze.
	 * ----------------------------------------------------------------- */

	function bindMouseTracking(state) {
		let ticking = false;

		function clearIdleTimer() {
			if (state._idleTimer) {
				clearTimeout(state._idleTimer);
				state._idleTimer = null;
			}
		}

		function clearResumeTimer() {
			if (state._resumeFloatTimer) {
				clearTimeout(state._resumeFloatTimer);
				state._resumeFloatTimer = null;
			}
		}

		/**
		 * Start the idle timer.  When it fires the mouse has been still
		 * long enough — transition to idle position, then hand control
		 * to the CSS float animation.
		 */
		function resetIdleTimer() {
			clearIdleTimer();
			if (!state.floatEnabled) {
				return;
			}
			state._idleTimer = setTimeout(function () {
				state._idleTimer = null;
				returnToFloat(state);
			}, IDLE_TIMEOUT);
		}

		function onMouseMove(e) {
			state.mouseX = e.clientX;
			state.mouseY = e.clientY;

			// Cancel any pending return-to-float — mouse is moving again.
			clearIdleTimer();
			clearResumeTimer();

			// Pause CSS float while JS parallax is driving transforms.
			if (state.floatEnabled) {
				pauseFloatAnimation(state);
			}

			if (!ticking) {
				ticking = true;
				requestAnimationFrame(function () {
					applyMouseParallax(state);
					ticking = false;
				});
			}

			// Restart the idle countdown.
			resetIdleTimer();
		}

		// When the pointer leaves the document, go straight to float.
		function onMouseLeave() {
			clearIdleTimer();
			clearResumeTimer();
			returnToFloat(state);
		}

		document.addEventListener('mousemove', onMouseMove, { passive: true });
		document.addEventListener('mouseleave', onMouseLeave);

		// Reset cards to idle when the tab loses focus (Alt+Tab, etc.)
		// so they don't freeze at the last parallax position.
		function onVisibilityChange() {
			if (document.hidden) {
				clearIdleTimer();
				clearResumeTimer();
				returnToFloat(state);
			}
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		// Belt-and-suspenders: blur on the window catches focus-loss
		// scenarios where visibilitychange might not be enough.
		function onBlur() {
			clearIdleTimer();
			clearResumeTimer();
			returnToFloat(state);
		}
		window.addEventListener('blur', onBlur);

		state._mouseMove = onMouseMove;
		state._mouseLeave = onMouseLeave;
		state._visibilityChange = onVisibilityChange;
		state._blur = onBlur;
	}

	/**
	 * Smoothly transition cards to their rest position, then clear
	 * inline transforms so the CSS float @keyframes can take over.
	 *
	 * @param {Object} state Instance state.
	 */
	function returnToFloat(state) {
		// Step 1 — smooth 0.4 s transition back to idle transform.
		applyMouseParallax(state, true);

		if (!state.floatEnabled) {
			return;
		}

		// Step 2 — after the transition finishes, clear inline styles
		// and restart the CSS float animation.
		if (state._resumeFloatTimer) {
			clearTimeout(state._resumeFloatTimer);
		}
		state._resumeFloatTimer = setTimeout(function () {
			state._resumeFloatTimer = null;
			const cards = state.cards;
			for (let i = 0; i < cards.length; i++) {
				cards[i].el.style.transform = '';
				cards[i].el.style.transition = '';
			}
			startFloatAnimation(state);
		}, FLOAT_RESUME_DELAY);
	}

	/**
	 * Apply parallax transform to each card based on mouse position.
	 *
	 * @param {Object}  state  Instance state.
	 * @param {boolean} toIdle If true, reset cards to resting transforms.
	 */
	function applyMouseParallax(state, toIdle) {
		const cards = state.cards;
		const viewportW =
			window.innerWidth || document.documentElement.clientWidth;
		const viewportH =
			window.innerHeight || document.documentElement.clientHeight;

		const nx = toIdle ? 0 : (state.mouseX / viewportW) * 2 - 1;
		const ny = toIdle ? 0 : (state.mouseY / viewportH) * 2 - 1;

		for (let i = 0; i < cards.length; i++) {
			const card = cards[i];
			const depthFactor = 1 + card.depth * 0.3;
			const baseRotation = card.rotation;

			let ty = (6 + card.depth * 2) * ny * depthFactor;
			ty = clamp(ty, -12, 12);

			let tx = (3 + card.depth * 1.5) * nx * depthFactor;
			tx = clamp(tx, -8, 8);

			let tilt = (2 + card.depth * 0.6) * nx;
			tilt = clamp(tilt, -4, 4);
			const rot = baseRotation + tilt;

			if (toIdle) {
				card.el.style.transition = 'transform 0.4s ease-out';
				card.el.style.transform =
					'translateX(-50%) rotate(' +
					baseRotation.toFixed(2) +
					'deg) translateY(0px)';
				card._resetTimer = setTimeout(
					function (el) {
						el.style.transition = 'transform 0.1s ease-out';
					}.bind(null, card.el),
					420
				);
			} else {
				if (card._resetTimer) {
					clearTimeout(card._resetTimer);
					card._resetTimer = null;
				}
				card.el.style.transition = 'transform 0.1s ease-out';
				card.el.style.transform =
					'translateX(-50%) rotate(' +
					rot.toFixed(2) +
					'deg) translateX(' +
					tx.toFixed(2) +
					'px) translateY(' +
					ty.toFixed(2) +
					'px)';
			}
		}
	}

	/* --------------------------------------------------------------------
	 * Idle float animation (CSS @keyframes)
	 * ----------------------------------------------------------------- */

	function startFloatAnimation(state) {
		// Skip if already running — avoids redundant DOM writes on every
		// IntersectionObserver toggle (scroll in/out).
		if (state._floatStarted) {
			return;
		}
		state._floatStarted = true;

		const cards = state.cards;

		for (let i = 0; i < cards.length; i++) {
			const card = cards[i];
			card.el.classList.add(IDLE_CLASS);

			const duration = 3 + i * 0.7 + card.depth * 0.5;
			const delay = i * 0.5;

			card.el.style.setProperty(
				'--beplus-hero-float-duration',
				duration.toFixed(2) + 's'
			);
			card.el.style.setProperty(
				'--beplus-hero-float-delay',
				delay.toFixed(2) + 's'
			);
		}
	}

	function pauseFloatAnimation(state) {
		state._floatStarted = false;
		const cards = state.cards;
		for (let i = 0; i < cards.length; i++) {
			cards[i].el.classList.remove(IDLE_CLASS);
		}
	}

	/* --------------------------------------------------------------------
	 * IntersectionObserver — entrance + viewport pause/resume
	 * ----------------------------------------------------------------- */

	function bindIntersectionObserver(state) {
		const io = new IntersectionObserver(
			function (entries) {
				const entry = entries[0];
				state.isVisible = entry.isIntersecting;

				if (entry.isIntersecting && !state.hasEntered) {
					triggerEntrance(state);
				}

				if (state.floatEnabled && state.hasEntered) {
					if (state.isVisible) {
						startFloatAnimation(state);
					} else {
						pauseFloatAnimation(state);
					}
				}

				// Reset cards to idle when the artwork is off-screen,
				// so they don't hold stale parallax transforms.
				if (!state.isVisible) {
					applyMouseParallax(state, true);
				}
			},
			{ threshold: 0 }
		);

		io.observe(state.artwork);
		state._io = io;
	}

	/**
	 * Trigger entrance animation with staggered delays.
	 * Center card enters first, then inner cards, then outer cards.
	 * @param {Object} state
	 */
	function triggerEntrance(state) {
		state.hasEntered = true;

		const cards = state.cards;
		const count = cards.length;
		const midIdx = Math.floor(count / 2);

		for (let i = 0; i < count; i++) {
			(function (card, dist) {
				const delay = dist * 100;

				card.el.style.setProperty(
					'--beplus-hero-enter-delay',
					delay + 'ms'
				);
				card.el.classList.add(ENTERING_CLASS);
				card.el.classList.add(ENTERED_CLASS);

				card.el.addEventListener(
					'animationend',
					function onEnterEnd(e) {
						if (e.animationName !== 'beplus-hero-entrance') {
							return;
						}
						card.el.removeEventListener('animationend', onEnterEnd);
						card.el.classList.remove(ENTERING_CLASS);
						card.el.style.removeProperty(
							'--beplus-hero-enter-delay'
						);

						if (state.floatEnabled && state.isVisible) {
							startFloatAnimation(state);
						}
					}
				);
			})(cards[i], Math.abs(i - midIdx));
		}
	}

	/* --------------------------------------------------------------------
	 * Helpers
	 * ----------------------------------------------------------------- */

	function clamp(value, min, max) {
		if (value < min) return min;
		if (value > max) return max;
		return value;
	}

	/* --------------------------------------------------------------------
	 * Teardown
	 * ----------------------------------------------------------------- */

	function teardown(state) {
		if (state._mouseMove) {
			document.removeEventListener('mousemove', state._mouseMove);
		}
		if (state._mouseLeave) {
			document.removeEventListener('mouseleave', state._mouseLeave);
		}
		if (state._visibilityChange) {
			document.removeEventListener(
				'visibilitychange',
				state._visibilityChange
			);
		}
		if (state._blur) {
			window.removeEventListener('blur', state._blur);
		}
		if (state._idleTimer) {
			clearTimeout(state._idleTimer);
			state._idleTimer = null;
		}
		if (state._resumeFloatTimer) {
			clearTimeout(state._resumeFloatTimer);
			state._resumeFloatTimer = null;
		}

		if (state._io) {
			state._io.disconnect();
		}

		const cards = state.cards;
		for (let i = 0; i < cards.length; i++) {
			if (cards[i]._resetTimer) {
				clearTimeout(cards[i]._resetTimer);
			}
			cards[i].el.classList.remove(
				IDLE_CLASS,
				ENTERING_CLASS,
				ENTERED_CLASS
			);
			cards[i].el.style.transform = '';
			cards[i].el.style.transition = '';
			cards[i].el.style.removeProperty('--beplus-hero-enter-delay');
		}
	}

	/* --------------------------------------------------------------------
	 * Bootstrap
	 * ----------------------------------------------------------------- */

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.beplusHeroArtworkDockTeardown = function () {
		document.querySelectorAll(ARTWORK_SEL).forEach(function (artwork) {
			if (instances.has(artwork)) {
				teardown(instances.get(artwork));
			}
		});
		instances = new WeakMap();
	};

	// Re-scan when the mobile navigation portal clones blocks.
	document.addEventListener('beplus:portal-ready', function () {
		init();
	});
})();
