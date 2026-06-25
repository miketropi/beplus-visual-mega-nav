/**
 * EditorBlockInserterToggle — toolbar button that opens the block library.
 *
 * @package
 */

// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- experimental Library provides the block inserter UI
import { __experimentalLibrary as InserterLibrary } from '@wordpress/block-editor';
import { Dropdown, Button } from '@wordpress/components';
import { plus, closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function EditorBlockInserterToggle({ disabled = false }) {
	return (
		<Dropdown
			className="snap-megamenu-inserter-dropdown"
			contentClassName="snap-megamenu-inserter-dropdown__popover"
			popoverProps={{
				placement: 'bottom-start',
				offset: 4,
				shift: true,
			}}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					className="snap-megamenu-inserter-toggle"
					icon={plus}
					label={__('Add block', 'snap-megamenu-builder')}
					onClick={onToggle}
					aria-expanded={isOpen}
					isPressed={isOpen}
					showTooltip
					disabled={disabled}
				/>
			)}
			renderContent={({ onClose }) => (
				<div className="snap-megamenu-inserter-dropdown__panel">
					<div className="snap-megamenu-inserter-dropdown__header">
						<h3 className="snap-megamenu-inserter-dropdown__title">
							{__('Add block', 'snap-megamenu-builder')}
						</h3>
						<Button
							className="snap-megamenu-inserter-dropdown__close"
							icon={closeSmall}
							label={__('Close', 'snap-megamenu-builder')}
							onClick={onClose}
							size="small"
						/>
					</div>
					<div className="snap-megamenu-inserter-dropdown__content">
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
