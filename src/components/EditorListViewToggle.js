/**
 * EditorListViewToggle — toolbar button that opens List View in a dropdown overlay.
 *
 * @package
 */

import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Dropdown, Button } from '@wordpress/components';
import { listView, closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function EditorListViewToggle() {
	return (
		<Dropdown
			className="beplus-vmn-list-view-dropdown"
			contentClassName="beplus-vmn-list-view-dropdown__popover"
			popoverProps={{
				placement: 'bottom-start',
				offset: 4,
				shift: true,
			}}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					className="beplus-vmn-list-view-toggle"
					icon={listView}
					label={__('List View', 'beplus-visual-mega-nav')}
					onClick={onToggle}
					aria-expanded={isOpen}
					isPressed={isOpen}
					showTooltip
				/>
			)}
			renderContent={({ onClose }) => (
				<div className="beplus-vmn-list-view-dropdown__panel">
					<div className="beplus-vmn-list-view-dropdown__header">
						<h3 className="beplus-vmn-list-view-dropdown__title">
							{__('List View', 'beplus-visual-mega-nav')}
						</h3>
						<Button
							className="beplus-vmn-list-view-dropdown__close"
							icon={closeSmall}
							label={__('Close', 'beplus-visual-mega-nav')}
							onClick={onClose}
							size="small"
						/>
					</div>
					<div className="beplus-vmn-list-view-dropdown__content">
						<ListView id="beplus-vmn-list-view" isExpanded={true} />
					</div>
				</div>
			)}
		/>
	);
}
