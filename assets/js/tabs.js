/**
 * Frontend: tab interaction for the Tab Container block.
 *
 * Supports both vertical and horizontal layout modes.
 * A thin indicator bar slides along the edge of the active tab.
 *
 * Vertical:   indicator = left-edge  (top + height driven by JS)
 * Horizontal: indicator = bottom-edge (left + width driven by JS)
 *
 * Activates on hover (desktop) or click.
 * Keyboard: Arrow keys navigate, Home/End, Enter/Space.
 *
 * @package Snap\MegaMenu
 */

(function () {
	'use strict';

	var CONTAINER_SEL = '.snap-megamenu-tab-container';

	function init() {
		var containers = document.querySelectorAll(CONTAINER_SEL);
		for (var c = 0; c < containers.length; c++) {
			setupContainer(containers[c]);
		}
	}

	/**
	 * @param {HTMLElement} container
	 */
	function setupContainer(container) {
		if (container.dataset.snapMmTabsEnhanced) {
			return;
		}

		container.dataset.snapMmTabsEnhanced = 'true';

		var layout =
			container.dataset.snapMmLayout || container.getAttribute('data-snap-mm-layout') || 'vertical';
		var isHorizontal = layout === 'horizontal';

		var tabs = container.querySelectorAll(
			'.snap-megamenu-tab-container__tablist > [role="tab"]'
		);
		var indicator = container.querySelector(
			'.snap-megamenu-tab-container__indicator'
		);
		var panels = container.querySelectorAll(
			'.snap-megamenu-tab-container__content > [role="tabpanel"]'
		);

		if (!tabs.length || !panels.length) {
			return;
		}

		var activeIndex = getActiveIndex(tabs);

		if (indicator && tabs[activeIndex]) {
			positionIndicator(indicator, tabs[activeIndex], isHorizontal);
		}

		for (var i = 0; i < tabs.length; i++) {
			(function (idx) {
				var touched = false;
				var startX = 0;
				var startY = 0;

				tabs[idx].addEventListener('mouseenter', function () {
					if (indicator) {
						positionIndicator(indicator, tabs[idx], isHorizontal);
					}
					activateTab(idx);
				});

				tabs[idx].addEventListener('click', function () {
					if (touched) {
						touched = false;
						return;
					}
					activeIndex = idx;
					if (indicator) {
						positionIndicator(indicator, tabs[idx], isHorizontal);
					}
					activateTab(idx);
				});

				tabs[idx].addEventListener('touchstart', function (e) {
					var t = e.touches[0];
					if (t) {
						startX = t.clientX;
						startY = t.clientY;
					}
				});

				tabs[idx].addEventListener('touchend', function (e) {
					var t = e.changedTouches[0];
					var dx = t ? t.clientX - startX : 0;
					var dy = t ? t.clientY - startY : 0;

					if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
						return;
					}

					touched = true;
					activeIndex = idx;
					if (indicator) {
						positionIndicator(indicator, tabs[idx], isHorizontal);
					}
					activateTab(idx);
				});

				tabs[idx].addEventListener('keydown', function (e) {
					handleKeydown(e, idx);
				});
			})(i);
		}

		var tablist = container.querySelector(
			'.snap-megamenu-tab-container__tablist'
		);
		if (tablist && indicator) {
			tablist.addEventListener('mouseleave', function () {
				if (tabs[activeIndex]) {
					positionIndicator(
						indicator,
						tabs[activeIndex],
						isHorizontal
					);
				}
			});
		}

		/**
		 * Position the indicator relative to a tab button.
		 *
		 * Vertical   — sets top + height.
		 * Horizontal — sets left + width.
		 *
		 * @param {HTMLElement} indicator
		 * @param {HTMLElement} tab
		 * @param {boolean}     isHorizontal
		 */
		function positionIndicator(indicator, tab, isHorizontal) {
			var tablist = tab.closest('.snap-megamenu-tab-container__tablist');
			if (!tablist) return;

			var tablistRect = tablist.getBoundingClientRect();
			var tabRect = tab.getBoundingClientRect();

			if (isHorizontal) {
				indicator.style.left =
					tabRect.left - tablistRect.left + 'px';
				indicator.style.width = tabRect.width + 'px';
				indicator.style.top = '';
				indicator.style.height = '';
			} else {
				indicator.style.top =
					tabRect.top - tablistRect.top + 'px';
				indicator.style.height = tabRect.height + 'px';
				indicator.style.left = '';
				indicator.style.width = '';
			}
		}

		/**
		 * @param {number} index
		 */
		function activateTab(index) {
			for (var j = 0; j < tabs.length; j++) {
				if (j === index) {
					tabs[j].setAttribute('aria-selected', 'true');
					tabs[j].tabIndex = 0;
					if (panels[j]) panels[j].removeAttribute('hidden');
				} else {
					tabs[j].setAttribute('aria-selected', 'false');
					tabs[j].tabIndex = -1;
					if (panels[j]) panels[j].setAttribute('hidden', '');
				}
			}
			activeIndex = index;
		}

		/**
		 * @param {KeyboardEvent} e
		 * @param {number}        currentIndex
		 */
		function handleKeydown(e, currentIndex) {
			var nextIndex;
			var nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
			var prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

			switch (e.key) {
				case 'ArrowRight':
				case 'ArrowLeft':
				case 'ArrowDown':
				case 'ArrowUp':
					e.preventDefault();
					if (
						e.key === nextKey ||
						(!isHorizontal && e.key === 'ArrowRight') ||
						(isHorizontal && e.key === 'ArrowDown')
					) {
						nextIndex = (currentIndex + 1) % tabs.length;
					} else {
						nextIndex =
							(currentIndex - 1 + tabs.length) % tabs.length;
					}
					break;
				case 'Home':
					e.preventDefault();
					nextIndex = 0;
					break;
				case 'End':
					e.preventDefault();
					nextIndex = tabs.length - 1;
					break;
				case 'Enter':
				case ' ':
					e.preventDefault();
					activeIndex = currentIndex;
					if (indicator) {
						positionIndicator(
							indicator,
							tabs[currentIndex],
							isHorizontal
						);
					}
					activateTab(currentIndex);
					var tl = container.querySelector(
						'.snap-megamenu-tab-container__tablist'
					);
					if (tl) {
						tl.dispatchEvent(
							new Event('mouseleave', { bubbles: true })
						);
					}
					return;
				default:
					return;
			}

			if (tabs[nextIndex]) tabs[nextIndex].focus();
		}

		/**
		 * @param {NodeList} tabElements
		 * @return {number}
		 */
		function getActiveIndex(tabElements) {
			for (var j = 0; j < tabElements.length; j++) {
				if (
					tabElements[j].getAttribute('aria-selected') === 'true'
				) {
					return j;
				}
			}
			return 0;
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
