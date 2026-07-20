/**
 * Tab Container block — editor UI.
 *
 * Click a tab button to show only the corresponding panel content
 * (like the frontend). Layout and color settings in the inspector.
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
import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ColorPalette } from '@wordpress/components';
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
 * ---- Main edit component ----
 */

export default function Edit({ attributes, setAttributes, clientId }) {
	const { layoutMode = 'vertical', indicatorColor = '' } = attributes;

	const [activeTab, setActiveTab] = useState(0);
	const contentRef = useRef(null);

	const isHorizontal = layoutMode === 'horizontal';
	const blockProps = useBlockProps({
		className:
			'beplus-vmn-tab-container beplus-vmn-tab-container--' + layoutMode,
		style: indicatorColor
			? {
					'--beplus-vmn-tab-text-color': indicatorColor,
					'--beplus-vmn-tab-indicator-color': indicatorColor,
				}
			: undefined,
	});

	const innerBlocks = useSelect(
		(select) => select('core/block-editor').getBlocks(clientId),
		[clientId]
	);

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

			if (!hasExtra) {
				return (
					<button
						key={panel.clientId}
						type="button"
						className={`beplus-vmn-tab-container__tab${
							isActive ? ' is-active' : ''
						}`}
						onClick={() => handleTabClick(i)}
					>
						{label}
					</button>
				);
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
				<button
					key={panel.clientId}
					type="button"
					className={`beplus-vmn-tab-container__tab${
						isActive ? ' is-active' : ''
					}`}
					onClick={() => handleTabClick(i)}
				>
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
				</button>
			);
		});
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Layout', 'beplus-visual-mega-nav')}
					initialOpen={false}
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
				</PanelBody>

				<PanelBody
					title={__('Color', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<ColorPalette
						label={__('Indicator accent', 'beplus-visual-mega-nav')}
						value={indicatorColor}
						onChange={(value) =>
							setAttributes({
								indicatorColor: value || '',
							})
						}
						clearable={true}
					/>
					<p className="components-base-control__help">
						{__(
							'Color of the sliding edge bar. Leave empty to use the theme primary color.',
							'beplus-visual-mega-nav'
						)}
					</p>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
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
