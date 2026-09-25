/**
 * Menu Item block — editor UI.
 *
 * @package
 */

import { useSelect, useDispatch } from '@wordpress/data';
import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	PanelColorSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
	ToolbarGroup,
	ToolbarButton,
	Button,
	ButtonGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	useThemeColorPalette,
	normalizeColorForStorage,
	colorValueForPicker,
	resolveColorToCss,
} from '../../utils/color-utils';

const BADGE_POSITIONS = [
	{
		label: __('Above Text (Floating Bubble)', 'beplus-visual-mega-nav'),
		value: 'top',
	},
	{
		label: __('Beside Text (Inline)', 'beplus-visual-mega-nav'),
		value: 'inline',
	},
];

export default function Edit({
	attributes,
	setAttributes,
	context = {},
	clientId,
}) {
	const {
		label,
		url,
		id,
		type,
		opensInNewTab,
		isCustomLink,
		badge,
		badgePosition = 'top',
		badgeBgColor = '#f59e0b',
		badgeTextColor = '#ffffff',
	} = attributes;

	// Inherit settings from parent Menu List block via context.
	const listActiveStyle =
		context['beplus-visual-mega-nav/activeStyle'] || 'background';
	const listHighlightCurrent =
		context['beplus-visual-mega-nav/highlightCurrent'] ?? true;
	const listPreviewActive =
		context['beplus-visual-mega-nav/previewActive'] ?? false;
	const listItemPaddingV =
		context['beplus-visual-mega-nav/itemPaddingVertical'];
	const listItemPaddingH =
		context['beplus-visual-mega-nav/itemPaddingHorizontal'];

	const palette = useThemeColorPalette();

	// Determine if custom link mode is active
	const isCustom =
		isCustomLink !== undefined
			? isCustomLink
			: type === 'custom' || (!id && Boolean(url));

	// Fetch published pages for clean selection.
	const pages = useSelect((select) => {
		const records = select('core').getEntityRecords('postType', 'page', {
			per_page: 100,
			status: 'publish',
			orderby: 'title',
			order: 'asc',
		});
		return Array.isArray(records) ? records : [];
	}, []);

	// Block positioning and manipulation.
	const { rootClientId, blockIndex, blocksCount } = useSelect(
		(select) => {
			const { getBlockRootClientId, getBlockIndex, getBlockOrder } =
				select('core/block-editor');
			const root = getBlockRootClientId(clientId);
			const order = root ? getBlockOrder(root) : [];
			return {
				rootClientId: root,
				blockIndex: getBlockIndex(clientId),
				blocksCount: order.length,
			};
		},
		[clientId]
	);

	const { moveBlocksUp, moveBlocksDown, removeBlock, insertBlock } =
		useDispatch('core/block-editor');
	const { getBlock } = useSelect('core/block-editor');

	const canMoveUp = blockIndex > 0;
	const canMoveDown = blockIndex < blocksCount - 1;

	const onMoveUp = () => {
		if (canMoveUp) {
			moveBlocksUp([clientId], rootClientId);
		}
	};

	const onMoveDown = () => {
		if (canMoveDown) {
			moveBlocksDown([clientId], rootClientId);
		}
	};

	const onDelete = () => {
		removeBlock(clientId);
	};

	const onDuplicate = () => {
		const currentBlock = getBlock(clientId);
		if (currentBlock && wp.blocks?.cloneBlock) {
			const clone = wp.blocks.cloneBlock(currentBlock);
			insertBlock(clone, blockIndex + 1, rootClientId);
		}
	};

	// Highlight the first item if previewActive is toggled on the list.
	const isCurrentPreview = listPreviewActive && blockIndex === 0;

	const resolvedBadgeBg = resolveColorToCss(badgeBgColor, '#f59e0b');
	const resolvedBadgeText = resolveColorToCss(badgeTextColor, '#ffffff');

	const inlineStyles = {
		...(resolvedBadgeBg
			? { '--beplus-vmn-item-badge-bg': resolvedBadgeBg }
			: {}),
		...(resolvedBadgeText
			? { '--beplus-vmn-item-badge-color': resolvedBadgeText }
			: {}),
		...(listItemPaddingV !== undefined
			? { '--beplus-vmn-list-item-padding-v': `${listItemPaddingV}px` }
			: {}),
		...(listItemPaddingH !== undefined
			? { '--beplus-vmn-list-item-padding-h': `${listItemPaddingH}px` }
			: {}),
	};

	const blockProps = useBlockProps({
		className: [
			'beplus-vmn-menu-item',
			`beplus-vmn-menu-item--active-${listActiveStyle}`,
			badge && badgePosition === 'top'
				? 'beplus-vmn-menu-item--has-badge-top'
				: '',
			isCurrentPreview && listHighlightCurrent
				? 'is-current current-menu-item'
				: '',
		]
			.filter(Boolean)
			.join(' '),
		style: inlineStyles,
	});

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon="arrow-up-alt2"
						label={__('Move Up', 'beplus-visual-mega-nav')}
						onClick={onMoveUp}
						disabled={!canMoveUp}
					/>
					<ToolbarButton
						icon="arrow-down-alt2"
						label={__('Move Down', 'beplus-visual-mega-nav')}
						onClick={onMoveDown}
						disabled={!canMoveDown}
					/>
					<ToolbarButton
						icon="admin-page"
						label={__('Duplicate', 'beplus-visual-mega-nav')}
						onClick={onDuplicate}
					/>
					<ToolbarButton
						icon="trash"
						label={__('Delete Item', 'beplus-visual-mega-nav')}
						onClick={onDelete}
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody
					title={__('Link & Destination', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					{!isCustom ? (
						<SelectControl
							label={__('Select Page', 'beplus-visual-mega-nav')}
							value={id ? String(id) : ''}
							options={[
								{
									label: __(
										'— Select a Page —',
										'beplus-visual-mega-nav'
									),
									value: '',
								},
								...pages.map((p) => ({
									label: p.title?.rendered
										? p.title.rendered
										: `Page #${p.id}`,
									value: String(p.id),
								})),
							]}
							onChange={(pageId) => {
								if (!pageId) {
									setAttributes({
										id: 0,
										url: '',
										type: '',
										kind: '',
										isCustomLink: false,
									});
									return;
								}
								const selectedPage = pages.find(
									(p) => String(p.id) === String(pageId)
								);
								if (selectedPage) {
									const pageTitle =
										selectedPage.title?.rendered || '';
									const shouldUpdateLabel =
										!label ||
										pages.some(
											(p) => p.title?.rendered === label
										);
									setAttributes({
										id: selectedPage.id,
										url: selectedPage.link,
										type: 'page',
										kind: 'post-type',
										isCustomLink: false,
										label: shouldUpdateLabel
											? pageTitle
											: label,
									});
								}
							}}
						/>
					) : (
						<TextControl
							label={__('Custom URL', 'beplus-visual-mega-nav')}
							value={url || ''}
							onChange={(val) =>
								setAttributes({
									url: val,
									type: 'custom',
									kind: 'custom',
									id: 0,
								})
							}
							placeholder="https://example.com or #section"
						/>
					)}

					<ToggleControl
						label={__('Open in new tab', 'beplus-visual-mega-nav')}
						checked={Boolean(opensInNewTab)}
						onChange={(val) =>
							setAttributes({ opensInNewTab: val })
						}
					/>

					<ToggleControl
						label={__('Custom Link', 'beplus-visual-mega-nav')}
						help={
							isCustom
								? __(
										'Enter a custom URL or external link.',
										'beplus-visual-mega-nav'
									)
								: __(
										'Enable to enter a custom URL instead of selecting a page.',
										'beplus-visual-mega-nav'
									)
						}
						checked={isCustom}
						onChange={(val) => {
							setAttributes({
								isCustomLink: val,
								...(val
									? {
											id: 0,
											type: 'custom',
											kind: 'custom',
										}
									: {
											type: 'page',
											kind: 'post-type',
										}),
							});
						}}
					/>

					<TextControl
						label={__('Label', 'beplus-visual-mega-nav')}
						value={label || ''}
						onChange={(val) => setAttributes({ label: val })}
						placeholder={__(
							'Menu link text',
							'beplus-visual-mega-nav'
						)}
					/>

					<TextControl
						label={__('Badge Text', 'beplus-visual-mega-nav')}
						value={badge || ''}
						onChange={(val) => setAttributes({ badge: val })}
						placeholder={__(
							'e.g. HOT, NEW, BEST',
							'beplus-visual-mega-nav'
						)}
					/>

					{badge && (
						<SelectControl
							label={__(
								'Badge Position',
								'beplus-visual-mega-nav'
							)}
							value={badgePosition || 'top'}
							options={BADGE_POSITIONS}
							onChange={(val) =>
								setAttributes({ badgePosition: val })
							}
						/>
					)}
				</PanelBody>

				{badge && (
					<PanelColorSettings
						title={__('Badge Colors', 'beplus-visual-mega-nav')}
						initialOpen={true}
						enableAlpha={true}
						colorSettings={[
							{
								value: colorValueForPicker(
									badgeBgColor,
									palette
								),
								onChange: (val) =>
									setAttributes({
										badgeBgColor: normalizeColorForStorage(
											val,
											palette
										),
									}),
								label: __(
									'Badge Background',
									'beplus-visual-mega-nav'
								),
							},
							{
								value: colorValueForPicker(
									badgeTextColor,
									palette
								),
								onChange: (val) =>
									setAttributes({
										badgeTextColor:
											normalizeColorForStorage(
												val,
												palette
											),
									}),
								label: __(
									'Badge Text',
									'beplus-visual-mega-nav'
								),
							},
						]}
					/>
				)}

				<PanelBody
					title={__('Manage Menu Item', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '8px',
						}}
					>
						<ButtonGroup style={{ display: 'flex', width: '100%' }}>
							<Button
								variant="secondary"
								onClick={onMoveUp}
								disabled={!canMoveUp}
								style={{ flex: 1, justifyContent: 'center' }}
							>
								{__('Move Up ↑', 'beplus-visual-mega-nav')}
							</Button>
							<Button
								variant="secondary"
								onClick={onMoveDown}
								disabled={!canMoveDown}
								style={{ flex: 1, justifyContent: 'center' }}
							>
								{__('Move Down ↓', 'beplus-visual-mega-nav')}
							</Button>
						</ButtonGroup>

						<Button
							variant="secondary"
							onClick={onDuplicate}
							style={{ width: '100%', justifyContent: 'center' }}
						>
							{__('Duplicate Item', 'beplus-visual-mega-nav')}
						</Button>

						<Button
							isDestructive={true}
							variant="secondary"
							onClick={onDelete}
							style={{
								width: '100%',
								justifyContent: 'center',
								borderColor: '#cc1818',
							}}
						>
							{__('Delete Item', 'beplus-visual-mega-nav')}
						</Button>
					</div>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<a
					className="beplus-vmn-menu-item__link"
					href="#preview"
					onClick={(e) => e.preventDefault()}
					style={
						listItemPaddingV !== undefined ||
						listItemPaddingH !== undefined
							? {
									padding: `${listItemPaddingV ?? 7}px ${
										listItemPaddingH ?? 12
									}px`,
								}
							: undefined
					}
				>
					<span className="beplus-vmn-menu-item__label-wrap">
						<span className="beplus-vmn-menu-item__label">
							{label ||
								url ||
								__(
									'Menu Item (Select URL in sidebar)',
									'beplus-visual-mega-nav'
								)}
						</span>
						{badge && (
							<span
								className={`beplus-vmn-menu-item__badge beplus-vmn-menu-item__badge--${
									badgePosition || 'top'
								}`}
								aria-hidden="true"
							>
								{badge}
							</span>
						)}
					</span>
				</a>
			</div>
		</>
	);
}
