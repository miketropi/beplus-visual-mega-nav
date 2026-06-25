/**
 * MegaMenuApp — top-level component.
 *
 * Observes the nav-menus.php DOM for root-level menu items,
 * injects "Mega Menu" buttons, and opens the editor modal.
 *
 * @package
 */

/* global MutationObserver, Node */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MegaMenuModal from './MegaMenuModal';

/**
 * Inject a "Mega Menu" button into a depth-0 menu item's action bar.
 *
 * @param {HTMLElement} menuItem The .menu-item element.
 * @param {Function}    onClick  Click handler receiving the menu item ID.
 */
function injectButton(menuItem, onClick) {
	if (menuItem.querySelector('.snap-megamenu-btn')) {
		return;
	}

	const id = menuItem.id?.replace('menu-item-', '');
	if (!id) {
		return;
	}

	const actions = menuItem.querySelector('.menu-item-actions');
	if (!actions) {
		return;
	}

	const separator = document.createTextNode(' | ');
	const btn = document.createElement('a');
	btn.href = '#';
	btn.className = 'snap-megamenu-btn';
	btn.textContent = __('Mega Menu', 'snap-megamenu-builder');
	btn.dataset.menuItemId = id;

	btn.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		onClick(id);
	});

	actions.appendChild(separator);
	actions.appendChild(btn);
}

/**
 * Remove "Mega Menu" buttons from items that are no longer depth-0.
 *
 * @param {HTMLElement} container The #menu-to-edit container.
 */
function cleanupButtons(container) {
	container
		.querySelectorAll(
			'.menu-item:not(.menu-item-depth-0) .snap-megamenu-btn'
		)
		.forEach((btn) => {
			// Remove the preceding " | " text node.
			const prev = btn.previousSibling;
			if (prev && prev.nodeType === Node.TEXT_NODE) {
				prev.remove();
			}
			btn.remove();
		});
}

export default function MegaMenuApp({ menuContainer }) {
	const [activeItemId, setActiveItemId] = useState(null);

	const scanAndInject = useCallback(() => {
		menuContainer.querySelectorAll('.menu-item-depth-0').forEach((item) => {
			injectButton(item, setActiveItemId);
		});
		cleanupButtons(menuContainer);
	}, [menuContainer]);

	useEffect(() => {
		// Initial scan.
		scanAndInject();

		// Re-scan when DOM changes (drag-drop reorder, new items added).
		const observer = new MutationObserver(() => {
			scanAndInject();
		});

		observer.observe(menuContainer, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class'],
		});

		return () => observer.disconnect();
	}, [menuContainer, scanAndInject]);

	return (
		<>
			{activeItemId && (
				<MegaMenuModal
					menuItemId={activeItemId}
					onClose={() => setActiveItemId(null)}
				/>
			)}
		</>
	);
}
