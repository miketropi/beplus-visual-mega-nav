/**
 * Hero Artwork Dock block — editor UI.
 *
 * @package
 */

import { useState, useCallback, useMemo } from '@wordpress/element';
import {
	InspectorControls,
	InnerBlocks,
	useBlockProps,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	RangeControl,
	Button,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	Flex,
	FlexItem,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Generate a unique card ID.
 *
 * @return {string} Unique ID.
 */
function generateCardId() {
	return 'card-' + Math.random().toString(36).slice(2, 9);
}

const DEFAULT_CARD = {
	id: '',
	imageId: 0,
	imageUrl: '',
	width: 200,
	rotation: 0,
	depth: 0,
	layerOrder: 0,
};

export default function Edit({ attributes, setAttributes, isSelected }) {
	const {
		enabled = true,
		artworkHeight = 300,
		visiblePercentage = 50,
		overlap = 30,
		hoverMotion = true,
		floatingAnimation = true,
		perspectiveStrength = 800,
		cards = [],
	} = attributes;

	const [selectedCardIndex, setSelectedCardIndex] = useState(0);

	const blockProps = useBlockProps({
		className: 'beplus-hero-' + (attributes.instanceId || 'editor'),
	});

	const setAttr = useCallback(
		(key, value) => setAttributes({ [key]: value }),
		[setAttributes]
	);

	// Card operations.
	const updateCard = useCallback(
		(index, updates) => {
			const next = cards.map((card, i) =>
				i === index ? { ...card, ...updates } : card
			);
			setAttributes({ cards: next });
		},
		[cards, setAttributes]
	);

	const addCard = useCallback(() => {
		const newCard = {
			...DEFAULT_CARD,
			id: generateCardId(),
			layerOrder: cards.length,
		};
		setAttributes({ cards: [...cards, newCard] });
		setSelectedCardIndex(cards.length);
	}, [cards, setAttributes]);

	const removeCard = useCallback(
		(index) => {
			const next = cards.filter((_, i) => i !== index);
			setAttributes({ cards: next });
			setSelectedCardIndex(Math.max(0, Math.min(index, next.length - 1)));
		},
		[cards, setAttributes]
	);

	// Safely clamp selected card index.
	const safeIndex = Math.min(selectedCardIndex, Math.max(0, cards.length - 1));
	const selectedCard = cards[safeIndex] || DEFAULT_CARD;

	// Build artwork preview styles matching frontend render.
	const artworkStyle = {
		'--beplus-hero-artwork-height': artworkHeight + 'px',
		'--beplus-hero-visible-pct': String(visiblePercentage),
		'--beplus-hero-perspective': perspectiveStrength + 'px',
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: artworkHeight + 'px',
		overflow: 'hidden',
		pointerEvents: 'none',
		perspective: perspectiveStrength + 'px',
	};

	// Render card previews.
	const renderCards = useMemo(() => {
		if (!enabled || !cards.length) {
			return null;
		}

		const count = cards.length;
		const midIdx = Math.floor(count / 2);
		const spacing = 13;

		return cards.map((card, i) => {
			const width = Math.max(120, Math.min(400, card.width || 200));
			const rotation = Math.max(-15, Math.min(15, card.rotation || 0));
			const depth = card.depth || 0;
			const imageUrl = card.imageUrl || '';

			const distCenter = i - midIdx;
			const spreadPct = 50 + distCenter * spacing;
			const isCenter = distCenter === 0;

			const cardZIndex = midIdx + 1 - Math.abs(distCenter);

			const clipOffset =
				artworkHeight * ((100 - visiblePercentage) / 100);
			const bottomOff = isCenter ? clipOffset + 15 : clipOffset;
			const depthShift = depth * 5;

			const cardHeight = isCenter
				? artworkHeight + 90
				: artworkHeight + 60;

			const cardStyle = {
				position: 'absolute',
				width: width + 'px',
				height: cardHeight + 'px',
				bottom: -bottomOff + 'px',
				marginBottom: depthShift + 'px',
				left: spreadPct + '%',
				zIndex: cardZIndex,
				transform: 'rotate(' + rotation + 'deg) translateY(0px)',
				borderRadius: '12px',
				boxShadow:
					'0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				transition: 'transform 0.1s ease-out',
			};

			const gradColors = [
			'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 40%, #93c5fd 100%)',
			'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 40%, #c4b5fd 100%)',
			'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 40%, #f9a8d4 100%)',
			'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 40%, #6ee7b7 100%)',
			'linear-gradient(135deg, #ffedd5 0%, #fed7aa 40%, #fdba74 100%)',
		];

		if (imageUrl) {
			cardStyle.backgroundImage = 'url(' + imageUrl + ')';
			cardStyle.borderColor = 'transparent';
			cardStyle.backgroundColor = 'transparent';
		} else {
			cardStyle.backgroundImage = gradColors[i % gradColors.length];
			cardStyle.border = 'none';
			cardStyle.backgroundColor = 'transparent';
		}

			if (i === safeIndex && isSelected) {
				cardStyle.outline = '2px solid var(--wp-admin-theme-color, #007cba)';
				cardStyle.outlineOffset = '4px';
				cardStyle.zIndex = cards.length + 10;
			}

			return (
				<div
					key={card.id || i}
					style={cardStyle}
					title={
						imageUrl
							? __('Card ', 'beplus-visual-mega-nav') +
								(i + 1)
							: __(
									'Empty card — add an image',
									'beplus-visual-mega-nav'
								)
					}
				/>
			);
		});
	}, [enabled, cards, artworkHeight, visiblePercentage, safeIndex, isSelected]);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Artwork', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<ToggleControl
						label={__('Enable Artwork', 'beplus-visual-mega-nav')}
						checked={enabled}
						onChange={(v) => setAttr('enabled', v)}
					/>
				</PanelBody>

				<PanelBody
					title={__('Cards', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					{cards.map((card, i) => (
						<div
							key={card.id || i}
							style={{
								marginBottom: 8,
								padding: 8,
								borderRadius: 4,
								border:
									i === safeIndex
										? '1px solid var(--wp-admin-theme-color, #007cba)'
										: '1px solid #ddd',
								cursor: 'pointer',
							}}
							onClick={() => setSelectedCardIndex(i)}
						>
							<Flex justify="space-between" align="center">
								<FlexItem>
									<strong>
										{__('Card', 'beplus-visual-mega-nav')}{' '}
										{i + 1}
									</strong>
								</FlexItem>
								<FlexItem>
									<Button
										isSmall
										isDestructive
										onClick={(e) => {
											e.stopPropagation();
											removeCard(i);
										}}
										disabled={cards.length <= 1}
									>
										{__('Remove', 'beplus-visual-mega-nav')}
									</Button>
								</FlexItem>
							</Flex>
							{card.imageUrl ? (
								<img
									src={card.imageUrl}
									alt=""
									style={{
										width: '100%',
										height: 60,
										objectFit: 'cover',
										borderRadius: 4,
										marginTop: 4,
									}}
								/>
							) : (
								<div
									style={{
										width: '100%',
										height: 40,
										background: '#f0f0f0',
										borderRadius: 4,
										marginTop: 4,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 11,
										color: '#999',
									}}
								>
									{__(
										'No image',
										'beplus-visual-mega-nav'
									)}
								</div>
							)}
						</div>
					))}

					<Button
						variant="secondary"
						onClick={addCard}
						style={{ width: '100%', marginTop: 4 }}
					>
						{__('Add Card', 'beplus-visual-mega-nav')}
					</Button>
				</PanelBody>

				<PanelBody
					title={__('Card Settings', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={(media) => {
								updateCard(safeIndex, {
									imageId: media.id,
									imageUrl:
										media.sizes?.large?.url ||
										media.url,
								});
							}}
							allowedTypes={['image']}
							value={selectedCard.imageId || undefined}
							render={({ open }) => (
								<Button
									variant="secondary"
									onClick={open}
									style={{ width: '100%', marginBottom: 12 }}
								>
									{selectedCard.imageId
										? __(
												'Replace Image',
												'beplus-visual-mega-nav'
											)
										: __(
												'Choose Image',
												'beplus-visual-mega-nav'
											)}
								</Button>
							)}
						/>
					</MediaUploadCheck>

					{selectedCard.imageUrl && (
						<div style={{ marginBottom: 12 }}>
							<img
								src={selectedCard.imageUrl}
								alt=""
								style={{
									width: '100%',
									height: 'auto',
									borderRadius: 4,
								}}
							/>
							<Button
								isSmall
								isDestructive
								onClick={() =>
									updateCard(safeIndex, {
										imageId: 0,
										imageUrl: '',
									})
								}
								style={{ marginTop: 4 }}
							>
								{__(
									'Remove Image',
									'beplus-visual-mega-nav'
								)}
							</Button>
						</div>
					)}

					<RangeControl
						label={__('Width (px)', 'beplus-visual-mega-nav')}
						value={selectedCard.width || 200}
						onChange={(v) => updateCard(safeIndex, { width: v })}
						min={120}
						max={400}
					/>

					<RangeControl
						label={__('Rotation', 'beplus-visual-mega-nav')}
						value={selectedCard.rotation || 0}
						onChange={(v) =>
							updateCard(safeIndex, { rotation: v })
						}
						min={-15}
						max={15}
						step={1}
						help={__(
							'Degrees of tilt (-15 to 15).',
							'beplus-visual-mega-nav'
						)}
					/>

					<RangeControl
						label={__('Depth', 'beplus-visual-mega-nav')}
						value={selectedCard.depth || 0}
						onChange={(v) =>
							updateCard(safeIndex, { depth: v })
						}
						min={0}
						max={5}
						step={1}
						help={__(
							'Controls vertical stagger and parallax intensity.',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelBody>

				<PanelBody
					title={__('Global Settings', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<RangeControl
						label={__(
							'Artwork Height (px)',
							'beplus-visual-mega-nav'
						)}
						value={artworkHeight}
						onChange={(v) => setAttr('artworkHeight', v)}
						min={150}
						max={600}
					/>

					<RangeControl
						label={__(
							'Visible Percentage',
							'beplus-visual-mega-nav'
						)}
						value={visiblePercentage}
						onChange={(v) =>
							setAttr('visiblePercentage', v)
						}
						min={30}
						max={70}
						help={__(
							'How much of the artwork layer is visible above the bottom edge.',
							'beplus-visual-mega-nav'
						)}
					/>

					<RangeControl
						label={__(
							'Perspective Strength',
							'beplus-visual-mega-nav'
						)}
						value={perspectiveStrength}
						onChange={(v) =>
							setAttr('perspectiveStrength', v)
						}
						min={400}
						max={2000}
						step={100}
						help={__(
							'CSS perspective value for 3D depth effect.',
							'beplus-visual-mega-nav'
						)}
					/>

					<ToggleControl
						label={__(
							'Hover Motion',
							'beplus-visual-mega-nav'
						)}
						checked={hoverMotion}
						onChange={(v) => setAttr('hoverMotion', v)}
						help={__(
							'Cards follow the mouse cursor with parallax.',
							'beplus-visual-mega-nav'
						)}
					/>

					<ToggleControl
						label={__(
							'Floating Animation',
							'beplus-visual-mega-nav'
						)}
						checked={floatingAnimation}
						onChange={(v) =>
							setAttr('floatingAnimation', v)
						}
						help={__(
							'Cards gently float up and down when idle.',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelBody>
			</InspectorControls>

			<section {...blockProps}>
				<div className="beplus-hero-content">
					<InnerBlocks />
				</div>

				{enabled && cards.length > 0 && (
					<div
						className="beplus-hero-artwork"
						style={artworkStyle}
					>
						{renderCards}
					</div>
				)}
			</section>
		</>
	);
}
