/**
 * EditorListViewToggle — toolbar button that opens List View in a dropdown overlay.
 *
 * @package Snap\MegaMenu
 */

import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Dropdown, Button } from '@wordpress/components';
import { listView, closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function EditorListViewToggle() {
	return (
		<Dropdown
			className="snap-megamenu-list-view-dropdown"
			contentClassName="snap-megamenu-list-view-dropdown__popover"
			popoverProps={ {
				placement: 'bottom-start',
				offset: 4,
				shift: true,
			} }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					className="snap-megamenu-list-view-toggle"
					icon={ listView }
					label={ __( 'List View', 'snap-megamenu-builder' ) }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					isPressed={ isOpen }
					showTooltip
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<div className="snap-megamenu-list-view-dropdown__panel">
					<div className="snap-megamenu-list-view-dropdown__header">
						<h3 className="snap-megamenu-list-view-dropdown__title">
							{ __( 'List View', 'snap-megamenu-builder' ) }
						</h3>
						<Button
							className="snap-megamenu-list-view-dropdown__close"
							icon={ closeSmall }
							label={ __( 'Close', 'snap-megamenu-builder' ) }
							onClick={ onClose }
							size="small"
						/>
					</div>
					<div className="snap-megamenu-list-view-dropdown__content">
						<ListView
							id="snap-megamenu-list-view"
							isExpanded={ true }
						/>
					</div>
				</div>
			) }
		/>
	);
}
