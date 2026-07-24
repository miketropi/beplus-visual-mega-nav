/**
 * Hero Artwork Dock — frontend JS engine.
 *
 * Handles mouse-tracking parallax, idle float animation, and
 * soft entrance animation for artwork cards docked to the
 * bottom of hero containers.
 *
 * Visibility is controlled via CSS classes (not inline styles):
 *   .beplus-hero-card            → opacity: 0 (hidden by default)
 *   .beplus-hero-card.is-entering → CSS animation (opacity 0→1 + slide up)
 *   .beplus-hero-card.has-entered → opacity: 1 (visible, post-entrance)
 *
 * Loaded via viewScript — only when a hero-artwork-dock block is on the page.
 *
 * @package
 */
(function () {
	'use strict';

	var ARTWORK_SEL = '.beplus-hero-artwork';
	var CARD_SEL = '.beplus-hero-card';
	var IDLE_CLASS = 'is-idle';
	var ENTERING_CLASS = 'is-entering';
	var ENTERED_CLASS = 'has-entered';

	var instances = new WeakMap();

	/**
	 * Initialize all hero artwork docks on the page.
	 */
	function init() {
		var artworks = document.querySelectorAll(ARTWORK_SEL);
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

		var instanceId = artwork.getAttribute('data-instance') || '';
		var hoverEnabled = artwork.getAttribute('data-hover') === '1';
		var floatEnabled = artwork.getAttribute('data-floating') === '1';
		var perspective = parseInt(artwork.getAttribute('data-perspective'), 10) || 800;

		var cardEls = artwork.querySelectorAll(CARD_SEL);
		var cards = [];

		Array.prototype.forEach.call(cardEls, function (el, idx) {
			cards.push({
				el: el,
				depth: parseInt(el.getAttribute('data-depth'), 10) || 0,
				rotation: parseFloat(el.getAttribute('data-rotation')) || 0,
				width: parseInt(el.getAttribute('data-width'), 10) || 200,
				index: idx,
				restingTransform: el.style.transform || '',
			});
		});

		var state = {
			artwork: artwork,
			instanceId: instanceId,
			hoverEnabled: hoverEnabled,
			floatEnabled: floatEnabled,
			perspective: perspective,
			cards: cards,
			mouseX: 0,
			mouseY: 0,
			isHovering: false,
			isVisible: true,
			hasEntered: false,
			animationFrameId: null,
		};

		instances.set(artwork, state);

		if (hoverEnabled) {
			bindMouseTracking(state);
		}

		// Float starts after entrance completes (see triggerEntrance).
		// If entrance already played (e.g. re-init), start float now.
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
				var rect = artwork.getBoundingClientRect();
				var isInViewport =
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
	 * Mouse tracking
	 * ----------------------------------------------------------------- */

	function bindMouseTracking(state) {
		var ticking = false;

		function onMouseMove(e) {
			state.mouseX = e.clientX;
			state.mouseY = e.clientY;

			if (!ticking) {
				ticking = true;
				requestAnimationFrame(function () {
					applyMouseParallax(state);
					ticking = false;
				});
			}
		}

		function onMouseEnter() {
			state.isHovering = true;
		}

		function onMouseLeave() {
			state.isHovering = false;
			applyMouseParallax(state, true);
		}

		document.addEventListener('mousemove', onMouseMove, { passive: true });
		document.addEventListener('mouseenter', onMouseEnter, { passive: true });
		document.addEventListener('mouseleave', onMouseLeave);

		state._mouseMove = onMouseMove;
		state._mouseEnter = onMouseEnter;
		state._mouseLeave = onMouseLeave;
	}

	/**
	 * Apply parallax transform to each card based on mouse position.
	 */
	function applyMouseParallax(state, toIdle) {
		var cards = state.cards;
		var viewportW = window.innerWidth || document.documentElement.clientWidth;
		var viewportH = window.innerHeight || document.documentElement.clientHeight;

		var nx = toIdle ? 0 : (state.mouseX / viewportW) * 2 - 1;
		var ny = toIdle ? 0 : (state.mouseY / viewportH) * 2 - 1;

		for (var i = 0; i < cards.length; i++) {
			var card = cards[i];
			var depthFactor = 1 + card.depth * 0.3;
			var baseRotation = card.rotation;

			var ty = (6 + card.depth * 2) * ny * depthFactor;
			ty = clamp(ty, -12, 12);

			var tx = (3 + card.depth * 1.5) * nx * depthFactor;
			tx = clamp(tx, -8, 8);

			var tilt = (2 + card.depth * 0.6) * nx;
			tilt = clamp(tilt, -4, 4);
			var rot = baseRotation + tilt;

			var tform = 'rotate(' + rot.toFixed(2) + 'deg) translateX(' + tx.toFixed(2) + 'px) translateY(' + ty.toFixed(2) + 'px)';

			if (toIdle) {
				card.el.style.transition = 'transform 0.4s ease-out';
				card.el.style.transform = 'rotate(' + baseRotation.toFixed(2) + 'deg) translateY(0px)';
				card._resetTimer = setTimeout(function (el) {
					el.style.transition = 'transform 0.1s ease-out';
				}.bind(null, card.el), 420);
			} else {
				if (card._resetTimer) {
					clearTimeout(card._resetTimer);
					card._resetTimer = null;
				}
				card.el.style.transition = 'transform 0.1s ease-out';
				card.el.style.transform = tform;
			}
		}
	}

	/* --------------------------------------------------------------------
	 * Idle float animation
	 * ----------------------------------------------------------------- */

	function startFloatAnimation(state) {
		var cards = state.cards;

		for (var i = 0; i < cards.length; i++) {
			var card = cards[i];
			card.el.classList.add(IDLE_CLASS);

			var duration = 3 + (i * 0.7) + (card.depth * 0.5);
			var delay = i * 0.5;

			card.el.style.setProperty('--beplus-hero-float-duration', duration.toFixed(2) + 's');
			card.el.style.setProperty('--beplus-hero-float-delay', delay.toFixed(2) + 's');
		}
	}

	function pauseFloatAnimation(state) {
		var cards = state.cards;
		for (var i = 0; i < cards.length; i++) {
			cards[i].el.classList.remove(IDLE_CLASS);
		}
	}

	/* --------------------------------------------------------------------
	 * IntersectionObserver — entrance + viewport pause/resume
	 * ----------------------------------------------------------------- */

	function bindIntersectionObserver(state) {
		var io = new IntersectionObserver(
			function (entries) {
				var entry = entries[0];
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
	 * Each card gets .is-entering for the CSS keyframe animation,
	 * then .has-entered for permanent visibility.
	 */
	function triggerEntrance(state) {
		state.hasEntered = true;

		var cards = state.cards;
		var count = cards.length;
		var midIdx = Math.floor(count / 2);

		for (var i = 0; i < count; i++) {
			(function (card, dist) {
				var delay = dist * 100;

				// Mark as entering — triggers the CSS animation.
				card.el.style.setProperty('--beplus-hero-enter-delay', delay + 'ms');
				card.el.classList.add(ENTERING_CLASS);

				// Also mark as entered immediately as a fallback — if the
				// animation doesn't play (e.g. prefers-reduced-motion),
				// the card still becomes visible via the .has-entered class.
				card.el.classList.add(ENTERED_CLASS);

				// When entrance animation finishes, clean up.
				card.el.addEventListener('animationend', function onEnterEnd(e) {
					if (e.animationName !== 'beplus-hero-entrance') {
						return;
					}
					card.el.removeEventListener('animationend', onEnterEnd);
					card.el.classList.remove(ENTERING_CLASS);
					card.el.style.removeProperty('--beplus-hero-enter-delay');

					// .has-entered is already present — permanent visibility.

					if (state.floatEnabled && state.isVisible) {
						startFloatAnimation(state);
					}
				});
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
		if (state._mouseEnter) {
			document.removeEventListener('mouseenter', state._mouseEnter);
		}
		if (state._mouseLeave) {
			document.removeEventListener('mouseleave', state._mouseLeave);
		}

		if (state._io) {
			state._io.disconnect();
		}

		var cards = state.cards;
		for (var i = 0; i < cards.length; i++) {
			if (cards[i]._resetTimer) {
				clearTimeout(cards[i]._resetTimer);
			}
			cards[i].el.classList.remove(IDLE_CLASS, ENTERING_CLASS, ENTERED_CLASS);
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
})();
