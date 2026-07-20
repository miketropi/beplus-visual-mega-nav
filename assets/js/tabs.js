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
 * @package Beplus\VisualMegaNav
 */

(function () {
	'use strict';

	var CONTAINER_SEL = '.beplus-vmn-tab-container';
	var ICON_SEL = '.beplus-vmn-tab-container__tab-icon[data-beplus-vmn-icon]';

	// Cached icon catalog (shared across all containers).
	var iconCatalog = null;
	var iconFetching = false;

	function init() {
		var containers = document.querySelectorAll(CONTAINER_SEL);
		for (var c = 0; c < containers.length; c++) {
			setupContainer(containers[c]);
		}

		renderTabIcons();
	}

	/**
	 * Re-scan the DOM when nav clones are inserted (e.g. Nextora mobile
	 * drawer portal clones the header nav with cloneNode(), which copies
	 * markup but not event listeners).
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
						((node.matches && node.matches(CONTAINER_SEL)) ||
							(node.querySelector &&
								node.querySelector(CONTAINER_SEL)))
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
				init();
			});
		});

		observer.observe(document.body, { childList: true, subtree: true });
	}

	/**
	 * Render SVG icons for tab icon spans when the theme icon library
	 * is available (e.g. Nextora provides lucide-icons.json).
	 */
	function renderTabIcons() {
		var iconEls = document.querySelectorAll(ICON_SEL);
		if (!iconEls.length) {
			return;
		}

		if (!iconCatalog && !iconFetching) {
			iconFetching = true;
			fetchIconCatalog()
				.then(function (catalog) {
					iconCatalog = catalog;
					iconFetching = false;
					drawIcons(iconEls);
				})
				.catch(function () {
					iconFetching = false;
				});
		} else if (iconCatalog) {
			drawIcons(iconEls);
		}
	}

	function fetchIconCatalog() {
		var iconsUrl =
			(window.nextoraIconBlock && window.nextoraIconBlock.iconsUrl) || '';
		if (!iconsUrl) {
			return Promise.reject(new Error('No icon library'));
		}

		return fetch(iconsUrl)
			.then(function (r) {
				if (!r.ok) {
					throw new Error('Icon fetch failed');
				}
				return r.json();
			})
			.then(function (data) {
				var map = {};
				if (Array.isArray(data)) {
					for (var i = 0; i < data.length; i++) {
						if (data[i].name) {
							map[data[i].name] = data[i];
						}
					}
				}
				return map;
			});
	}

	function drawIcons(iconEls) {
		for (var i = 0; i < iconEls.length; i++) {
			drawIcon(iconEls[i]);
		}
	}

	function drawIcon(el) {
		if (el._beplusVmnIconRendered || el.firstElementChild) {
			return;
		}

		el._beplusVmnIconRendered = true;

		var name = el.getAttribute('data-beplus-vmn-icon');
		if (!name || !iconCatalog || !iconCatalog[name]) {
			return;
		}

		var icon = iconCatalog[name];
		if (!icon.nodes || !icon.nodes.length) {
			return;
		}

		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', 'currentColor');
		svg.setAttribute('stroke-width', '2');
		svg.setAttribute('stroke-linecap', 'round');
		svg.setAttribute('stroke-linejoin', 'round');
		svg.setAttribute('aria-hidden', 'true');

		for (var n = 0; n < icon.nodes.length; n++) {
			appendNode(svg, icon.nodes[n]);
		}

		el.appendChild(svg);
	}

	function appendNode(parent, node) {
		if (!Array.isArray(node) || !node.length) {
			return;
		}

		var tag = node[0];
		var attrs = node[1] || {};
		var children = node.length > 2 ? node.slice(2) : [];

		var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
		var keys = Object.keys(attrs);
		for (var k = 0; k < keys.length; k++) {
			el.setAttribute(keys[k], attrs[keys[k]]);
		}

		for (var c = 0; c < children.length; c++) {
			appendNode(el, children[c]);
		}

		parent.appendChild(el);
	}

	/**
	 * @param {HTMLElement} container
	 */
	function setupContainer(container) {
		// Expando property (not a data attribute): cloneNode() copies
		// attributes but not properties, so nav clones are re-enhanced.
		if (container._beplusVmnTabsEnhanced) {
			return;
		}

		container._beplusVmnTabsEnhanced = true;
		container.removeAttribute('data-beplus-vmn-tabs-enhanced');

		var layout =
			container.dataset.beplusVmnLayout || container.getAttribute('data-beplus-vmn-layout') || 'vertical';
		var isHorizontal = layout === 'horizontal';

		var tabs = container.querySelectorAll(
			'.beplus-vmn-tab-container__tablist > [role="tab"]'
		);
		var indicator = container.querySelector(
			'.beplus-vmn-tab-container__indicator'
		);
		var panels = container.querySelectorAll(
			'.beplus-vmn-tab-container__content > [role="tabpanel"]'
		);

		if (!tabs.length || !panels.length) {
			return;
		}

		var activeIndex = getActiveIndex(tabs);

		if (indicator && tabs[activeIndex]) {
			positionIndicator(indicator, tabs[activeIndex], isHorizontal);
		}

		updateIndicatorColor(tabs[activeIndex]);

		for (var i = 0; i < tabs.length; i++) {
			(function (idx) {
				var touched = false;
				var startX = 0;
				var startY = 0;

				// Re-sync ARIA id references — clone id de-duplication
				// (Nextora portal) can break aria-controls/labelledby.
				if (panels[idx]) {
					if (panels[idx].id) {
						tabs[idx].setAttribute(
							'aria-controls',
							panels[idx].id
						);
					}
					if (tabs[idx].id) {
						panels[idx].setAttribute(
							'aria-labelledby',
							tabs[idx].id
						);
					}
				}

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
					if (indicator) {
						positionIndicator(indicator, tabs[idx], isHorizontal);
					}
					activateTab(idx, true);
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
					if (indicator) {
						positionIndicator(indicator, tabs[idx], isHorizontal);
					}
					activateTab(idx, true);
				});

				tabs[idx].addEventListener('keydown', function (e) {
					handleKeydown(e, idx);
				});
			})(i);
		}

		var tablist = container.querySelector(
			'.beplus-vmn-tab-container__tablist'
		);
		if (tablist && indicator) {
			tablist.addEventListener('mouseleave', function () {
				if (tabs[activeIndex]) {
					positionIndicator(
						indicator,
						tabs[activeIndex],
						isHorizontal
					);
					updateIndicatorColor(tabs[activeIndex]);
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
			var tablist = tab.closest('.beplus-vmn-tab-container__tablist');
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

		var animating = false;

		/**
		 * @param {number}  index
		 * @param {boolean} [animate] Whether to use the slide-up animation.
		 */
		function activateTab(index, animate) {
			if (index === activeIndex || animating) {
				return;
			}

			var prevIndex = activeIndex;
			var shouldAnimate =
				animate &&
				window.matchMedia('(min-width: 601px)').matches;

			// Update ARIA states immediately.
			for (var j = 0; j < tabs.length; j++) {
				if (j === index) {
					tabs[j].setAttribute('aria-selected', 'true');
					tabs[j].tabIndex = 0;
				} else {
					tabs[j].setAttribute('aria-selected', 'false');
					tabs[j].tabIndex = -1;
				}
			}
			activeIndex = index;
			updateIndicatorColor(tabs[index]);

			if (!shouldAnimate) {
				if (panels[prevIndex]) {
					panels[prevIndex].setAttribute('hidden', '');
				}
				if (panels[index]) {
					panels[index].removeAttribute('hidden');
				}
				return;
			}

			// ---- Animated switch ----
			animating = true;
			var leaving = panels[prevIndex];
			var entering = panels[index];

			if (leaving) {
				leaving.classList.add(
					'beplus-vmn-tab-panel--animating',
					'beplus-vmn-tab-panel--out'
				);
			}

			if (entering) {
				entering.removeAttribute('hidden');
				entering.classList.add(
					'beplus-vmn-tab-panel--animating',
					'beplus-vmn-tab-panel--in'
				);
				// Force reflow so the browser picks up the initial state.
				void entering.offsetWidth;
				entering.classList.add(
					'beplus-vmn-tab-panel--visible'
				);
			}

			function cleanup() {
				if (leaving) {
					leaving.setAttribute('hidden', '');
					leaving.classList.remove(
						'beplus-vmn-tab-panel--animating',
						'beplus-vmn-tab-panel--out'
					);
				}
				if (entering) {
					entering.classList.remove(
						'beplus-vmn-tab-panel--animating',
						'beplus-vmn-tab-panel--in',
						'beplus-vmn-tab-panel--visible'
					);
				}
				animating = false;
			}

			if (entering) {
				entering.addEventListener(
					'transitionend',
					function handler(e) {
						if (
							e.target === entering &&
							e.propertyName === 'transform'
						) {
							entering.removeEventListener(
								'transitionend',
								handler
							);
							cleanup();
						}
					}
				);
			}

			// Safety fallback in case transitionend never fires.
			setTimeout(function () {
				if (animating) {
					cleanup();
				}
			}, 500);
		}

		/**
		 * @param {HTMLElement} tab
		 */
		function updateIndicatorColor(tab) {
			if (!tab) return;
			var color = tab.getAttribute('data-beplus-vmn-tab-color');
			if (color) {
				container.style.setProperty(
					'--beplus-vmn-tab-indicator-color',
					color
				);
			} else {
				container.style.removeProperty(
					'--beplus-vmn-tab-indicator-color'
				);
			}
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
					if (indicator) {
						positionIndicator(
							indicator,
							tabs[currentIndex],
							isHorizontal
						);
					}
					activateTab(currentIndex, true);
					var tl = container.querySelector(
						'.beplus-vmn-tab-container__tablist'
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

	function boot() {
		init();
		observeDynamicContent();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}

	// Public API for external scripts to re-init tabs on cloned subtrees.
	window.beplusVmnTabsReInit = init;
})();
