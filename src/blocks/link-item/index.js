/**
 * Link Item block — client registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../../blocks/link-item/block.json';
import Edit from './edit';

import '../../../blocks/link-item/style.css';
import '../../../blocks/link-item/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
});
