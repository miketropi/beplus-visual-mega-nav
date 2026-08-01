/**
 * Product List block — editor UI.
 *
 * @package
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToggleControl,
	SelectControl,
	TextControl,
	FormTokenField,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

export default function Edit({ attributes, setAttributes }) {
	const {
		postsToShow = 4,
		orderBy = 'date',
		order = 'DESC',
		filterBy = 'all',
		productCategories = [],
		productTags = [],
		productIds = '',
		showImage = true,
		showPrice = true,
		showRating = false,
		showAddToCart = false,
	} = attributes;

	const blockProps = useBlockProps();

	const setAttr = (key, value) => setAttributes({ [key]: value });

	// Fetch product categories for the token field.
	const categoryOptions = useSelect((select) => {
		const { getEntityRecords } = select('core');
		const terms = getEntityRecords('taxonomy', 'product_cat', {
			per_page: 100,
			hide_empty: false,
		});
		if (!terms) {
			return [];
		}
		return terms.map((term) => ({
			value: term.id,
			title: term.name,
		}));
	}, []);

	// Fetch product tags for the token field.
	const tagOptions = useSelect((select) => {
		const { getEntityRecords } = select('core');
		const terms = getEntityRecords('taxonomy', 'product_tag', {
			per_page: 100,
			hide_empty: false,
		});
		if (!terms) {
			return [];
		}
		return terms.map((term) => ({
			value: term.id,
			title: term.name,
		}));
	}, []);

	// Map selected category IDs to token-field display values.
	const selectedCategories = productCategories
		.map((id) => {
			const match = categoryOptions.find((opt) => opt.value === id);
			return match ? match.title : null;
		})
		.filter(Boolean);

	const categorySuggestions = categoryOptions
		.map((opt) => opt.title)
		.filter((title) => !selectedCategories.includes(title));

	// Map selected tag IDs to token-field display values.
	const selectedTags = productTags
		.map((id) => {
			const match = tagOptions.find((opt) => opt.value === id);
			return match ? match.title : null;
		})
		.filter(Boolean);

	const tagSuggestions = tagOptions
		.map((opt) => opt.title)
		.filter((title) => !selectedTags.includes(title));

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Settings', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<RangeControl
						label={__(
							'Number of products',
							'beplus-visual-mega-nav'
						)}
						value={postsToShow}
						onChange={(v) => setAttr('postsToShow', v)}
						min={1}
						max={12}
					/>

					<SelectControl
						label={__('Filter by', 'beplus-visual-mega-nav')}
						value={filterBy}
						options={[
							{
								label: __(
									'All products',
									'beplus-visual-mega-nav'
								),
								value: 'all',
							},
							{
								label: __('Category', 'beplus-visual-mega-nav'),
								value: 'category',
							},
							{
								label: __('Tag', 'beplus-visual-mega-nav'),
								value: 'tag',
							},
							{
								label: __(
									'Product IDs',
									'beplus-visual-mega-nav'
								),
								value: 'ids',
							},
							{
								label: __('Featured', 'beplus-visual-mega-nav'),
								value: 'featured',
							},
							{
								label: __('On Sale', 'beplus-visual-mega-nav'),
								value: 'onsale',
							},
						]}
						onChange={(v) => setAttr('filterBy', v)}
					/>

					{filterBy === 'category' && (
						<FormTokenField
							value={selectedCategories}
							suggestions={categorySuggestions}
							onChange={(tokens) => {
								const ids = tokens
									.map((token) => {
										const match = categoryOptions.find(
											(opt) => opt.title === token
										);
										return match ? match.value : null;
									})
									.filter(Boolean);
								setAttr('productCategories', ids);
							}}
							label={__(
								'Product categories',
								'beplus-visual-mega-nav'
							)}
							help={__(
								'Leave empty to show products from all categories.',
								'beplus-visual-mega-nav'
							)}
						/>
					)}

					{filterBy === 'tag' && (
						<FormTokenField
							value={selectedTags}
							suggestions={tagSuggestions}
							onChange={(tokens) => {
								const ids = tokens
									.map((token) => {
										const match = tagOptions.find(
											(opt) => opt.title === token
										);
										return match ? match.value : null;
									})
									.filter(Boolean);
								setAttr('productTags', ids);
							}}
							label={__('Product tags', 'beplus-visual-mega-nav')}
							help={__(
								'Leave empty to show products with any tag.',
								'beplus-visual-mega-nav'
							)}
						/>
					)}

					{filterBy === 'ids' && (
						<TextControl
							label={__('Product IDs', 'beplus-visual-mega-nav')}
							value={productIds}
							onChange={(v) => setAttr('productIds', v)}
							help={__(
								'Comma-separated list of product IDs.',
								'beplus-visual-mega-nav'
							)}
						/>
					)}

					<SelectControl
						label={__('Order by', 'beplus-visual-mega-nav')}
						value={orderBy}
						options={[
							{
								label: __('Date', 'beplus-visual-mega-nav'),
								value: 'date',
							},
							{
								label: __('Title', 'beplus-visual-mega-nav'),
								value: 'title',
							},
							{
								label: __('Price', 'beplus-visual-mega-nav'),
								value: 'price',
							},
							{
								label: __(
									'Popularity',
									'beplus-visual-mega-nav'
								),
								value: 'popularity',
							},
							{
								label: __('Rating', 'beplus-visual-mega-nav'),
								value: 'rating',
							},
							{
								label: __('Random', 'beplus-visual-mega-nav'),
								value: 'rand',
							},
						]}
						onChange={(v) => setAttr('orderBy', v)}
					/>

					<SelectControl
						label={__('Order', 'beplus-visual-mega-nav')}
						value={order}
						options={[
							{
								label: __(
									'Newest first',
									'beplus-visual-mega-nav'
								),
								value: 'DESC',
							},
							{
								label: __(
									'Oldest first',
									'beplus-visual-mega-nav'
								),
								value: 'ASC',
							},
						]}
						onChange={(v) => setAttr('order', v)}
					/>
				</PanelBody>

				<PanelBody
					title={__('Visibility', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<ToggleControl
						label={__('Show image', 'beplus-visual-mega-nav')}
						checked={showImage}
						onChange={(v) => setAttr('showImage', v)}
					/>

					<ToggleControl
						label={__('Show price', 'beplus-visual-mega-nav')}
						checked={showPrice}
						onChange={(v) => setAttr('showPrice', v)}
					/>

					<ToggleControl
						label={__('Show rating', 'beplus-visual-mega-nav')}
						checked={showRating}
						onChange={(v) => setAttr('showRating', v)}
					/>

					<ToggleControl
						label={__('Show add to cart', 'beplus-visual-mega-nav')}
						checked={showAddToCart}
						onChange={(v) => setAttr('showAddToCart', v)}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<ServerSideRender
					key={
						'product-list-' +
						filterBy +
						'-' +
						productCategories.join(',') +
						'-' +
						productTags.join(',') +
						'-' +
						productIds
					}
					block="beplus-visual-mega-nav/product-list"
					attributes={attributes}
				/>
			</div>
		</>
	);
}
