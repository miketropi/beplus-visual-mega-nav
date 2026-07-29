/**
 * Quote block — client registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../../blocks/quote/block.json';
import Edit from './edit';

import '../../../blocks/quote/style.css';
import '../../../blocks/quote/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
});
