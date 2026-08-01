/**
 * Product List block — client registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../../blocks/product-list/block.json';
import Edit from './edit';

import '../../../blocks/product-list/style.css';
import '../../../blocks/product-list/editor.css';

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
} );
