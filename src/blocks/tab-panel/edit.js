/**
 * Tab Panel block — editor UI.
 *
 * @package
 */

import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import {
	TextControl,
	Button,
	Modal,
	ColorPalette,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ICONS_PER_PAGE = 60;

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

function IconPickerModal({ current, onSelect, onClose }) {
	const [icons, setIcons] = useState([]);
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		loadIcons()
			.then((data) => {
				if (mounted) setIcons(data);
			})
			.catch(() => {})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return icons;
		return icons.filter(
			(icon) =>
				icon.name.includes(q) ||
				(icon.tags && icon.tags.some((tag) => tag.includes(q)))
		);
	}, [icons, search]);

	const visible = filtered.slice(0, page * ICONS_PER_PAGE);

	return (
		<Modal
			title={__('Choose icon', 'beplus-visual-mega-nav')}
			onRequestClose={onClose}
			size="large"
		>
			<TextControl
				label={__('Search icons', 'beplus-visual-mega-nav')}
				value={search}
				onChange={(v) => {
					setSearch(v);
					setPage(1);
				}}
				placeholder={__('Search icons\u2026', 'beplus-visual-mega-nav')}
			/>

			{loading && (
				<p>{__('Loading icons\u2026', 'beplus-visual-mega-nav')}</p>
			)}

			{!loading && icons.length === 0 && (
				<p>{__('No icons available.', 'beplus-visual-mega-nav')}</p>
			)}

			{!loading && filtered.length === 0 && icons.length > 0 && (
				<p>
					{__(
						'No icons match your search.',
						'beplus-visual-mega-nav'
					)}
				</p>
			)}

			{!loading && visible.length > 0 && (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns:
							'repeat(auto-fill, minmax(100px, 1fr))',
						gap: 6,
						maxHeight: '50vh',
						overflowY: 'auto',
						border: '1px solid #ddd',
						borderRadius: 6,
						padding: 10,
						marginTop: 8,
					}}
				>
					{visible.map((icon) => (
						<button
							key={icon.name}
							type="button"
							title={icon.name}
							aria-label={icon.name}
							onClick={() => onSelect(icon.name)}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 4,
								padding: '8px 4px',
								border:
									current === icon.name
										? '2px solid #007cba'
										: '2px solid transparent',
								borderRadius: 6,
								background:
									current === icon.name
										? '#e5f3ff'
										: 'transparent',
								cursor: 'pointer',
								fontSize: '0.6rem',
								color: '#555',
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={20}
								height={20}
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
							<span style={{ textAlign: 'center' }}>
								{icon.name}
							</span>
						</button>
					))}
				</div>
			)}

			{visible.length < filtered.length && (
				<Button
					variant="secondary"
					onClick={() => setPage((p) => p + 1)}
					style={{ marginTop: 16 }}
				>
					{__('Load more', 'beplus-visual-mega-nav')}
					{` (${String(filtered.length - visible.length)})`}
				</Button>
			)}
		</Modal>
	);
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

export default function Edit({ attributes, setAttributes }) {
	const {
		tabLabel = '',
		tabSubLabel = '',
		tabIcon = '',
		tabIconColor = '',
	} = attributes;

	const [iconPickerOpen, setIconPickerOpen] = useState(false);

	const themeColors = useSelect(
		(select) => select('core/block-editor').getSettings()?.colors || [],
		[]
	);

	const setAttr = useCallback(
		(key, value) => setAttributes({ [key]: value }),
		[setAttributes]
	);

	const handleColorChange = useCallback(
		(value) => {
			if (!value) {
				setAttr('tabIconColor', '');
				return;
			}
			const match = themeColors.find((c) => c.color === value);
			setAttr('tabIconColor', match ? match.slug : value);
		},
		[themeColors, setAttr]
	);

	const colorPickerValue = useMemo(() => {
		if (!tabIconColor) return '';
		const match = themeColors.find(
			(c) => c.slug === tabIconColor || c.color === tabIconColor
		);
		return match ? match.color : tabIconColor;
	}, [tabIconColor, themeColors]);

	const blockProps = useBlockProps({
		className: 'beplus-vmn-tab-panel',
	});

	return (
		<div {...blockProps}>
			<div className="beplus-vmn-tab-panel__header">
				<TextControl
					label={__('Tab Label', 'beplus-visual-mega-nav')}
					value={tabLabel}
					onChange={(value) => setAttr('tabLabel', value || '')}
					placeholder={__('e.g. Overview', 'beplus-visual-mega-nav')}
					__nextHasNoMarginBottom
				/>
				<TextControl
					label={__('Tab Sub-label', 'beplus-visual-mega-nav')}
					value={tabSubLabel}
					onChange={(value) => setAttr('tabSubLabel', value || '')}
					placeholder={__(
						'Smaller text below label',
						'beplus-visual-mega-nav'
					)}
					__nextHasNoMarginBottom
				/>
				<div style={{ marginTop: 12 }}>
					<div
						style={{
							display: 'flex',
							gap: 12,
							alignItems: 'flex-start',
						}}
					>
						<div style={{ flexShrink: 0 }}>
							<Button
								variant="secondary"
								onClick={() => setIconPickerOpen(true)}
							>
								{tabIcon
									? __(
											'Change icon',
											'beplus-visual-mega-nav'
										)
									: __(
											'Choose icon',
											'beplus-visual-mega-nav'
										)}
							</Button>
							{tabIcon && (
								<Button
									variant="link"
									isDestructive
									onClick={() => setAttr('tabIcon', '')}
									style={{ marginLeft: 8 }}
								>
									{__('Remove', 'beplus-visual-mega-nav')}
								</Button>
							)}
						</div>
						{tabIcon && (
							<div style={{ flex: 1, minWidth: 0 }}>
								<ColorPalette
									colors={themeColors}
									value={colorPickerValue}
									onChange={handleColorChange}
									clearable={true}
								/>
							</div>
						)}
					</div>
					{iconPickerOpen && (
						<IconPickerModal
							current={tabIcon || ''}
							onSelect={(name) => {
								setAttr('tabIcon', name);
								setIconPickerOpen(false);
							}}
							onClose={() => setIconPickerOpen(false)}
						/>
					)}
				</div>
			</div>
			<div className="beplus-vmn-tab-panel__content">
				<InnerBlocks
					allowedBlocks={true}
					template={[
						[
							'core/heading',
							{
								level: 3,
								placeholder: __(
									'Tab heading',
									'beplus-visual-mega-nav'
								),
							},
						],
					]}
					templateLock={false}
				/>
			</div>
		</div>
	);
}
