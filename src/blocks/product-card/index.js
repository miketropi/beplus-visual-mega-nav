/**
 * Product Card block — client registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../../blocks/product-card/block.json';
import Edit from './edit';

import '../../../blocks/product-card/style.css';
import '../../../blocks/product-card/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
});
