/**
 * Quote block — editor UI.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import {
	useBlockProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToggleControl,
	SelectControl,
	ColorPalette,
	Button,
	Modal,
	Flex,
	FlexItem,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { edit, chevronUp, chevronDown, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

const DEFAULT_QUOTE = {
	avatar: { id: 0, url: '' },
	name: '',
	position: '',
	text: '',
};

export default function Edit({ attributes, setAttributes }) {
	const {
		quotes = [],
		transitionSpeed = 400,
		autoPlay = true,
		autoPlayInterval = 5000,
		textAnimation = true,
		showArrows = true,
		showDots = true,
		quoteFontFamily = '',
		quoteTextColor = '',
		quoteTextSize = '',
	} = attributes;

	const [modalQuote, setModalQuote] = useState(null);

	const blockProps = useBlockProps();

	const setAttr = useCallback(
		(key, value) => setAttributes({ [key]: value }),
		[setAttributes]
	);

	// Quote operations — keep modal state in sync.
	const updateQuote = useCallback(
		(index, updates) => {
			const next = quotes.map((q, i) =>
				i === index ? { ...q, ...updates } : q
			);
			setAttributes({ quotes: next });
			setModalQuote((prev) =>
				prev && prev.index === index
					? { ...prev, quote: { ...prev.quote, ...updates } }
					: prev
			);
		},
		[quotes, setAttributes]
	);

	const addQuote = useCallback(() => {
		const newQuote = { ...DEFAULT_QUOTE };
		setAttributes({ quotes: [...quotes, newQuote] });
		setModalQuote({ index: quotes.length, quote: newQuote });
	}, [quotes, setAttributes]);

	const removeQuote = useCallback(
		(index) => {
			if (quotes.length <= 1) return;
			const next = quotes.filter((_, i) => i !== index);
			setAttributes({ quotes: next });
			setModalQuote(null);
		},
		[quotes, setAttributes]
	);

	const moveQuoteUp = useCallback(
		(index) => {
			if (index <= 0) return;
			const next = [...quotes];
			[next[index - 1], next[index]] = [next[index], next[index - 1]];
			setAttributes({ quotes: next });
			setModalQuote((prev) => {
				if (!prev) return prev;
				if (prev.index === index) return { ...prev, index: index - 1 };
				if (prev.index === index - 1) return { ...prev, index };
				return prev;
			});
		},
		[quotes, setAttributes]
	);

	const moveQuoteDown = useCallback(
		(index) => {
			if (index >= quotes.length - 1) return;
			const next = [...quotes];
			[next[index], next[index + 1]] = [next[index + 1], next[index]];
			setAttributes({ quotes: next });
			setModalQuote((prev) => {
				if (!prev) return prev;
				if (prev.index === index) return { ...prev, index: index + 1 };
				if (prev.index === index + 1) return { ...prev, index };
				return prev;
			});
		},
		[quotes, setAttributes]
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Quotes', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					{quotes.map((quote, i) => (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '8px 10px',
								marginBottom: 4,
								borderRadius: 4,
								background: '#f9f9f9',
								border: '1px solid #e0e0e0',
							}}
						>
							<FlexItem>
								<strong>
									{quote.name
										? quote.name
										: __(
												'Quote',
												'beplus-visual-mega-nav'
											) +
											' ' +
											(i + 1)}
								</strong>
							</FlexItem>
							<Flex gap={1}>
								<Button
									icon={chevronUp}
									label={__(
										'Move up',
										'beplus-visual-mega-nav'
									)}
									onClick={() => moveQuoteUp(i)}
									disabled={i === 0}
									isSmall
								/>
								<Button
									icon={chevronDown}
									label={__(
										'Move down',
										'beplus-visual-mega-nav'
									)}
									onClick={() => moveQuoteDown(i)}
									disabled={i === quotes.length - 1}
									isSmall
								/>
								<Button
									icon={edit}
									label={__(
										'Edit quote',
										'beplus-visual-mega-nav'
									)}
									onClick={() =>
										setModalQuote({
											index: i,
											quote: {
												...quotes[i],
											},
										})
									}
									isSmall
								/>
								<Button
									icon={trash}
									label={__(
										'Delete quote',
										'beplus-visual-mega-nav'
									)}
									onClick={() => removeQuote(i)}
									disabled={quotes.length <= 1}
									isSmall
									isDestructive
								/>
							</Flex>
						</div>
					))}

					<Button
						variant="secondary"
						onClick={addQuote}
						style={{ width: '100%', marginTop: 8 }}
					>
						{__('Add Quote', 'beplus-visual-mega-nav')}
					</Button>
				</PanelBody>

				<PanelBody
					title={__('Carousel Settings', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<RangeControl
						label={__(
							'Transition speed (ms)',
							'beplus-visual-mega-nav'
						)}
						value={transitionSpeed}
						onChange={(v) => setAttr('transitionSpeed', v)}
						min={100}
						max={2000}
						step={100}
					/>

					<ToggleControl
						label={__('Auto-play', 'beplus-visual-mega-nav')}
						checked={autoPlay}
						onChange={(v) => setAttr('autoPlay', v)}
					/>

					{autoPlay && (
						<RangeControl
							label={__(
								'Auto-play interval (ms)',
								'beplus-visual-mega-nav'
							)}
							value={autoPlayInterval}
							onChange={(v) => setAttr('autoPlayInterval', v)}
							min={1000}
							max={30000}
							step={500}
						/>
					)}

					<ToggleControl
						label={__(
							'Word-by-word animation',
							'beplus-visual-mega-nav'
						)}
						checked={textAnimation}
						onChange={(v) => setAttr('textAnimation', v)}
					/>

					<ToggleControl
						label={__('Show arrows', 'beplus-visual-mega-nav')}
						checked={showArrows}
						onChange={(v) => setAttr('showArrows', v)}
					/>

					<ToggleControl
						label={__('Show dots', 'beplus-visual-mega-nav')}
						checked={showDots}
						onChange={(v) => setAttr('showDots', v)}
					/>

					<SelectControl
						label={__('Quote Font', 'beplus-visual-mega-nav')}
						value={quoteFontFamily}
						options={[
							{
								label: __(
									'Theme Default',
									'beplus-visual-mega-nav'
								),
								value: '',
							},
							{
								label: __(
									'Cedarville Cursive',
									'beplus-visual-mega-nav'
								),
								value: 'Cedarville Cursive',
							},
							{
								label: __(
									'Shadows Into Light Two',
									'beplus-visual-mega-nav'
								),
								value: 'Shadows Into Light Two',
							},
						]}
						onChange={(v) => setAttr('quoteFontFamily', v)}
					/>

					<ColorPalette
						label={__('Quote text color', 'beplus-visual-mega-nav')}
						value={quoteTextColor || undefined}
						onChange={(v) => setAttr('quoteTextColor', v || '')}
						clearable={true}
					/>

					<SelectControl
						label={__('Quote text size', 'beplus-visual-mega-nav')}
						value={quoteTextSize}
						options={[
							{
								label: __('Default', 'beplus-visual-mega-nav'),
								value: '',
							},
							{
								label: __('Small', 'beplus-visual-mega-nav'),
								value: 'small',
							},
							{
								label: __('Medium', 'beplus-visual-mega-nav'),
								value: 'medium',
							},
							{
								label: __('Large', 'beplus-visual-mega-nav'),
								value: 'large',
							},
							{
								label: __(
									'Extra Large',
									'beplus-visual-mega-nav'
								),
								value: 'xlarge',
							},
						]}
						onChange={(v) => setAttr('quoteTextSize', v)}
					/>
				</PanelBody>
			</InspectorControls>

			{/* Quote Edit Modal */}
			{modalQuote !== null && (
				<Modal
					title={
						__('Edit Quote', 'beplus-visual-mega-nav') +
						' ' +
						(modalQuote.index + 1)
					}
					onRequestClose={() => setModalQuote(null)}
					size="medium"
				>
					{/* Avatar */}
					<div
						style={{
							marginBottom: 24,
							display: 'flex',
							alignItems: 'center',
							gap: 12,
						}}
					>
						{modalQuote.quote.avatar?.url ? (
							<img
								src={modalQuote.quote.avatar.url}
								alt=""
								style={{
									width: 56,
									height: 56,
									borderRadius: '50%',
									objectFit: 'cover',
								}}
							/>
						) : (
							<div
								style={{
									width: 56,
									height: 56,
									borderRadius: '50%',
									background: '#f0f0f0',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 24,
									color: '#bbb',
								}}
							>
								?
							</div>
						)}
						<div>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={(media) =>
										updateQuote(modalQuote.index, {
											avatar: {
												id: media.id,
												url:
													media.sizes?.thumbnail
														?.url || media.url,
											},
										})
									}
									allowedTypes={['image']}
									render={({ open }) => (
										<Button
											variant="secondary"
											onClick={open}
										>
											{modalQuote.quote.avatar?.url
												? __(
														'Replace Image',
														'beplus-visual-mega-nav'
													)
												: __(
														'Choose Avatar',
														'beplus-visual-mega-nav'
													)}
										</Button>
									)}
								/>
							</MediaUploadCheck>
							{modalQuote.quote.avatar?.url && (
								<Button
									isDestructive
									variant="tertiary"
									onClick={() =>
										updateQuote(modalQuote.index, {
											avatar: {
												id: 0,
												url: '',
											},
										})
									}
									style={{ marginLeft: 8 }}
								>
									{__('Remove', 'beplus-visual-mega-nav')}
								</Button>
							)}
						</div>
					</div>

					<TextControl
						label={__('Name', 'beplus-visual-mega-nav')}
						value={modalQuote.quote.name || ''}
						onChange={(v) =>
							updateQuote(modalQuote.index, {
								name: v,
							})
						}
						placeholder={__('John Doe', 'beplus-visual-mega-nav')}
					/>

					<TextControl
						label={__('Position', 'beplus-visual-mega-nav')}
						value={modalQuote.quote.position || ''}
						onChange={(v) =>
							updateQuote(modalQuote.index, {
								position: v,
							})
						}
						placeholder={__('CEO', 'beplus-visual-mega-nav')}
					/>

					<TextareaControl
						label={__('Quote text', 'beplus-visual-mega-nav')}
						value={modalQuote.quote.text || ''}
						onChange={(v) =>
							updateQuote(modalQuote.index, {
								text: v,
							})
						}
						rows={4}
						placeholder={__(
							'This product changed the way we work…',
							'beplus-visual-mega-nav'
						)}
						style={{ resize: 'vertical' }}
					/>

					<div
						style={{
							marginTop: 24,
							paddingTop: 16,
							borderTop: '1px solid #e0e0e0',
						}}
					>
						<Button
							variant="primary"
							onClick={() => setModalQuote(null)}
						>
							{__('Done', 'beplus-visual-mega-nav')}
						</Button>
					</div>
				</Modal>
			)}

			<div {...blockProps}>
				<ServerSideRender
					key={'quote-' + quotes.length}
					block="beplus-visual-mega-nav/quote"
					attributes={attributes}
				/>
			</div>
		</>
	);
}
