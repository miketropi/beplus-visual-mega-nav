/**
 * Product Card — frontend stacked deck behavior.
 *
 * Pure vanilla JS + GSAP (no Swiper). Requires the global `gsap`
 * (assets/vendor/gsap/gsap.min.js), enqueued in render.php.
 * All cards overlap in a fan; the active card sits straight on top.
 *
 * @package Beplus\VisualMegaNav
 */
(function () {
	'use strict';

	var OFFSET_Y = 20; // px vertical offset per card
	var OFFSET_X = 10; // px horizontal offset per card
	var SCALE_STEP = 0.04;
	var OPACITY_MIN = 0.3;

	function createDeck(el) {
		var slides = el.querySelectorAll('.beplus-vmn-product-card__slide');
		var track = el.querySelector('.beplus-vmn-product-card__track');
		var prevBtn = el.querySelector('.beplus-vmn-product-card__arrow--prev');
		var nextBtn = el.querySelector('.beplus-vmn-product-card__arrow--next');
		var dots = el.querySelectorAll('.beplus-vmn-product-card__dot');
		var autoplay = el.dataset.autoplay === 'true';
		var delay = parseInt(el.dataset.delay, 10) || 3000;

		if (!slides.length) return;

		// Mobile nav clones (cloneNode) carry over GSAP's inline
		// transform/opacity/zIndex from the original — reset them so the
		// deck re-initializes cleanly from the clone's snapshot.
		slides.forEach(function (slide) {
			slide.style.transform = '';
			slide.style.opacity = '';
			slide.style.zIndex = '';
		});

		var totalSlides = slides.length;
		var currentIndex = 0;
		var autoplayTimer = null;
		var isTransitioning = false;
		var isHovering = false;
		var resizeTimer = null;

		function getPosition(index) {
			// Position relative to current: 0 = active, 1 = next, -1 = prev, etc.
			var relative = index - currentIndex;

			// Each card keeps its own random rotation (assigned once on init,
			// persists across slide changes); the active card sits straight.
			var slide = slides[index];
			var rotation = slide ? slide._rotation : 0;
			if (0 === relative) {
				rotation = 0;
			}

			var y = Math.abs(relative) * OFFSET_Y;
			var x = relative * OFFSET_X;
			var scale = 1 - Math.abs(relative) * SCALE_STEP;
			var opacity = Math.max(OPACITY_MIN, 1 - Math.abs(relative) * 0.15);
			var zIndex = totalSlides - Math.abs(relative);

			// Clamp scale.
			scale = Math.max(0.8, scale);

			return { rotation: rotation, y: y, x: x, scale: scale, opacity: opacity, zIndex: zIndex };
		}

		function animateCards() {
			if (typeof gsap === 'undefined') {
				// Fallback: use CSS classes only.
				slides.forEach(function (slide, i) {
					slide.classList.toggle('is-active', i === currentIndex);
					slide.classList.toggle('is-prev', i === (currentIndex - 1 + totalSlides) % totalSlides);
					slide.classList.toggle('is-next', i === (currentIndex + 1) % totalSlides);
				});
				return;
			}

			slides.forEach(function (slide, i) {
				var card = slide.querySelector('.beplus-vmn-product-card__card');
				var pos = getPosition(i);

				slide.classList.remove('is-active', 'is-prev', 'is-next');
				slide.style.zIndex = pos.zIndex;

				if (i === currentIndex) {
					slide.classList.add('is-active');
				} else if (i === (currentIndex - 1 + totalSlides) % totalSlides) {
					slide.classList.add('is-prev');
				} else if (i === (currentIndex + 1) % totalSlides) {
					slide.classList.add('is-next');
				}

				gsap.to(slide, {
					// rotation is 0 for the active card, otherwise the slide's
					// stored random rotation.
					rotation: pos.rotation,
					y: pos.y,
					x: pos.x,
					scale: pos.scale,
					opacity: pos.opacity,
					zIndex: pos.zIndex,
					duration: 0.6,
					ease: 'power2.out',
				});
			});
		}

		function updateDots() {
			dots.forEach(function (dot, i) {
				dot.classList.toggle('is-active', i === currentIndex);
			});
		}

		// Slides are absolutely positioned, so the track has no intrinsic
		// height — pin it to the active card's measured height.
		function updateTrackHeight() {
			var activeSlide = slides[currentIndex];
			var card = activeSlide ? activeSlide.querySelector('.beplus-vmn-product-card__card') : null;
			if (card) {
				var h = card.offsetHeight;
				track.style.minHeight = h + 'px';
			}
		}

		function goTo(index) {
			if (isTransitioning || index === currentIndex) return;
			isTransitioning = true;

			currentIndex = index;
			if (currentIndex < 0) currentIndex = totalSlides - 1;
			if (currentIndex >= totalSlides) currentIndex = 0;

			updateDots();
			animateCards();

			// Wait for animation before allowing next transition.
			setTimeout(function () {
				isTransitioning = false;
			}, 650);
			// Re-measure the track after the transition settles — card
			// heights can vary (e.g. wrapped titles).
			setTimeout(updateTrackHeight, 650);
			resetAutoplay();
		}

		function next() {
			goTo(currentIndex + 1);
		}
		function prev() {
			goTo(currentIndex - 1);
		}

		function resetAutoplay() {
			if (autoplayTimer) clearInterval(autoplayTimer);
			if (autoplay && !isHovering) {
				autoplayTimer = setInterval(next, delay);
			}
		}

		// Events.
		prevBtn.addEventListener('click', function (e) {
			e.preventDefault();
			prev();
		});
		nextBtn.addEventListener('click', function (e) {
			e.preventDefault();
			next();
		});
		dots.forEach(function (dot) {
			dot.addEventListener('click', function (e) {
				e.preventDefault();
				goTo(parseInt(dot.dataset.index, 10));
			});
		});

		// Touch swipe.
		var touchStartX = 0;
		el.addEventListener('touchstart', function (e) {
			touchStartX = e.changedTouches[0].screenX;
		}, { passive: true });
		el.addEventListener('touchend', function (e) {
			var diff = touchStartX - e.changedTouches[0].screenX;
			if (Math.abs(diff) > 50) {
				if (diff > 0) next();
				else prev();
			}
		});

		// Hover pause.
		el.addEventListener('mouseenter', function () {
			isHovering = true;
			if (autoplayTimer) clearInterval(autoplayTimer);
		});
		el.addEventListener('mouseleave', function () {
			isHovering = false;
			resetAutoplay();
		});

		// Init.
		slides.forEach(function (slide) {
			slide.style.position = 'absolute';
		});

		// Assign each card a random rotation (-8..8, avoiding near-zero
		// values) that persists across slide changes. Stored on the slide.
		slides.forEach(function (slide) {
			var angle = Math.random() * 16 - 8; // -8 to 8
			if (Math.abs(angle) < 2) angle = angle > 0 ? 2 : -2;
			slide._rotation = angle;
		});

		// Pin the track to the active card's height right away.
		updateTrackHeight();

		animateCards();
		updateDots();
		resetAutoplay();

		// Re-measure once the initial animation settles.
		setTimeout(updateTrackHeight, 650);

		// Keep the height correct when the container resizes (debounced).
		function onResize() {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(updateTrackHeight, 200);
		}
		window.addEventListener('resize', onResize);

		el._deck = {
			goTo: goTo,
			next: next,
			prev: prev,
			destroy: function () {
				if (autoplayTimer) clearInterval(autoplayTimer);
				if (resizeTimer) clearTimeout(resizeTimer);
				window.removeEventListener('resize', onResize);
			},
		};
	}

	function init() {
		document.querySelectorAll('.beplus-vmn-product-card').forEach(function (el) {
			if (el._deck) return;
			createDeck(el);
		});
	}

	/**
	 * Watch for dynamically added product-card elements (e.g. the Nextora
	 * mobile drawer portal clones the header nav with cloneNode(), copying
	 * markup but not JS state). Debounced with rAF; init() skips elements
	 * that already have `_deck`. Same pattern as tabs.js.
	 */
	function observeDynamicContent() {
		if (typeof MutationObserver === 'undefined' || !document.body) {
			return;
		}

		var scheduled = false;

		var observer = new MutationObserver(function (mutations) {
			var relevant = false;

			for (var m = 0; m < mutations.length; m++) {
				var added = mutations[m].addedNodes;
				for (var a = 0; a < added.length; a++) {
					var node = added[a];
					if (
						node.nodeType === 1 &&
						((node.matches && node.matches('.beplus-vmn-product-card')) ||
							(node.querySelector && node.querySelector('.beplus-vmn-product-card')))
					) {
						relevant = true;
						break;
					}
				}
				if (relevant) {
					break;
				}
			}

			if (!relevant || scheduled) {
				return;
			}

			scheduled = true;
			window.requestAnimationFrame(function () {
				scheduled = false;
				console.log(
					'[beplus-vmn product-card] DOM mutation detected — re-scanning for mobile nav clones'
				);
				init();
			});
		});

		observer.observe(document.body, { childList: true, subtree: true });
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			init();
			observeDynamicContent();
		});
	} else {
		init();
		observeDynamicContent();
	}

	// Fallback: some environments dispatch beplus:portal-ready (the
	// MutationObserver above is the primary mechanism). Kept so the deck
	// re-scans even if a custom portal implementation fires it.
	document.addEventListener('beplus:portal-ready', function () {
		init();
	});
})();
