/**
 * Link Item block — editor UI.
 *
 * @package
 */

import { useMemo } from '@wordpress/element';
import {
	InspectorControls,
	__experimentalLinkControl as LinkControl,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	Notice,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

import {
	LINK_CONTROL_SETTINGS,
	getSuggestionsQuery,
	updateLinkAttributes,
} from './link-control-utils';

const DEFAULT_BADGE_VARIANTS = [
	{
		label: __('Default', 'beplus-visual-mega-nav'),
		value: 'default',
	},
	{
		label: __('Accent', 'beplus-visual-mega-nav'),
		value: 'accent',
	},
	{
		label: __('Muted', 'beplus-visual-mega-nav'),
		value: 'muted',
	},
	{
		label: __('Outline', 'beplus-visual-mega-nav'),
		value: 'outline',
	},
];

function getBadgeVariantOptions() {
	const variants = applyFilters(
		'beplus-vmn.link-item-badge-variants',
		DEFAULT_BADGE_VARIANTS
	);

	return Array.isArray(variants) ? variants : DEFAULT_BADGE_VARIANTS;
}

function useIsInvalidLink(kind, type, id) {
	const isPostType =
		kind === 'post-type' || type === 'post' || type === 'page';
	const hasId = Number.isInteger(id) && id > 0;

	const postStatus = useSelect(
		(select) => {
			if (!isPostType || !hasId) {
				return null;
			}

			return select(coreStore).getEntityRecord('postType', type, id)
				?.status;
		},
		[isPostType, hasId, type, id]
	);

	if (!isPostType || !hasId) {
		return false;
	}

	return postStatus && postStatus !== 'publish';
}

export default function Edit({ attributes, setAttributes }) {
	const {
		label,
		url,
		id,
		kind,
		type,
		opensInNewTab,
		description,
		badge,
		badgeVariant,
	} = attributes;

	const isInvalid = useIsInvalidLink(kind, type, id);

	const blockProps = useBlockProps({
		className: `beplus-vmn-link-item beplus-vmn-link-item--badge-${badgeVariant || 'default'}`,
	});

	const linkValue = useMemo(
		() => ({
			url: url || '',
			opensInNewTab: !!opensInNewTab,
			id: id || undefined,
			kind: kind || undefined,
			type: type || undefined,
		}),
		[url, opensInNewTab, id, kind, type]
	);

	const onLinkChange = (nextValue) => {
		updateLinkAttributes(nextValue, setAttributes, attributes);
	};

	const onLinkRemove = () => {
		setAttributes({
			url: '',
			id: 0,
			kind: '',
			type: '',
			opensInNewTab: false,
		});
	};

	const badgeOptions = getBadgeVariantOptions();

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Link', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<LinkControl
						value={linkValue}
						onChange={onLinkChange}
						onRemove={onLinkRemove}
						settings={LINK_CONTROL_SETTINGS}
						suggestionsQuery={getSuggestionsQuery(type, kind)}
						showSuggestions
						showInitialSuggestions
						noDirectEntry={false}
						hasTextControl={false}
					/>
				</PanelBody>
				<PanelBody
					title={__('Content', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<TextControl
						label={__('Label', 'beplus-visual-mega-nav')}
						value={label}
						onChange={(value) => setAttributes({ label: value })}
						help={__(
							'Visible link text shown in the mega menu.',
							'beplus-visual-mega-nav'
						)}
					/>
					<TextControl
						label={__('Description', 'beplus-visual-mega-nav')}
						value={description}
						onChange={(value) =>
							setAttributes({ description: value })
						}
					/>
				</PanelBody>
				<PanelBody
					title={__('Badge', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<TextControl
						label={__('Badge text', 'beplus-visual-mega-nav')}
						value={badge}
						onChange={(value) => setAttributes({ badge: value })}
						placeholder={__('New', 'beplus-visual-mega-nav')}
					/>
					<SelectControl
						label={__('Badge style', 'beplus-visual-mega-nav')}
						value={badgeVariant || 'default'}
						options={badgeOptions}
						onChange={(value) =>
							setAttributes({ badgeVariant: value })
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{isInvalid && (
					<Notice status="warning" isDismissible={false}>
						{__(
							'This link is broken or the linked item is not published.',
							'beplus-visual-mega-nav'
						)}
					</Notice>
				)}

				{url ? (
					<a
						className="beplus-vmn-link-item__link"
						href={url}
						onClick={(event) => event.preventDefault()}
						target={opensInNewTab ? '_blank' : undefined}
						rel={opensInNewTab ? 'noopener noreferrer' : undefined}
					>
						<span className="beplus-vmn-link-item__label">
							{label || __('Link Item', 'beplus-visual-mega-nav')}
						</span>
						{badge ? (
							<span
								className="beplus-vmn-link-item__badge"
								aria-hidden="true"
							>
								{badge}
							</span>
						) : null}
					</a>
				) : (
					<span className="beplus-vmn-link-item__label beplus-vmn-link-item__label--placeholder">
						{label ||
							__(
								'Search for a page/post or enter a URL in block settings →',
								'beplus-visual-mega-nav'
							)}
					</span>
				)}

				{description ? (
					<p className="beplus-vmn-link-item__description">
						{description}
					</p>
				) : null}
			</div>
		</>
	);
}
