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
	 * Position custom-width mega panels horizontally relative to their trigger item or screen.
	 *
	 * @param {HTMLElement} item  The .has-mega-menu li element.
	 * @param {HTMLElement} panel The mega panel element.
	 */
	function positionCustomPanel(item, panel) {
		if (!panel || panel.getAttribute('data-width') !== 'custom') {
			return;
		}

		if (isAccordionMode() || isOffcanvasMode()) {
			panel.style.left = '';
			panel.style.maxWidth = '';
			return;
		}

		const position = panel.getAttribute('data-position') || 'item-left';
		const container =
			panel.offsetParent ||
			item.closest('.nextora-header-block') ||
			document.documentElement;

		const containerRect = container.getBoundingClientRect();
		const viewportWidth =
			document.documentElement.clientWidth || window.innerWidth;

		// Determine base intended width (prefer data attribute, fallback to style/offset)
		const baseWidth =
			parseInt(panel.getAttribute('data-custom-width'), 10) ||
			parseInt(panel.style.width, 10) ||
			panel.offsetWidth ||
			780;

		// Never allow panel width to exceed viewport width minus safe padding (16px left + 16px right)
		const maxAllowedWidth = Math.max(280, viewportWidth - 32);
		const effectiveWidth = Math.min(baseWidth, maxAllowedWidth);

		let left = 0;

		if (position === 'screen-center') {
			// Exactly in the center of the screen
			const screenLeft = (viewportWidth - effectiveWidth) / 2;
			left = screenLeft - containerRect.left;
		} else if (position === 'item-center') {
			// Centered with the hovered item
			const itemRect = item.getBoundingClientRect();
			const itemCenter = itemRect.left + (itemRect.width / 2);
			const targetLeftScreen = itemCenter - (effectiveWidth / 2);
			left = targetLeftScreen - containerRect.left;
		} else {
			// Left aligned with the hovered item (current default)
			const itemRect = item.getBoundingClientRect();
			left = itemRect.left - containerRect.left;
		}

		// Calculate min and max allowed left in container coordinates to keep panel strictly within [16, viewportWidth - 16]
		const minLeft = 16 - containerRect.left;
		const maxLeft = (viewportWidth - 16 - effectiveWidth) - containerRect.left;

		left = Math.max(minLeft, Math.min(left, maxLeft));

		panel.style.boxSizing = 'border-box';
		panel.style.maxWidth = `${Math.floor(effectiveWidth)}px`;
		panel.style.left = `${Math.round(left)}px`;
		panel.style.right = 'auto';
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
	 * Helper to get only content animation elements (headings, images, buttons, paragraphs) inside a mega panel.
	 * Strictly excludes beplus menu lists and tab buttons so their CSS animations are completely untouched.
	 *
	 * @param {HTMLElement} panel Mega panel element.
	 * @return {HTMLElement[]} Array of animation elements.
	 */
	function getMegaPanelAnimationElements(panel) {
		if (!panel) return [];
		return Array.from(
			panel.querySelectorAll(
				'[class*="animation-"], [data-nextora-scroll-reveal]'
			)
		).filter((el) => {
			if (
				el.classList.contains('beplus-vmn-menu-list') ||
				el.classList.contains('beplus-vmn-menu-item') ||
				el.classList.contains('beplus-vmn-menu-list__item') ||
				el.classList.contains('beplus-vmn-tab-container') ||
				el.classList.contains('beplus-vmn-tab-container__tab') ||
				el.classList.contains('nextora-event--template4') ||
				el.classList.contains('nextora-event-compact__item') ||
				el.closest('.beplus-vmn-menu-list') ||
				el.closest('.beplus-vmn-tab-container__tablist') ||
				el.closest('.nextora-event--template4')
			) {
				return false;
			}
			if (
				el.closest(
					'.nextora-box-icon[data-nextora-scroll-reveal-style="sequential"], .nextora-blog-list-carousel[data-nextora-scroll-reveal-style="sequential"]'
				)
			) {
				return false;
			}
			const cls = el.className || '';
			const hasAnimClass =
				typeof cls === 'string' &&
				/(?:^|\s)animation-(?:fade|zoom|slide|bounce|flip|rotate)/.test(
					cls
				);
			const hasReveal = el.hasAttribute('data-nextora-scroll-reveal');
			return hasAnimClass || hasReveal;
		});
	}

	/**
	 * Play fast, synchronized entrance animation for elements with animation-* classes inside a mega panel.
	 * Eliminates page-scroll delays and prevents blank white waiting states.
	 *
	 * @param {HTMLElement} panel Mega panel element.
	 */
	function playMegaPanelAnimationClasses(panel) {
		if (!panel) return;

		const animElements = getMegaPanelAnimationElements(panel);
		if (!animElements.length) return;

		if (window.gsap) {
			window.gsap.killTweensOf(animElements);
			animElements.forEach((el, index) => {
				el.setAttribute('data-nextora-scroll-animation-init', '1');
				el.classList.remove('nextora-scroll-animation--pending');
				el.classList.add('nextora-scroll-animation--ready');

				let fromY = 14;
				let fromX = 0;
				let fromScale = 1;
				const cls = el.className || '';
				if (cls.includes('animation-fade-in-down')) fromY = -14;
				else if (cls.includes('animation-fade-in-up')) fromY = 14;
				else if (cls.includes('animation-fade-in-left')) fromX = -14;
				else if (cls.includes('animation-fade-in-right')) fromX = 14;
				else if (cls.includes('animation-zoom-in')) fromScale = 0.94;
				else if (cls.includes('animation-zoom-out')) fromScale = 1.06;

				// Instant staggered start matching menu list speed (0s, 0.04s, 0.08s...)
				const delay = Math.min(index * 0.04, 0.24);

				window.gsap.fromTo(
					el,
					{
						opacity: 0,
						x: fromX,
						y: fromY,
						scale: fromScale,
					},
					{
						opacity: 1,
						x: 0,
						y: 0,
						scale: 1,
						duration: 0.45,
						delay: delay,
						ease: 'power2.out',
						clearProps: 'transform,translate,scale',
						overwrite: 'auto',
					}
				);
			});
		} else {
			// Fallback if GSAP is not available
			animElements.forEach((el) => {
				el.setAttribute('data-nextora-scroll-animation-init', '1');
				el.classList.remove('nextora-scroll-animation--pending');
				el.classList.add('nextora-scroll-animation--ready');
				el.style.opacity = '1';
				el.style.transform = 'none';
			});
		}
	}

	/**
	 * Trigger / restart sequential entrance animations for all animated lists within a panel.
	 *
	 * @param {HTMLElement|null} panel Mega panel element.
	 */
	function triggerListAnimations(panel) {
		if (!panel) return;
		const lists = panel.querySelectorAll(
			'.beplus-vmn-menu-list--animation-sequential, .beplus-vmn-menu-list--animation-default, .beplus-vmn-tab-container--animation-sequential, .beplus-vmn-tab-container--animation-default, .nextora-event--animation-sequential, .nextora-event--animation-default, .nextora-box-icon[data-nextora-scroll-reveal-style="sequential"], .nextora-blog-list-carousel[data-nextora-scroll-reveal-style="sequential"]'
		);
		lists.forEach((list) => {
			list.classList.remove('is-animating');
			// Force DOM reflow so browser restarts the staggered animation cleanly
			void list.offsetWidth;
			list.classList.add('is-animating');
		});

		// Trigger fast synchronized animation for all animated content elements inside panel
		playMegaPanelAnimationClasses(panel);
	}

	/**
	 * Reset sequential animation state when leaving or closing a mega panel.
	 *
	 * @param {HTMLElement|null} panel Mega panel element.
	 */
	function resetListAnimations(panel) {
		if (!panel) return;
		const lists = panel.querySelectorAll(
			'.beplus-vmn-menu-list--animation-sequential, .beplus-vmn-menu-list--animation-default, .beplus-vmn-tab-container--animation-sequential, .beplus-vmn-tab-container--animation-default, .nextora-event--animation-sequential, .nextora-event--animation-default, .nextora-box-icon[data-nextora-scroll-reveal-style="sequential"], .nextora-blog-list-carousel[data-nextora-scroll-reveal-style="sequential"]'
		);
		lists.forEach((list) => {
			list.classList.remove('is-animating');
		});

		const animElements = getMegaPanelAnimationElements(panel);
		if (window.gsap && animElements.length) {
			window.gsap.killTweensOf(animElements);
		}

		animElements.forEach((el) => {
			el.setAttribute('data-nextora-scroll-animation-init', '1');
			el.classList.remove('nextora-scroll-animation--pending');
			el.classList.add('nextora-scroll-animation--ready');
			el.style.opacity = '';
			el.style.transform = '';
		});
	}

	/**
	 * Observe animated menu lists and tab containers for entrance reveal on scroll.
	 *
	 * @param {HTMLElement|Document} root Root to scan.
	 */
	function initAnimatedLists(root) {
		const scope = root || document;
		const lists = scope.querySelectorAll(
			'.beplus-vmn-menu-list--animation-sequential, .beplus-vmn-menu-list--animation-default, .beplus-vmn-tab-container--animation-sequential, .beplus-vmn-tab-container--animation-default, .nextora-event--animation-sequential, .nextora-event--animation-default'
		);
		if (!lists.length) {
			return;
		}

		if (!('IntersectionObserver' in window)) {
			lists.forEach((list) => list.classList.add('is-animated'));
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-animated');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.1 }
		);

		lists.forEach((list) => {
			if (!list.closest(MEGA_ITEMS)) {
				observer.observe(list);
			}
		});
	}

	/**
	 * Synchronizes active/current menu item state based on window.location.
	 * Supports relative paths, absolute URLs, query parameters (e.g. ?theme=pumori), and hash anchors.
	 */
	function syncActiveMenuItems() {
		const currentPath =
			window.location.pathname.replace(/\/+$/, '') || '/';
		const currentParams = new URLSearchParams(window.location.search);
		const currentTheme = currentParams.get('theme');

		document.querySelectorAll('.beplus-vmn-menu-list').forEach((list) => {
			const items = list.querySelectorAll(
				'.beplus-vmn-menu-item, .beplus-vmn-menu-list__item'
			);
			let bestItem = null;
			let bestScore = -1;

			items.forEach((item) => {
				const link = item.querySelector(
					'.beplus-vmn-menu-item__link, .beplus-vmn-menu-list__link'
				);
				if (!link) {
					return;
				}

				const href = link.getAttribute('href');
				if (!href || href === '#') {
					return;
				}

				try {
					const targetUrl = new URL(href, window.location.origin);
					const targetPath =
						targetUrl.pathname.replace(/\/+$/, '') || '/';
					const targetParams = new URLSearchParams(targetUrl.search);
					const targetTheme = targetParams.get('theme');

					if (targetPath !== currentPath) {
						return;
					}

					let score = 1;
					let paramsMatch = true;

					targetParams.forEach((val, key) => {
						if (currentParams.get(key) !== val) {
							paramsMatch = false;
						} else {
							score += 2;
						}
					});

					if (!paramsMatch) {
						return;
					}

					// If target has NO theme param, but current URL has a theme param
					if (!targetTheme && currentTheme) {
						return;
					}

					if (score > bestScore) {
						bestScore = score;
						bestItem = item;
					}
				} catch {
					// Ignore invalid URLs
				}
			});

			if (bestItem) {
				items.forEach((item) => {
					if (item !== bestItem) {
						item.classList.remove(
							'is-current',
							'current-menu-item',
							'current_page_item'
						);
						const otherLink = item.querySelector('a');
						otherLink?.removeAttribute('aria-current');
					}
				});
				bestItem.classList.add('is-current', 'current-menu-item');
				const bestLink = bestItem.querySelector('a');
				bestLink?.setAttribute('aria-current', 'page');
			}
		});
	}

	/**
	 * Initialize mega menu interactions.
	 */
	function init() {
		initAnimatedLists(document);
		syncActiveMenuItems();

		if (!document.querySelector(MEGA_ITEMS)) {
			return;
		}

		enhanceItems(document);
		observeNavClones();
		bindDelegatedEvents();

		window.addEventListener('popstate', syncActiveMenuItems);

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

		window.addEventListener('resize', () => {
			if (isAccordionMode() || isOffcanvasMode()) {
				return;
			}
			document.querySelectorAll(MEGA_ITEMS).forEach((item) => {
				if (item instanceof HTMLElement) {
					const panel = getPanel(item);
					if (panel && panel.getAttribute('data-width') === 'custom') {
						positionCustomPanel(item, panel);
					}
				}
			});
		});
	}

	/**
	 * Enhance mega menu items inside a root node (document or portal mount).
	 *
	 * @param {HTMLElement|Document} root Root to scan.
	 */
	function enhanceItems(root) {
		initAnimatedLists(root);

		root.querySelectorAll(MEGA_ITEMS).forEach((item) => {
			if (!(item instanceof HTMLElement)) {
				return;
			}

			if (item.hasAttribute(ENHANCED_ATTR)) {
				return;
			}

			item.setAttribute(ENHANCED_ATTR, 'true');
			setupItem(item);

			const panel = getPanel(item);
			if (panel) {
				if (panel.getAttribute('data-width') === 'custom') {
					positionCustomPanel(item, panel);
				}

				// Pre-mark all animated content elements inside mega panel as initialized so they are never hidden by CSS
				getMegaPanelAnimationElements(panel).forEach((el) => {
					el.setAttribute('data-nextora-scroll-animation-init', '1');
					el.classList.remove('nextora-scroll-animation--pending');
					el.classList.add('nextora-scroll-animation--ready');
				});
			}
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

	/** Track currently hovered mega menu item to prevent redundant animation triggers on child elements */
	let currentHoveredMegaItem = null;

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

		document.addEventListener(
			'mouseenter',
			(e) => {
				if (isAccordionMode() || isOffcanvasMode()) {
					return;
				}

				const target = e.target;
				if (!(target instanceof Element)) {
					return;
				}

				const megaItem = target.closest(MEGA_ITEMS);
				if (!megaItem || !(megaItem instanceof HTMLElement)) {
					if (currentHoveredMegaItem) {
						const prevPanel = getPanel(currentHoveredMegaItem);
						if (prevPanel) {
							resetListAnimations(prevPanel);
						}
						currentHoveredMegaItem = null;
					}
					return;
				}

				// If already hovering inside the same mega menu item or its panel, do not re-trigger animations
				if (megaItem === currentHoveredMegaItem) {
					return;
				}

				// Switching from another mega item
				if (currentHoveredMegaItem) {
					const prevPanel = getPanel(currentHoveredMegaItem);
					if (prevPanel) {
						resetListAnimations(prevPanel);
					}
				}

				currentHoveredMegaItem = megaItem;

				const panel = getPanel(megaItem);
				if (panel) {
					positionCustomPanel(megaItem, panel);
					triggerListAnimations(panel);
				}

				closeAllExcept(megaItem);
			},
			true
		);

		document.addEventListener(
			'mouseleave',
			(e) => {
				if (isAccordionMode() || isOffcanvasMode()) {
					return;
				}

				if (!currentHoveredMegaItem) {
					return;
				}

				const related = e.relatedTarget;
				// Only reset when mouse truly exits currentHoveredMegaItem completely
				if (
					!related ||
					!(related instanceof Node) ||
					!currentHoveredMegaItem.contains(related)
				) {
					const panel = getPanel(currentHoveredMegaItem);
					if (panel) {
						resetListAnimations(panel);
					}
					currentHoveredMegaItem = null;
				}
			},
			true
		);
	}

	/**
	 * Close all open mega panels except the given item.
	 *
	 * @param {HTMLElement} keepItem Menu item to keep open.
	 */
	function closeAllExcept(keepItem) {
		document.querySelectorAll(MEGA_ITEMS).forEach((item) => {
			if (item === keepItem || !(item instanceof HTMLElement)) {
				return;
			}

			const panel = getPanel(item);
			const link = getLink(item);

			if (panel) {
				resetListAnimations(panel);
			}

			if (panel?.classList.contains(OPEN_CLASS) && link) {
				closePanel(panel, link, item);
			}
		});
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
			const href = link.getAttribute('href');

			if (href && href !== '#') {
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
		positionCustomPanel(item, panel);
		panel.classList.add(OPEN_CLASS);
		item.classList.add(ACCORDION_CLASS);
		link.setAttribute(ARIA_EXPANDED, 'true');
		triggerListAnimations(panel);

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
		resetListAnimations(panel);

		if (isAccordionMode() || isOffcanvasMode()) {
			panel.style.left = '';
			panel.style.maxWidth = '';
		}

		if (
			document.activeElement instanceof HTMLElement &&
			item.contains(document.activeElement)
		) {
			document.activeElement.blur();
		}

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
		currentHoveredMegaItem = null;

		document.querySelectorAll(`${MEGA_ITEMS}`).forEach((item) => {
			if (!(item instanceof HTMLElement)) {
				return;
			}

			const panel = getPanel(item);
			const link = getLink(item);

			if (panel) {
				resetListAnimations(panel);
			}

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
