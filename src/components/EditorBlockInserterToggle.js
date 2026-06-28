/**
 * EditorBlockInserterToggle — toolbar button that opens the block library.
 *
 * @package
 */

import { __experimentalLibrary as InserterLibrary } from '@wordpress/block-editor';
import { Dropdown, Button } from '@wordpress/components';
import { plus, closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function EditorBlockInserterToggle({ disabled = false }) {
	return (
		<Dropdown
			className="beplus-vmn-inserter-dropdown"
			contentClassName="beplus-vmn-inserter-dropdown__popover"
			popoverProps={{
				placement: 'bottom-start',
				offset: 4,
				shift: true,
			}}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					className="beplus-vmn-inserter-toggle"
					icon={plus}
					label={__('Add block', 'beplus-visual-mega-nav')}
					onClick={onToggle}
					aria-expanded={isOpen}
					isPressed={isOpen}
					showTooltip
					disabled={disabled}
				/>
			)}
			renderContent={({ onClose }) => (
				<div className="beplus-vmn-inserter-dropdown__panel">
					<div className="beplus-vmn-inserter-dropdown__header">
						<h3 className="beplus-vmn-inserter-dropdown__title">
							{__('Add block', 'beplus-visual-mega-nav')}
						</h3>
						<Button
							className="beplus-vmn-inserter-dropdown__close"
							icon={closeSmall}
							label={__('Close', 'beplus-visual-mega-nav')}
							onClick={onClose}
							size="small"
						/>
					</div>
					<div className="beplus-vmn-inserter-dropdown__content">
						<InserterLibrary
							rootClientId=""
							isAppender
							showInserterHelpPanel={false}
							showMostUsedBlocks={false}
							__experimentalInitialTab="blocks"
							onSelect={() => {}}
							onClose={onClose}
							shouldFocusBlock
						/>
					</div>
				</div>
			)}
		/>
	);
}
