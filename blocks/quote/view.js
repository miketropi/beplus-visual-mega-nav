/**
 * Quote — frontend carousel engine.
 *
 * Handles crossfade transitions, word-by-word text animation,
 * auto-play with pause-on-hover, dot and arrow navigation.
 *
 * @package
 */
(function () {
	'use strict';

	const BLOCK_SEL = '.beplus-vmn-quote';
	const STAGE_SEL = '.beplus-vmn-quote__stage';
	const CARD_SEL = '.beplus-vmn-quote__card';
	const ACTIVE_CLASS = 'is-active';
	const STACKED_CLASS = 'is-stacked';
	const WORD_SEL = '.beplus-vmn-quote__word';
	const WORD_VISIBLE = 'is-visible';

	let instances = new WeakMap();

	/* --------------------------------------------------------------------
	 * Init
	 * ----------------------------------------------------------------- */

	function init() {
		const blocks = document.querySelectorAll(BLOCK_SEL);
		if (!blocks.length) return;
		Array.prototype.forEach.call(blocks, initBlock);
	}

	function initBlock(block) {
		if (instances.has(block)) return;

		const stage = block.querySelector(STAGE_SEL);
		if (!stage) return;

		const cards = stage.querySelectorAll(CARD_SEL);
		if (!cards.length) return;

		const speed = parseInt(block.getAttribute('data-speed'), 10) || 400;
		const autoplay = block.getAttribute('data-autoplay') === '1';
		const interval =
			parseInt(block.getAttribute('data-interval'), 10) || 5000;
		const textAnim = block.getAttribute('data-text-anim') === '1';
		const showArrows = block.getAttribute('data-arrows') !== '0';
		const showDots = block.getAttribute('data-dots') !== '0';

		const dots = block.querySelectorAll('.beplus-vmn-quote__dot');
		const prevBtn = block.querySelector('.beplus-vmn-quote__arrow--prev');
		const nextBtn = block.querySelector('.beplus-vmn-quote__arrow--next');

		// Set CSS custom property for transition speed.
		block.style.setProperty(
			'--beplus-vmn-quote-speed',
			(speed / 1000).toFixed(2) + 's'
		);

		// Find initial active index.
		let currentIndex = 0;
		for (let i = 0; i < cards.length; i++) {
			if (cards[i].classList.contains(ACTIVE_CLASS)) {
				currentIndex = i;
				break;
			}
		}

		const state = {
			block,
			stage,
			cards,
			dots,
			prevBtn,
			nextBtn,
			speed,
			autoplay,
			interval,
			textAnim,
			showArrows,
			showDots,
			currentIndex,
			pending: false,
			autoplayTimer: null,
			_wordTimer: null,
		};

		instances.set(block, state);

		// Animate words on the initial card.
		if (textAnim) {
			animateWords(state, cards[currentIndex]);
		}

		bindControls(state);
		if (autoplay) {
			startAutoplay(state);
		}
	}

	/* --------------------------------------------------------------------
	 * Word-by-word animation
	 * ----------------------------------------------------------------- */

	function animateWords(state, card) {
		if (state._wordTimer) {
			clearTimeout(state._wordTimer);
		}

		// Find the <p> inside the quote text blockquote.
		const textEl = card.querySelector('.beplus-vmn-quote__text p');
		if (!textEl) return;

		// If words are already wrapped, just re-trigger visibility.
		const existingWords = textEl.querySelectorAll(WORD_SEL);
		if (existingWords.length) {
			showWordsStaggered(existingWords, state);
			return;
		}

		// Split text content into word spans.
		const text = textEl.textContent || '';
		const words = text.trim().split(/\s+/);
		if (!words.length) return;

		textEl.textContent = '';
		const fragment = document.createDocumentFragment();
		for (let i = 0; i < words.length; i++) {
			const span = document.createElement('span');
			span.className = 'beplus-vmn-quote__word';
			span.textContent = words[i];
			fragment.appendChild(span);
			// Add back the space between words (except after the last).
			if (i < words.length - 1) {
				fragment.appendChild(document.createTextNode(' '));
			}
		}
		textEl.appendChild(fragment);

		const wordEls = textEl.querySelectorAll(WORD_SEL);
		showWordsStaggered(wordEls, state);
	}

	function showWordsStaggered(words, state) {
		// Reset all words to hidden.
		for (let i = 0; i < words.length; i++) {
			words[i].classList.remove(WORD_VISIBLE);
		}

		// Show words sequentially.
		for (let j = 0; j < words.length; j++) {
			(function (w, delay) {
				state._wordTimer = setTimeout(function () {
					w.classList.add(WORD_VISIBLE);
					if (j === words.length - 1) {
						state._wordTimer = null;
					}
				}, delay);
			})(words[j], j * 30);
		}
	}

	/* --------------------------------------------------------------------
	 * Navigation
	 * ----------------------------------------------------------------- */

	function goTo(state, newIndex) {
		if (state.pending) return;
		if (newIndex === state.currentIndex) return;
		if (newIndex < 0 || newIndex >= state.cards.length) return;

		state.pending = true;

		// Update dots.
		if (state.dots.length) {
			for (let d = 0; d < state.dots.length; d++) {
				state.dots[d].classList.toggle(ACTIVE_CLASS, d === newIndex);
			}
		}

		// Deactivate old card.
		state.cards[state.currentIndex].classList.remove(ACTIVE_CLASS);

		// Activate new card.
		state.cards[newIndex].classList.add(ACTIVE_CLASS);
		state.currentIndex = newIndex;

		// Reassign stacked cards: up to 2 cards after active get
		// .is-stacked, all others get nothing.
		for (let c = 0; c < state.cards.length; c++) {
			state.cards[c].classList.remove(STACKED_CLASS);
		}
		let stackedCount = 0;
		let idx = (newIndex + 1) % state.cards.length;
		while (stackedCount < 2 && idx !== newIndex) {
			state.cards[idx].classList.add(STACKED_CLASS);
			stackedCount++;
			idx = (idx + 1) % state.cards.length;
		}

		// Animate words on the new card.
		if (state.textAnim) {
			animateWords(state, state.cards[newIndex]);
		}

		// Unlock after transition completes.
		setTimeout(function () {
			state.pending = false;
		}, state.speed + 50);
	}

	function next(state) {
		const idx = (state.currentIndex + 1) % state.cards.length;
		goTo(state, idx);
	}

	function prev(state) {
		const idx =
			(state.currentIndex - 1 + state.cards.length) % state.cards.length;
		goTo(state, idx);
	}

	/* --------------------------------------------------------------------
	 * Controls
	 * ----------------------------------------------------------------- */

	function bindControls(state) {
		if (state.prevBtn && state.showArrows) {
			state.prevBtn.addEventListener('click', function () {
				prev(state);
				resetAutoplay(state);
			});
		}

		if (state.nextBtn && state.showArrows) {
			state.nextBtn.addEventListener('click', function () {
				next(state);
				resetAutoplay(state);
			});
		}

		if (state.dots.length && state.showDots) {
			for (let i = 0; i < state.dots.length; i++) {
				(function (dot, idx) {
					dot.addEventListener('click', function () {
						goTo(state, idx);
						resetAutoplay(state);
					});
				})(state.dots[i], i);
			}
		}

		// Pause auto-play while the user hovers over the block.
		state.block.addEventListener('mouseenter', function () {
			stopAutoplay(state);
		});
		state.block.addEventListener('mouseleave', function () {
			if (state.autoplay) {
				startAutoplay(state);
			}
		});

		// Touch / swipe support with drag feedback, velocity detection,
		// and scroll-lock during horizontal swipes.
		state._touchStartX = 0;
		state._touchStartY = 0;
		state._touchStartTime = 0;
		state._touchActive = false;

		const SWIPE_THRESHOLD = 50;
		const VELOCITY_THRESHOLD = 0.5; // px / ms
		const MAX_DRAG = 40;

		function onTouchStart(e) {
			if (state.pending) return;
			// Let native clicks on dots and arrows pass through.
			if (
				e.target.closest('.beplus-vmn-quote__dot') ||
				e.target.closest('.beplus-vmn-quote__arrow')
			) {
				return;
			}
			e.preventDefault();
			const t = e.touches[0];
			state._touchStartX = t.clientX;
			state._touchStartY = t.clientY;
			state._touchStartTime = Date.now();
			state._touchActive = false;
		}

		function onTouchMove(e) {
			if (state.pending) return;
			const dx = e.touches[0].clientX - state._touchStartX;
			const dy = e.touches[0].clientY - state._touchStartY;

			// Lock into horizontal mode once the swipe is clearly
			// horizontal and exceeds a small dead zone.
			if (
				!state._touchActive &&
				Math.abs(dx) > 10 &&
				Math.abs(dx) > Math.abs(dy)
			) {
				state._touchActive = true;
			}

			if (state._touchActive) {
				e.preventDefault();
				const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx));
				const card = state.cards[state.currentIndex];
				card.style.transition = 'none';
				card.style.transform = 'translateX(' + clamped + 'px)';
			}
		}

		function onTouchEnd(e) {
			if (state.pending) return;
			const dx = e.changedTouches[0].clientX - state._touchStartX;
			const dy = e.changedTouches[0].clientY - state._touchStartY;
			const dt = Date.now() - state._touchStartTime;
			const velocity = dt > 0 ? Math.abs(dx) / dt : 0;

			const card = state.cards[state.currentIndex];

			// Spring back — restore transition and clear inline transform.
			card.style.transition = '';
			card.style.transform = '';

			let shouldSwipe = false;
			let direction = 0;

			if (
				Math.abs(dx) >= SWIPE_THRESHOLD ||
				velocity >= VELOCITY_THRESHOLD
			) {
				if (Math.abs(dx) > Math.abs(dy)) {
					shouldSwipe = true;
					direction = dx < 0 ? 1 : -1;
				}
			}

			if (shouldSwipe) {
				if (direction > 0) {
					next(state);
				} else {
					prev(state);
				}
				resetAutoplay(state);
			}

			state._touchActive = false;
		}

		state.block.addEventListener('touchstart', onTouchStart, {
			passive: false,
		});
		state.block.addEventListener('touchmove', onTouchMove, {
			passive: false,
		});
		state.block.addEventListener('touchend', onTouchEnd);

		state._onTouchStart = onTouchStart;
		state._onTouchMove = onTouchMove;
		state._onTouchEnd = onTouchEnd;
	}

	/* --------------------------------------------------------------------
	 * Auto-play
	 * ----------------------------------------------------------------- */

	function startAutoplay(state) {
		if (state.autoplayTimer) return;
		state.autoplayTimer = setInterval(function () {
			next(state);
		}, state.interval);
	}

	function stopAutoplay(state) {
		if (state.autoplayTimer) {
			clearInterval(state.autoplayTimer);
			state.autoplayTimer = null;
		}
	}

	function resetAutoplay(state) {
		stopAutoplay(state);
		if (state.autoplay) {
			startAutoplay(state);
		}
	}

	/* --------------------------------------------------------------------
	 * Teardown
	 * ----------------------------------------------------------------- */

	function teardown(state) {
		stopAutoplay(state);
		if (state._wordTimer) {
			clearTimeout(state._wordTimer);
		}
		if (state._onTouchStart) {
			state.block.removeEventListener('touchstart', state._onTouchStart);
			state.block.removeEventListener('touchmove', state._onTouchMove);
			state.block.removeEventListener('touchend', state._onTouchEnd);
		}
		// Clear any leftover drag transform on the active card.
		if (state.cards && state.cards[state.currentIndex]) {
			state.cards[state.currentIndex].style.transition = '';
			state.cards[state.currentIndex].style.transform = '';
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

	window.beplusQuoteTeardown = function () {
		document.querySelectorAll(BLOCK_SEL).forEach(function (block) {
			if (instances.has(block)) {
				teardown(instances.get(block));
			}
		});
		instances = new WeakMap();
	};

	// Re-scan when the mobile navigation portal clones blocks into
	// a new DOM subtree (beplus-header view.js createPortal).
	document.addEventListener('beplus:portal-ready', function () {
		init();
	});
})();
