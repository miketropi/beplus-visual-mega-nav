/**
 * Tab Container block — editor UI.
 *
 * Click a tab button to show only the corresponding panel content
 * (like the frontend). Layout and color settings in the inspector.
 * Tabs can be reordered via move-up/move-down buttons.
 *
 * @package
 */

import {
	useState,
	useLayoutEffect,
	useRef,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
	PanelColorSettings,
	FontSizePicker,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	Button,
	RangeControl,
	BaseControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ALLOWED_BLOCKS = ['beplus-visual-mega-nav/tab-panel'];

/*
 * ---- Icon helpers ----
 */

let cachedIconEntries = null;

async function loadIcons() {
	if (cachedIconEntries) {
		return cachedIconEntries;
	}

	const iconsUrl = window.nextoraIconBlock?.iconsUrl ?? '';
	if (!iconsUrl) {
		return [];
	}

	const response = await fetch(iconsUrl);
	if (!response.ok) {
		return [];
	}

	const data = await response.json();
	cachedIconEntries = Array.isArray(data) ? data : [];
	return cachedIconEntries;
}

function SvgNode({ node }) {
	if (!Array.isArray(node) || !node.length) {
		return null;
	}

	const [tag, attrs, ...rest] = node;
	const children = rest.length > 0 && Array.isArray(rest[0]) ? rest[0] : rest;

	const Tag = tag;
	const props = {};

	if (attrs && typeof attrs === 'object') {
		Object.entries(attrs).forEach(([k, v]) => {
			props[k] = v;
		});
	}

	return (
		<Tag {...props}>
			{children.map((child, i) =>
				Array.isArray(child) ? <SvgNode key={i} node={child} /> : null
			)}
		</Tag>
	);
}

function TabIconPreview({ name }) {
	const [catalog, setCatalog] = useState(null);

	useEffect(() => {
		let mounted = true;
		loadIcons()
			.then((data) => {
				if (!mounted) return;
				if (Array.isArray(data)) {
					const lookup = {};
					data.forEach((icon) => {
						if (icon.name) lookup[icon.name] = icon;
					});
					setCatalog(lookup);
				}
			})
			.catch(() => {});

		return () => {
			mounted = false;
		};
	}, []);

	const icon = catalog ? catalog[name] : null;

	if (!icon || !icon.nodes || !icon.nodes.length) {
		return null;
	}

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{icon.nodes.map((node, idx) => (
				<SvgNode key={idx} node={node} />
			))}
		</svg>
	);
}

/*
 * ---- Chevron icons (move buttons) ----
 */

function ChevronUpIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="18 15 12 9 6 15" />
		</svg>
	);
}

function ChevronDownIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	);
}

function normalizeFontSizeAttribute(value, selectedItem) {
	if (value === undefined || value === '') {
		return '';
	}
	if (selectedItem?.slug) {
		return selectedItem.slug;
	}
	const str = String(value).trim();
	const map = {
		sm: 'small',
		small: 'small',
		base: 'base',
		normal: 'base',
		md: 'medium',
		medium: 'medium',
		'medium-plus': 'medium-plus',
		lg: 'large',
		large: 'large',
		xl: 'x-large',
		'x-large': 'x-large',
		'2xl': 'xx-large',
		'xx-large': 'xx-large',
	};
	if (map[str.toLowerCase()]) {
		return map[str.toLowerCase()];
	}
	if (/^\d+(\.\d+)?$/.test(str)) {
		return `${str}px`;
	}
	return str;
}

function isPresetFontSize(value, themeFontSizes = []) {
	if (!value) {
		return false;
	}
	const str = String(value).trim().toLowerCase();
	if (/^[\d.]+(?:px|rem|em|vw|vh|%)?$/i.test(str)) {
		return false;
	}
	const presets = new Set([
		'small',
		'base',
		'medium',
		'medium-plus',
		'large',
		'x-large',
		'xx-large',
	]);
	return (
		presets.has(str) ||
		themeFontSizes.some((f) => f.slug?.toLowerCase() === str)
	);
}

/*
 * ---- Main edit component ----
 */

export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		layoutMode = 'vertical',
		tabListGap,
		tabGap,
		indicatorColor = '',
		enableAnimation = false,
		animationStyle = 'sequential',
		scrollAnimationStyle = 'sequential',
		tabTitleFontSize = 'small',
		tabSubLabelFontSize = '13px',
		tabTitleColor = '',
		tabSubLabelColor = '',
		tabSubLabelOpacity = 1,
	} = attributes;

	const [activeTab, setActiveTab] = useState(0);
	const [animKey, setAnimKey] = useState(0);
	const triggerEditorPreview = () => setAnimKey((k) => k + 1);
	const contentRef = useRef(null);

	const isHorizontal = layoutMode === 'horizontal';

	const themeColors = useSelect((select) => {
		try {
			const settings = select('core/block-editor').getSettings?.() ?? {};
			if (Array.isArray(settings.colors) && settings.colors.length) {
				return settings.colors;
			}
			if (
				Array.isArray(settings.color?.palette) &&
				settings.color.palette.length
			) {
				return settings.color.palette;
			}
		} catch {
			// ignore
		}
		return [];
	}, []);

	const themeFontSizes = useSelect((select) => {
		try {
			const settings = select('core/block-editor').getSettings?.() ?? {};
			if (
				Array.isArray(settings.fontSizes) &&
				settings.fontSizes.length
			) {
				return settings.fontSizes;
			}
		} catch {
			// ignore
		}
		return [];
	}, []);

	const resolveColorValue = (val) => {
		if (!val) {
			return '';
		}
		const trimmed = val.trim();
		const match = themeColors.find((c) => c.slug === trimmed);
		return match ? match.color : trimmed;
	};

	const normalizeColorAttr = (val) => {
		if (!val) {
			return '';
		}
		const trimmed = val.trim().toLowerCase();
		const match = themeColors.find(
			(c) =>
				c.color?.toLowerCase() === trimmed ||
				c.slug?.toLowerCase() === trimmed
		);
		return match ? match.slug : val;
	};

	const blockStyles = {};
	if (indicatorColor) {
		const isCustom =
			/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(indicatorColor) ||
			indicatorColor.startsWith('rgb') ||
			indicatorColor.startsWith('hsl') ||
			indicatorColor.startsWith('var(');
		blockStyles['--beplus-vmn-tab-indicator-color'] = isCustom
			? indicatorColor
			: `var(--wp--preset--color--${indicatorColor})`;
	}
	if (tabTitleColor) {
		const isCustom =
			/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(tabTitleColor) ||
			tabTitleColor.startsWith('rgb') ||
			tabTitleColor.startsWith('hsl') ||
			tabTitleColor.startsWith('var(');
		blockStyles['--beplus-vmn-tab-text-color'] = isCustom
			? tabTitleColor
			: `var(--wp--preset--color--${tabTitleColor})`;
	}
	if (tabSubLabelColor) {
		const isCustom =
			/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
				tabSubLabelColor
			) ||
			tabSubLabelColor.startsWith('rgb') ||
			tabSubLabelColor.startsWith('hsl') ||
			tabSubLabelColor.startsWith('var(');
		blockStyles['--beplus-vmn-tab-sublabel-color'] = isCustom
			? tabSubLabelColor
			: `var(--wp--preset--color--${tabSubLabelColor})`;
	}
	if (tabTitleFontSize) {
		if (/^\d+(\.\d+)?(px|rem|em|%)?$/.test(tabTitleFontSize)) {
			blockStyles['--beplus-vmn-tab-btn-font-size'] = /^\d+$/.test(
				tabTitleFontSize
			)
				? `${tabTitleFontSize}px`
				: tabTitleFontSize;
		} else {
			blockStyles['--beplus-vmn-tab-btn-font-size'] =
				`var(--wp--preset--font-size--${tabTitleFontSize})`;
		}
	}
	if (tabSubLabelFontSize) {
		if (/^\d+(\.\d+)?(px|rem|em|%)?$/.test(tabSubLabelFontSize)) {
			blockStyles['--beplus-vmn-tab-sublabel-font-size'] = /^\d+$/.test(
				tabSubLabelFontSize
			)
				? `${tabSubLabelFontSize}px`
				: tabSubLabelFontSize;
		} else {
			blockStyles['--beplus-vmn-tab-sublabel-font-size'] =
				`var(--wp--preset--font-size--${tabSubLabelFontSize})`;
		}
	}
	if (typeof tabSubLabelOpacity === 'number') {
		blockStyles['--beplus-vmn-tab-sublabel-opacity'] = tabSubLabelOpacity;
	}
	if (typeof tabListGap === 'number') {
		blockStyles['--beplus-vmn-tab-list-gap'] = `${tabListGap}px`;
	}
	if (typeof tabGap === 'number') {
		blockStyles['--beplus-vmn-tab-gap'] = `${tabGap}px`;
	}

	const blockProps = useBlockProps({
		className: [
			'beplus-vmn-tab-container',
			'beplus-vmn-tab-container--' + layoutMode,
			enableAnimation
				? `beplus-vmn-tab-container--animation-${animationStyle || scrollAnimationStyle || 'sequential'}`
				: '',
		]
			.filter(Boolean)
			.join(' '),
		style: Object.keys(blockStyles).length ? blockStyles : undefined,
	});

	const innerBlocks = useSelect(
		(select) => select('core/block-editor').getBlocks(clientId),
		[clientId]
	);

	const { moveBlockToPosition } = useDispatch('core/block-editor');

	const tabPanels = innerBlocks.filter(
		(block) => block.name === 'beplus-visual-mega-nav/tab-panel'
	);

	// Reset active tab index when panels are removed.
	useEffect(() => {
		if (tabPanels.length === 0) {
			setActiveTab(0);
		} else if (activeTab >= tabPanels.length) {
			setActiveTab(Math.max(0, tabPanels.length - 1));
		}
	}, [tabPanels.length, activeTab]);

	// Show only the active panel via the hidden attribute.
	useLayoutEffect(() => {
		if (!contentRef.current) return;

		const panels = contentRef.current.querySelectorAll(
			'.wp-block-beplus-visual-mega-nav-tab-panel, ' +
				'[data-type="beplus-visual-mega-nav/tab-panel"]'
		);

		panels.forEach((panel, i) => {
			if (i === activeTab) {
				panel.removeAttribute('hidden');
			} else {
				panel.setAttribute('hidden', '');
			}
		});
	}, [activeTab, tabPanels.length]);

	const handleTabClick = useCallback((index) => {
		setActiveTab(index);
	}, []);

	// ---- Move up / down handlers ----

	const handleMoveUp = useCallback(
		(e, index) => {
			e.stopPropagation();
			if (index <= 0) return;
			const block = tabPanels[index];
			if (!block) return;
			moveBlockToPosition(block.clientId, clientId, clientId, index - 1);
		},
		[tabPanels, clientId, moveBlockToPosition]
	);

	const handleMoveDown = useCallback(
		(e, index) => {
			e.stopPropagation();
			if (index >= tabPanels.length - 1) return;
			const block = tabPanels[index];
			if (!block) return;
			moveBlockToPosition(block.clientId, clientId, clientId, index + 1);
		},
		[tabPanels, clientId, moveBlockToPosition]
	);

	const renderTabs = () => {
		if (tabPanels.length === 0) {
			return (
				<div className="beplus-vmn-tab-container__placeholder-tabs">
					<span className="beplus-vmn-tab-container__tab is-placeholder">
						{__('Tab 1', 'beplus-visual-mega-nav')}
					</span>
					<span className="beplus-vmn-tab-container__tab is-placeholder">
						{__('Tab 2', 'beplus-visual-mega-nav')}
					</span>
					<span className="beplus-vmn-tab-container__tab is-placeholder">
						{__('Tab 3', 'beplus-visual-mega-nav')}
					</span>
				</div>
			);
		}

		return tabPanels.map((panel, i) => {
			const label =
				panel.attributes?.tabLabel ||
				__('Untitled', 'beplus-visual-mega-nav');
			const hasExtra =
				panel?.attributes?.tabSubLabel || panel?.attributes?.tabIcon;
			const isActive = i === activeTab;

			const tabClasses = [
				'beplus-vmn-tab-container__tab',
				isActive ? 'is-active' : '',
			]
				.filter(Boolean)
				.join(' ');

			const renderTabContent = () => {
				if (!hasExtra) {
					return label;
				}

				const icon = panel?.attributes?.tabIcon || '';
				const iconColor = panel?.attributes?.tabIconColor || '';
				const sublabel = panel?.attributes?.tabSubLabel || '';

				let iconStyle;
				if (icon && iconColor) {
					const resolved = /^[a-z0-9-]+$/.test(iconColor)
						? `var(--wp--preset--color--${iconColor})`
						: iconColor;
					iconStyle = {
						'--beplus-vmn-tab-icon-color': resolved,
					};
				}

				return (
					<span className="beplus-vmn-tab-container__tab-inner">
						{icon && (
							<span
								className="beplus-vmn-tab-container__tab-icon beplus-vmn-tab-container__tab-icon--stacked"
								aria-hidden="true"
								style={iconStyle}
							>
								<TabIconPreview name={icon} />
							</span>
						)}
						<span className="beplus-vmn-tab-container__tab-text">
							<span className="beplus-vmn-tab-container__tab-label">
								{label}
							</span>
							{sublabel && (
								<span className="beplus-vmn-tab-container__tab-sublabel">
									{sublabel}
								</span>
							)}
						</span>
					</span>
				);
			};

			const isFirst = i === 0;
			const isLast = i === tabPanels.length - 1;
			const iconColor = panel?.attributes?.tabIconColor || '';
			let tabColor;
			if (iconColor) {
				tabColor = /^[a-z0-9-]+$/.test(iconColor)
					? `var(--wp--preset--color--${iconColor})`
					: iconColor;
			}

			return (
				<div
					key={panel.clientId}
					className="beplus-vmn-tab-container__tab-row"
				>
					<button
						type="button"
						className={tabClasses}
						onClick={() => handleTabClick(i)}
						style={
							tabColor
								? { '--beplus-vmn-tab-color': tabColor }
								: undefined
						}
					>
						{renderTabContent()}
					</button>
					{tabPanels.length > 1 && (
						<div className="beplus-vmn-tab-container__tab-move">
							<button
								type="button"
								className="beplus-vmn-tab-container__tab-move-btn"
								onClick={(e) => handleMoveUp(e, i)}
								disabled={isFirst}
								aria-label={__(
									'Move up',
									'beplus-visual-mega-nav'
								)}
								title={__('Move up', 'beplus-visual-mega-nav')}
							>
								<ChevronUpIcon />
							</button>
							<button
								type="button"
								className="beplus-vmn-tab-container__tab-move-btn"
								onClick={(e) => handleMoveDown(e, i)}
								disabled={isLast}
								aria-label={__(
									'Move down',
									'beplus-visual-mega-nav'
								)}
								title={__(
									'Move down',
									'beplus-visual-mega-nav'
								)}
							>
								<ChevronDownIcon />
							</button>
						</div>
					)}
				</div>
			);
		});
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Layout & Spacing', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<SelectControl
						label={__('Navigation mode', 'beplus-visual-mega-nav')}
						value={layoutMode}
						options={[
							{
								label: __(
									'Vertical \u2014 sidebar on the left',
									'beplus-visual-mega-nav'
								),
								value: 'vertical',
							},
							{
								label: __(
									'Horizontal \u2014 tabs across the top',
									'beplus-visual-mega-nav'
								),
								value: 'horizontal',
							},
						]}
						onChange={(value) =>
							setAttributes({ layoutMode: value })
						}
					/>

					<RangeControl
						label={__(
							'Tab Items Gap (px)',
							'beplus-visual-mega-nav'
						)}
						value={typeof tabListGap === 'number' ? tabListGap : 14}
						onChange={(val) => setAttributes({ tabListGap: val })}
						min={0}
						max={60}
						step={1}
						help={__(
							'Spacing between tab items.',
							'beplus-visual-mega-nav'
						)}
					/>

					<RangeControl
						label={__(
							'Tabs & Content Gap (px)',
							'beplus-visual-mega-nav'
						)}
						value={typeof tabGap === 'number' ? tabGap : 32}
						onChange={(val) => setAttributes({ tabGap: val })}
						min={0}
						max={100}
						step={2}
						help={__(
							'Spacing between tab navigation and panel content.',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelBody>

				<PanelBody
					title={__('Typography', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<BaseControl
						label={__(
							'Tab title font size',
							'beplus-visual-mega-nav'
						)}
						id="beplus-vmn-tab-title-font-size"
						help={__(
							'Default: small (14px).',
							'beplus-visual-mega-nav'
						)}
					>
						<FontSizePicker
							fontSizes={themeFontSizes}
							value={tabTitleFontSize || undefined}
							valueMode={
								isPresetFontSize(
									tabTitleFontSize,
									themeFontSizes
								)
									? 'slug'
									: 'literal'
							}
							onChange={(value, selectedItem) =>
								setAttributes({
									tabTitleFontSize:
										normalizeFontSizeAttribute(
											value,
											selectedItem
										),
								})
							}
						/>
					</BaseControl>

					<BaseControl
						label={__(
							'Tab subtitle font size',
							'beplus-visual-mega-nav'
						)}
						id="beplus-vmn-tab-sublabel-font-size"
						help={__('Default: 13px.', 'beplus-visual-mega-nav')}
					>
						<FontSizePicker
							fontSizes={themeFontSizes}
							value={tabSubLabelFontSize || undefined}
							valueMode={
								isPresetFontSize(
									tabSubLabelFontSize,
									themeFontSizes
								)
									? 'slug'
									: 'literal'
							}
							onChange={(value, selectedItem) =>
								setAttributes({
									tabSubLabelFontSize:
										normalizeFontSizeAttribute(
											value,
											selectedItem
										),
								})
							}
						/>
					</BaseControl>
				</PanelBody>

				<PanelColorSettings
					title={__('Color Settings', 'beplus-visual-mega-nav')}
					initialOpen={false}
					colorSettings={[
						{
							value: resolveColorValue(tabTitleColor),
							onChange: (val) =>
								setAttributes({
									tabTitleColor: normalizeColorAttr(val),
								}),
							label: __(
								'Tab title color',
								'beplus-visual-mega-nav'
							),
						},
						{
							value: resolveColorValue(tabSubLabelColor),
							onChange: (val) =>
								setAttributes({
									tabSubLabelColor: normalizeColorAttr(val),
								}),
							label: __(
								'Tab subtitle color',
								'beplus-visual-mega-nav'
							),
						},
						{
							value: resolveColorValue(indicatorColor),
							onChange: (val) =>
								setAttributes({
									indicatorColor: normalizeColorAttr(val),
								}),
							label: __(
								'Indicator accent',
								'beplus-visual-mega-nav'
							),
						},
					]}
				>
					<RangeControl
						label={__(
							'Tab subtitle opacity',
							'beplus-visual-mega-nav'
						)}
						value={
							typeof tabSubLabelOpacity === 'number'
								? tabSubLabelOpacity
								: 1
						}
						onChange={(val) =>
							setAttributes({
								tabSubLabelOpacity:
									typeof val === 'number' ? val : 1,
							})
						}
						min={0}
						max={1}
						step={0.05}
						help={__(
							'Default: 1 (100% true color, no washing out).',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelColorSettings>

				<PanelBody
					title={__('Animation', 'beplus-visual-mega-nav')}
					initialOpen={Boolean(enableAnimation)}
				>
					<ToggleControl
						label={__(
							'Enable Sequential Animation',
							'beplus-visual-mega-nav'
						)}
						help={__(
							'Sequential: tabs appear one by one with a gentle upward motion.',
							'beplus-visual-mega-nav'
						)}
						checked={Boolean(enableAnimation)}
						onChange={(val) => {
							setAttributes({ enableAnimation: val });
							if (val) {
								triggerEditorPreview();
							}
						}}
					/>

					{enableAnimation && (
						<>
							<SelectControl
								label={__(
									'Animation Style',
									'beplus-visual-mega-nav'
								)}
								value={
									animationStyle ||
									scrollAnimationStyle ||
									'sequential'
								}
								options={[
									{
										label: __(
											'Sequential (Tabs appear one by one)',
											'beplus-visual-mega-nav'
										),
										value: 'sequential',
									},
									{
										label: __(
											'Fade Up (All tabs together)',
											'beplus-visual-mega-nav'
										),
										value: 'default',
									},
								]}
								onChange={(val) => {
									setAttributes({
										animationStyle: val,
										scrollAnimationStyle: val,
									});
									triggerEditorPreview();
								}}
								help={__(
									'Default: all tab buttons fade up together. Sequential: tab buttons appear one by one with a gentle upward motion.',
									'beplus-visual-mega-nav'
								)}
							/>

							<Button
								variant="secondary"
								onClick={triggerEditorPreview}
								style={{
									width: '100%',
									justifyContent: 'center',
									marginTop: '8px',
								}}
							>
								{__(
									'▶ Replay Animation',
									'beplus-visual-mega-nav'
								)}
							</Button>
						</>
					)}
				</PanelBody>
			</InspectorControls>

			<div {...blockProps} key={animKey}>
				{isHorizontal ? (
					<div className="beplus-vmn-tab-container__tablist">
						<span
							className="beplus-vmn-tab-container__indicator"
							aria-hidden="true"
						/>
						{renderTabs()}
					</div>
				) : (
					<div className="beplus-vmn-tab-container__sidebar">
						<div className="beplus-vmn-tab-container__tablist">
							<span
								className="beplus-vmn-tab-container__indicator"
								aria-hidden="true"
							/>
							{renderTabs()}
						</div>
					</div>
				)}
				<div
					className="beplus-vmn-tab-container__content"
					ref={contentRef}
				>
					<InnerBlocks
						allowedBlocks={ALLOWED_BLOCKS}
						template={[
							[
								'beplus-visual-mega-nav/tab-panel',
								{
									tabLabel: __(
										'Tab 1',
										'beplus-visual-mega-nav'
									),
								},
							],
							[
								'beplus-visual-mega-nav/tab-panel',
								{
									tabLabel: __(
										'Tab 2',
										'beplus-visual-mega-nav'
									),
								},
							],
						]}
					/>
				</div>
			</div>
		</>
	);
}
