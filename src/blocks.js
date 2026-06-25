/**
 * Block editor entry point.
 *
 * Registers all Snap Mega Menu blocks in the Gutenberg editor context
 * (Site Editor, Post Editor). Loaded via editorScript in each block's
 * block.json.
 */

import { registerCoreBlocks } from '@wordpress/block-library';
import './blocks/link-item';
import './blocks/snap-header';
import './blocks/snap-navigation';
import './blocks/nav-menu-area';
import './blocks/nav-toggle';

registerCoreBlocks();
