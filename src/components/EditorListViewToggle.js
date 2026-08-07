/**
 * EditorListViewToggle — toolbar button that opens List View in a draggable,
 * non-auto-closing overlay. Only the explicit close button dismisses it.
 *
 * @package
 */

import { useState, useRef, useCallback, useEffect } from '@wordpress/element';
import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { listView, closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function EditorListViewToggle() {
	const [isOpen, setIsOpen] = useState(false);
	const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const buttonRef = useRef(null);
	const dragStartRef = useRef({ x: 0, y: 0, top: 0, left: 0 });

	const computeInitialPos = useCallback(() => {
		const rect = buttonRef.current?.getBoundingClientRect();
		if (!rect) {
			return { top: 0, left: 0 };
		}
		return { top: rect.bottom + 4, left: rect.left };
	}, []);

	const open = useCallback(() => {
		setPopupPos(computeInitialPos());
		setIsOpen(true);
	}, [computeInitialPos]);

	const close = useCallback(() => setIsOpen(false), []);

	const toggle = useCallback(() => {
		if (isOpen) {
			close();
		} else {
			open();
		}
	}, [isOpen, open, close]);

	const handleDragStart = useCallback(
		(e) => {
			if (e.button !== 0) {
				return;
			}
			if (e.target.closest('button')) {
				return;
			}

			setIsDragging(true);
			dragStartRef.current = {
				x: e.clientX,
				y: e.clientY,
				top: popupPos.top,
				left: popupPos.left,
			};
			e.preventDefault();
		},
		[popupPos]
	);

	useEffect(() => {
		if (!isDragging) {
			return;
		}

		const handleMouseMove = (e) => {
			setPopupPos({
				top:
					dragStartRef.current.top +
					(e.clientY - dragStartRef.current.y),
				left:
					dragStartRef.current.left +
					(e.clientX - dragStartRef.current.x),
			});
		};

		const handleMouseUp = () => setIsDragging(false);

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		document.body.style.userSelect = 'none';

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.body.style.userSelect = '';
		};
	}, [isDragging]);

	// Close on Escape.
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (e) => {
			if (e.key === 'Escape') {
				close();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, close]);

	const popupClass =
		'beplus-vmn-list-view-dropdown__popover components-popover' +
		(isDragging ? ' beplus-vmn-list-view-dropdown__popover--dragging' : '');

	const popupStyle = {
		position: 'fixed',
		top: popupPos.top,
		left: popupPos.left,
		zIndex: 500000,
	};

	return (
		<>
			<Button
				ref={buttonRef}
				className="beplus-vmn-list-view-toggle"
				icon={listView}
				label={__('List View', 'beplus-visual-mega-nav')}
				onClick={toggle}
				aria-expanded={isOpen}
				isPressed={isOpen}
				showTooltip
			/>
			{isOpen && (
				<div className={popupClass} style={popupStyle}>
					<div className="components-popover__content">
						<div className="beplus-vmn-list-view-dropdown__panel">
							{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
							<div
								className="beplus-vmn-list-view-dropdown__header"
								onMouseDown={handleDragStart}
							>
								<h3 className="beplus-vmn-list-view-dropdown__title">
									{__('List View', 'beplus-visual-mega-nav')}
								</h3>
								<Button
									className="beplus-vmn-list-view-dropdown__close"
									icon={closeSmall}
									label={__(
										'Close',
										'beplus-visual-mega-nav'
									)}
									onClick={close}
									size="small"
								/>
							</div>
							<div className="beplus-vmn-list-view-dropdown__content">
								<ListView
									id="beplus-vmn-list-view"
									isExpanded={true}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
