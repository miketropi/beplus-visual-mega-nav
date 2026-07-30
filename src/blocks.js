/**
 * Block editor entry point.
 *
 * Registers all Beplus Visual Mega Nav blocks in the Gutenberg editor context
 * (Site Editor, Post Editor). Loaded via editorScript in each block's
 * block.json.
 */

import { registerCoreBlocks } from '@wordpress/block-library';
import './blocks/link-item';
import './blocks/beplus-header';
import './blocks/beplus-navigation';
import './blocks/nav-menu-area';
import './blocks/nav-toggle';
import './blocks/tab-container';
import './blocks/tab-panel';
import './blocks/hero-artwork-dock';
import './blocks/blog-list';
import './blocks/quote';

registerCoreBlocks();
