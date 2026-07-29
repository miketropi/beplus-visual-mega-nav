/**
 * Blog List block — editor UI.
 *
 * @package
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToggleControl,
	SelectControl,
	FormTokenField,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

export default function Edit({ attributes, setAttributes }) {
	const {
		postsToShow = 5,
		showThumbnail = true,
		showDate = true,
		showCategory = false,
		showExcerpt = false,
		showAuthor = false,
		orderBy = 'date',
		order = 'DESC',
		categories = [],
	} = attributes;

	const blockProps = useBlockProps();

	const setAttr = (key, value) => setAttributes({ [key]: value });

	// Fetch available categories for the token field.
	const categoryOptions = useSelect((select) => {
		const { getEntityRecords } = select('core');
		const terms = getEntityRecords('taxonomy', 'category', {
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
	const selectedCategories = categories
		.map((id) => {
			const match = categoryOptions.find((opt) => opt.value === id);
			return match ? match.title : null;
		})
		.filter(Boolean);

	const categorySuggestions = categoryOptions
		.map((opt) => opt.title)
		.filter((title) => !selectedCategories.includes(title));

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Settings', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<RangeControl
						label={__('Number of posts', 'beplus-visual-mega-nav')}
						value={postsToShow}
						onChange={(v) => setAttr('postsToShow', v)}
						min={1}
						max={10}
					/>

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
					title={__('Filter by Category', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
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
							setAttr('categories', ids);
						}}
						label={__('Categories', 'beplus-visual-mega-nav')}
						help={__(
							'Leave empty to show posts from all categories.',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelBody>

				<PanelBody
					title={__('Visibility', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<ToggleControl
						label={__('Show thumbnail', 'beplus-visual-mega-nav')}
						checked={showThumbnail}
						onChange={(v) => setAttr('showThumbnail', v)}
					/>

					<ToggleControl
						label={__('Show date', 'beplus-visual-mega-nav')}
						checked={showDate}
						onChange={(v) => setAttr('showDate', v)}
					/>

					<ToggleControl
						label={__('Show category', 'beplus-visual-mega-nav')}
						checked={showCategory}
						onChange={(v) => setAttr('showCategory', v)}
					/>

					<ToggleControl
						label={__('Show excerpt', 'beplus-visual-mega-nav')}
						checked={showExcerpt}
						onChange={(v) => setAttr('showExcerpt', v)}
					/>

					<ToggleControl
						label={__('Show author', 'beplus-visual-mega-nav')}
						checked={showAuthor}
						onChange={(v) => setAttr('showAuthor', v)}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<ServerSideRender
					key={'blog-list-' + categories.join(',')}
					block="beplus-visual-mega-nav/blog-list"
					attributes={attributes}
				/>
			</div>
		</>
	);
}
