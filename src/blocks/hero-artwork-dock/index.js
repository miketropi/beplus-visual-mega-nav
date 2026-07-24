/**
 * Hero Artwork Dock block — registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from '../../../blocks/hero-artwork-dock/block.json';
import Edit from './edit';

import '../../../blocks/hero-artwork-dock/style.css';
import '../../../blocks/hero-artwork-dock/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
