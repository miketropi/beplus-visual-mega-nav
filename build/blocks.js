/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/blocks.js"
/*!***********************!*\
  !*** ./src/blocks.js ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_block_library__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-library */ "@wordpress/block-library");
/* harmony import */ var _wordpress_block_library__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_library__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _blocks_link_item__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./blocks/link-item */ "./src/blocks/link-item/index.js");
/* harmony import */ var _blocks_snap_header__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./blocks/snap-header */ "./src/blocks/snap-header/index.js");
/* harmony import */ var _blocks_snap_navigation__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./blocks/snap-navigation */ "./src/blocks/snap-navigation/index.js");
/* harmony import */ var _blocks_nav_menu_area__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./blocks/nav-menu-area */ "./src/blocks/nav-menu-area/index.js");
/* harmony import */ var _blocks_nav_toggle__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./blocks/nav-toggle */ "./src/blocks/nav-toggle/index.js");
/**
 * Block editor entry point.
 *
 * Registers all Snap Mega Menu blocks in the Gutenberg editor context
 * (Site Editor, Post Editor). Loaded via editorScript in each block's
 * block.json.
 */







(0,_wordpress_block_library__WEBPACK_IMPORTED_MODULE_0__.registerCoreBlocks)();

/***/ },

/***/ "./src/blocks/link-item/edit.js"
/*!**************************************!*\
  !*** ./src/blocks/link-item/edit.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/core-data */ "@wordpress/core-data");
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _link_control_utils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./link-control-utils */ "./src/blocks/link-item/link-control-utils.js");

/**
 * Link Item block — editor UI.
 *
 * @package
 */









const DEFAULT_BADGE_VARIANTS = [{
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Default', 'snap-megamenu-builder'),
  value: 'default'
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Accent', 'snap-megamenu-builder'),
  value: 'accent'
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Muted', 'snap-megamenu-builder'),
  value: 'muted'
}, {
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Outline', 'snap-megamenu-builder'),
  value: 'outline'
}];
function getBadgeVariantOptions() {
  const variants = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_5__.applyFilters)('snap-megamenu.link-item-badge-variants', DEFAULT_BADGE_VARIANTS);
  return Array.isArray(variants) ? variants : DEFAULT_BADGE_VARIANTS;
}
function useIsInvalidLink(kind, type, id) {
  const isPostType = kind === 'post-type' || type === 'post' || type === 'page';
  const hasId = Number.isInteger(id) && id > 0;
  const postStatus = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_4__.useSelect)(select => {
    if (!isPostType || !hasId) {
      return null;
    }
    return select(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_7__.store).getEntityRecord('postType', type, id)?.status;
  }, [isPostType, hasId, type, id]);
  if (!isPostType || !hasId) {
    return false;
  }
  return postStatus && postStatus !== 'publish';
}
function Edit({
  attributes,
  setAttributes
}) {
  const {
    label,
    url,
    id,
    kind,
    type,
    opensInNewTab,
    description,
    badge,
    badgeVariant
  } = attributes;
  const isInvalid = useIsInvalidLink(kind, type, id);
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useBlockProps)({
    className: `snap-megamenu-link-item snap-megamenu-link-item--badge-${badgeVariant || 'default'}`
  });
  const linkValue = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => ({
    url: url || '',
    opensInNewTab: !!opensInNewTab,
    id: id || undefined,
    kind: kind || undefined,
    type: type || undefined
  }), [url, opensInNewTab, id, kind, type]);
  const onLinkChange = nextValue => {
    (0,_link_control_utils__WEBPACK_IMPORTED_MODULE_8__.updateLinkAttributes)(nextValue, setAttributes, attributes);
  };
  const onLinkRemove = () => {
    setAttributes({
      url: '',
      id: 0,
      kind: '',
      type: '',
      opensInNewTab: false
    });
  };
  const badgeOptions = getBadgeVariantOptions();
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InspectorControls, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Link', 'snap-megamenu-builder'),
    initialOpen: true
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.__experimentalLinkControl, {
    value: linkValue,
    onChange: onLinkChange,
    onRemove: onLinkRemove,
    settings: _link_control_utils__WEBPACK_IMPORTED_MODULE_8__.LINK_CONTROL_SETTINGS,
    suggestionsQuery: (0,_link_control_utils__WEBPACK_IMPORTED_MODULE_8__.getSuggestionsQuery)(type, kind),
    showSuggestions: true,
    showInitialSuggestions: true,
    noDirectEntry: false,
    hasTextControl: false
  })), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Content', 'snap-megamenu-builder'),
    initialOpen: true
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Label', 'snap-megamenu-builder'),
    value: label,
    onChange: value => setAttributes({
      label: value
    }),
    help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Visible link text shown in the mega menu.', 'snap-megamenu-builder')
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Description', 'snap-megamenu-builder'),
    value: description,
    onChange: value => setAttributes({
      description: value
    })
  })), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Badge', 'snap-megamenu-builder'),
    initialOpen: false
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Badge text', 'snap-megamenu-builder'),
    value: badge,
    onChange: value => setAttributes({
      badge: value
    }),
    placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('New', 'snap-megamenu-builder')
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.SelectControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Badge style', 'snap-megamenu-builder'),
    value: badgeVariant || 'default',
    options: badgeOptions,
    onChange: value => setAttributes({
      badgeVariant: value
    })
  }))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    ...blockProps
  }, isInvalid && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.Notice, {
    status: "warning",
    isDismissible: false
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('This link is broken or the linked item is not published.', 'snap-megamenu-builder')), url ? (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("a", {
    className: "snap-megamenu-link-item__link",
    href: url,
    onClick: event => event.preventDefault(),
    target: opensInNewTab ? '_blank' : undefined,
    rel: opensInNewTab ? 'noopener noreferrer' : undefined
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", {
    className: "snap-megamenu-link-item__label"
  }, label || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Link Item', 'snap-megamenu-builder')), badge ? (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", {
    className: "snap-megamenu-link-item__badge",
    "aria-hidden": "true"
  }, badge) : null) : (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", {
    className: "snap-megamenu-link-item__label snap-megamenu-link-item__label--placeholder"
  }, label || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Search for a page/post or enter a URL in block settings →', 'snap-megamenu-builder')), description ? (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("p", {
    className: "snap-megamenu-link-item__description"
  }, description) : null));
}

/***/ },

/***/ "./src/blocks/link-item/index.js"
/*!***************************************!*\
  !*** ./src/blocks/link-item/index.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _blocks_link_item_block_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../blocks/link-item/block.json */ "./blocks/link-item/block.json");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./edit */ "./src/blocks/link-item/edit.js");
/* harmony import */ var _blocks_link_item_style_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../blocks/link-item/style.css */ "./blocks/link-item/style.css");
/* harmony import */ var _blocks_link_item_editor_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../blocks/link-item/editor.css */ "./blocks/link-item/editor.css");
/**
 * Link Item block — client registration.
 *
 * @package
 */






(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.registerBlockType)(_blocks_link_item_block_json__WEBPACK_IMPORTED_MODULE_1__.name, {
  ..._blocks_link_item_block_json__WEBPACK_IMPORTED_MODULE_1__,
  edit: _edit__WEBPACK_IMPORTED_MODULE_2__["default"],
  save: () => null
});

/***/ },

/***/ "./src/blocks/link-item/link-control-utils.js"
/*!****************************************************!*\
  !*** ./src/blocks/link-item/link-control-utils.js ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LINK_CONTROL_SETTINGS: () => (/* binding */ LINK_CONTROL_SETTINGS),
/* harmony export */   getSuggestionsQuery: () => (/* binding */ getSuggestionsQuery),
/* harmony export */   updateLinkAttributes: () => (/* binding */ updateLinkAttributes)
/* harmony export */ });
/* harmony import */ var _wordpress_escape_html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/escape-html */ "@wordpress/escape-html");
/* harmony import */ var _wordpress_escape_html__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_escape_html__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/url */ "@wordpress/url");
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_url__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/**
 * LinkControl helpers for the Link Item block.
 *
 * @package Snap\MegaMenu
 */





const LINK_CONTROL_SETTINGS = [{
  id: 'opensInNewTab',
  title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Open in new tab', 'snap-megamenu-builder')
}];

/**
 * Query params for LinkControl post/page search.
 *
 * @param {string} type Block link type (post, page, etc.).
 * @param {string} kind Block link kind (post-type, custom, etc.).
 * @return {Object} suggestionsQuery for LinkControl.
 */
function getSuggestionsQuery(type, kind) {
  let query;
  switch (type) {
    case 'post':
    case 'page':
      query = {
        type: 'post',
        subtype: type,
        perPage: 20
      };
      break;
    default:
      if (kind === 'post-type' && type) {
        query = {
          type: 'post',
          subtype: type,
          perPage: 20
        };
        break;
      }

      // No link yet — search pages and posts; show recent pages first.
      query = {
        type: 'post',
        perPage: 20,
        initialSuggestionsSearchOptions: {
          type: 'post',
          subtype: 'page',
          perPage: 20
        }
      };
      break;
  }
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_2__.applyFilters)('snap-megamenu.link-item-suggestions-query', query, {
    type,
    kind
  });
}

/**
 * Sync LinkControl value into block attributes (navigation-link pattern).
 *
 * @param {Object}   updatedValue    LinkControl value.
 * @param {Function} setAttributes   Block setAttributes.
 * @param {Object}   blockAttributes Current block attributes.
 */
function updateLinkAttributes(updatedValue = {}, setAttributes, blockAttributes = {}) {
  const {
    label: originalLabel = '',
    kind: originalKind = '',
    type: originalType = ''
  } = blockAttributes;
  const {
    title: newLabel = '',
    url: newUrl = '',
    opensInNewTab,
    id,
    kind: newKind = originalKind,
    type: newType = originalType
  } = updatedValue;
  const newLabelWithoutHttp = newLabel.replace(/http(s?):\/\//gi, '');
  const newUrlWithoutHttp = newUrl.replace(/http(s?):\/\//gi, '');
  const useNewLabel = newLabel && newLabel !== originalLabel && newLabelWithoutHttp !== newUrlWithoutHttp;
  const label = useNewLabel ? (0,_wordpress_escape_html__WEBPACK_IMPORTED_MODULE_0__.escapeHTML)(newLabel) : originalLabel || (0,_wordpress_escape_html__WEBPACK_IMPORTED_MODULE_0__.escapeHTML)(newUrlWithoutHttp);
  const type = newType === 'post_tag' ? 'tag' : newType.replace('-', '_');
  const isBuiltInType = ['post', 'page', 'tag', 'category'].indexOf(type) > -1;
  const isCustomLink = !newKind && !isBuiltInType || newKind === 'custom';
  const kind = isCustomLink ? 'custom' : newKind;
  const nextId = id && Number.isInteger(id) && !isCustomLink ? id : 0;
  setAttributes({
    ...(newUrl && {
      url: encodeURI((0,_wordpress_url__WEBPACK_IMPORTED_MODULE_1__.safeDecodeURI)(newUrl))
    }),
    ...(label && {
      label
    }),
    ...(undefined !== opensInNewTab && {
      opensInNewTab
    }),
    id: nextId,
    ...(kind && {
      kind
    }),
    ...(type && type !== 'URL' && {
      type
    }),
    ...(!newUrl && {
      url: '',
      id: 0,
      kind: '',
      type: ''
    }),
    ...(isCustomLink && {
      id: 0,
      type: ''
    })
  });
}

/***/ },

/***/ "./src/blocks/nav-menu-area/edit.js"
/*!******************************************!*\
  !*** ./src/blocks/nav-menu-area/edit.js ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_server_side_render__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/server-side-render */ "@wordpress/server-side-render");
/* harmony import */ var _wordpress_server_side_render__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_server_side_render__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);






function Edit({
  attributes,
  setAttributes
}) {
  const {
    menuId
  } = attributes;
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useBlockProps)();
  const menus = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => {
    const {
      getEntityRecords
    } = select('core');
    return getEntityRecords('root', 'menu', {
      per_page: 100
    }) || [];
  }, []);
  const menuOptions = [{
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('— Select a menu —', 'snap-megamenu-builder'),
    value: 0
  }, ...menus.map(menu => ({
    label: menu.name,
    value: menu.id
  }))];
  if (menus.length === 0) {
    return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
      ...blockProps
    }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.Notice, {
      status: "warning",
      isDismissible: false
    }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('No menus found. Create one in Appearance → Menus.', 'snap-megamenu-builder')));
  }
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InspectorControls, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Menu Settings', 'snap-megamenu-builder')
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.SelectControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Select menu', 'snap-megamenu-builder'),
    value: menuId,
    options: menuOptions,
    onChange: value => setAttributes({
      menuId: parseInt(value, 10)
    })
  }))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    ...blockProps
  }, menuId > 0 ? (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)((_wordpress_server_side_render__WEBPACK_IMPORTED_MODULE_4___default()), {
    block: "snap-megamenu/nav-menu-area",
    attributes: attributes
  }) : (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.Notice, {
    status: "info",
    isDismissible: false
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Select a menu to display.', 'snap-megamenu-builder'))));
}

/***/ },

/***/ "./src/blocks/nav-menu-area/index.js"
/*!*******************************************!*\
  !*** ./src/blocks/nav-menu-area/index.js ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _blocks_nav_menu_area_block_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../blocks/nav-menu-area/block.json */ "./blocks/nav-menu-area/block.json");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./edit */ "./src/blocks/nav-menu-area/edit.js");



(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.registerBlockType)(_blocks_nav_menu_area_block_json__WEBPACK_IMPORTED_MODULE_1__.name, {
  ..._blocks_nav_menu_area_block_json__WEBPACK_IMPORTED_MODULE_1__,
  edit: _edit__WEBPACK_IMPORTED_MODULE_2__["default"],
  save: () => null
});

/***/ },

/***/ "./src/blocks/nav-toggle/edit.js"
/*!***************************************!*\
  !*** ./src/blocks/nav-toggle/edit.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);




function Edit({
  attributes,
  setAttributes,
  context
}) {
  const {
    iconStyle,
    label,
    labelVisible
  } = attributes;
  const overlayId = context['snap-megamenu/overlayId'] || '';
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.useBlockProps)({
    className: 'is-mobile-only snap-nav-toggle-preview'
  });
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.InspectorControls, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Toggle Settings', 'snap-megamenu-builder')
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.SelectControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Icon style', 'snap-megamenu-builder'),
    value: iconStyle,
    options: [{
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('3 lines', 'snap-megamenu-builder'),
      value: 'lines-3'
    }, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('2 lines', 'snap-megamenu-builder'),
      value: 'lines-2'
    }],
    onChange: value => setAttributes({
      iconStyle: value
    })
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.ToggleControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Show label', 'snap-megamenu-builder'),
    checked: labelVisible,
    onChange: value => setAttributes({
      labelVisible: value
    })
  }), labelVisible && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Label', 'snap-megamenu-builder'),
    value: label,
    onChange: value => setAttributes({
      label: value
    }),
    placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Menu', 'snap-megamenu-builder')
  }))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("button", {
    type: "button",
    ...blockProps,
    "aria-expanded": "false",
    "aria-controls": overlayId || undefined,
    "aria-label": label || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Open menu', 'snap-megamenu-builder')
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", {
    className: `snap-nav-toggle__icon snap-nav-toggle__icon--${iconStyle}`,
    "aria-hidden": "true"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", null), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", null), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", null)), labelVisible && label && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", {
    className: "snap-nav-toggle__label"
  }, label)));
}

/***/ },

/***/ "./src/blocks/nav-toggle/index.js"
/*!****************************************!*\
  !*** ./src/blocks/nav-toggle/index.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _blocks_nav_toggle_block_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../blocks/nav-toggle/block.json */ "./blocks/nav-toggle/block.json");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./edit */ "./src/blocks/nav-toggle/edit.js");



(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.registerBlockType)(_blocks_nav_toggle_block_json__WEBPACK_IMPORTED_MODULE_1__.name, {
  ..._blocks_nav_toggle_block_json__WEBPACK_IMPORTED_MODULE_1__,
  edit: _edit__WEBPACK_IMPORTED_MODULE_2__["default"],
  save: () => null
});

/***/ },

/***/ "./src/blocks/snap-header/edit.js"
/*!****************************************!*\
  !*** ./src/blocks/snap-header/edit.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);





function Edit({
  attributes,
  setAttributes,
  clientId
}) {
  const {
    instanceId,
    mobileBreakpoint,
    sticky,
    scrollEffect,
    scrollBgColor,
    transparentTop,
    gridColumns
  } = attributes;
  const themeColors = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useSetting)('color.palette') || [];
  const disableCustomColors = !(0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useSetting)('color.custom');
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    if (!instanceId) {
      setAttributes({
        instanceId: clientId.slice(0, 8)
      });
    }
  }, [instanceId, clientId, setAttributes]);
  const columns = (gridColumns || 'auto 1fr').trim() || 'auto 1fr';
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useBlockProps)({
    className: 'is-layout-grid',
    style: {
      display: 'grid',
      gridTemplateColumns: columns
    }
  });
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InspectorControls, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Mobile Breakpoint', 'snap-megamenu-builder')
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.SelectControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Breakpoint', 'snap-megamenu-builder'),
    value: mobileBreakpoint,
    options: [{
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Mobile (600px)', 'snap-megamenu-builder'),
      value: 600
    }, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Tablet (782px)', 'snap-megamenu-builder'),
      value: 782
    }, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Desktop (1024px)', 'snap-megamenu-builder'),
      value: 1024
    }, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Custom', 'snap-megamenu-builder'),
      value: -1
    }],
    onChange: value => {
      if (parseInt(value, 10) > 0) {
        setAttributes({
          mobileBreakpoint: parseInt(value, 10)
        });
      }
    }
  }), mobileBreakpoint < 0 && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Custom breakpoint (px)', 'snap-megamenu-builder'),
    type: "number",
    value: (Math.abs(mobileBreakpoint) || 782).toString(),
    min: 320,
    max: 1200,
    onChange: value => setAttributes({
      mobileBreakpoint: parseInt(value, 10) || 782
    })
  })), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Sticky', 'snap-megamenu-builder')
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.ToggleControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Sticky header', 'snap-megamenu-builder'),
    checked: sticky,
    onChange: value => setAttributes({
      sticky: value
    })
  }), sticky && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.SelectControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Scroll effect', 'snap-megamenu-builder'),
    value: scrollEffect,
    options: [{
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('None', 'snap-megamenu-builder'),
      value: 'none'
    }, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Shrink', 'snap-megamenu-builder'),
      value: 'shrink'
    }, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Hide on scroll', 'snap-megamenu-builder'),
      value: 'hide-on-scroll'
    }, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Background on scroll', 'snap-megamenu-builder'),
      value: 'bg-on-scroll'
    }],
    onChange: value => setAttributes({
      scrollEffect: value
    })
  }), sticky && scrollEffect === 'bg-on-scroll' && (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.ColorPalette, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Scroll background color', 'snap-megamenu-builder'),
    colors: themeColors,
    disableCustomColors: disableCustomColors,
    value: scrollBgColor || '',
    onChange: value => setAttributes({
      scrollBgColor: value || ''
    }),
    clearable: true
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.ToggleControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Transparent at top', 'snap-megamenu-builder'),
    checked: transparentTop,
    onChange: value => setAttributes({
      transparentTop: value
    }),
    help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Header has no background when at the top of the page.', 'snap-megamenu-builder')
  })), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.PanelBody, {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Grid Columns', 'snap-megamenu-builder'),
    initialOpen: false
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.TextControl, {
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Grid template columns', 'snap-megamenu-builder'),
    value: gridColumns || 'auto 1fr',
    onChange: value => setAttributes({
      gridColumns: value || 'auto 1fr'
    }),
    placeholder: "auto 1fr",
    help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('CSS grid-template-columns value, e.g. "auto 1fr", "auto 1fr auto", "1fr 2fr 1fr".', 'snap-megamenu-builder')
  }))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    ...blockProps
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InnerBlocks, {
    template: [['snap-megamenu/snap-navigation', {}]],
    templateLock: false
  })));
}

/***/ },

/***/ "./src/blocks/snap-header/index.js"
/*!*****************************************!*\
  !*** ./src/blocks/snap-header/index.js ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _blocks_snap_header_block_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../blocks/snap-header/block.json */ "./blocks/snap-header/block.json");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./edit */ "./src/blocks/snap-header/edit.js");





(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__.registerBlockType)(_blocks_snap_header_block_json__WEBPACK_IMPORTED_MODULE_3__.name, {
  ..._blocks_snap_header_block_json__WEBPACK_IMPORTED_MODULE_3__,
  edit: _edit__WEBPACK_IMPORTED_MODULE_4__["default"],
  save: () => (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InnerBlocks.Content, null)
});

/***/ },

/***/ "./src/blocks/snap-navigation/edit.js"
/*!********************************************!*\
  !*** ./src/blocks/snap-navigation/edit.js ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__);



function Edit({
  attributes,
  setAttributes,
  context
}) {
  const {
    overlayId,
    layout,
    style
  } = attributes;
  const instanceId = context['snap-megamenu/instanceId'] || '';
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    if (!overlayId && instanceId) {
      setAttributes({
        overlayId: `overlay-${instanceId}`
      });
    }
  }, [overlayId, instanceId, setAttributes]);

  // Build inline flex style from layout attribute (matches server render).
  const flexStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap'
  };
  if (layout) {
    if (layout.orientation === 'vertical') {
      flexStyle.flexDirection = 'column';
    }
    if (layout.flexWrap) {
      flexStyle.flexWrap = layout.flexWrap;
    }
    if (layout.justifyContent) {
      flexStyle.justifyContent = layout.justifyContent;
    } else {
      flexStyle.justifyContent = 'right';
    }
    if (layout.verticalAlignment) {
      const alignMap = {
        top: 'flex-start',
        center: 'center',
        bottom: 'flex-end'
      };
      flexStyle.alignItems = alignMap[layout.verticalAlignment] || layout.verticalAlignment;
    }
  } else {
    flexStyle.justifyContent = 'right';
  }

  // Resolve WordPress preset reference ("var:preset|spacing|50") to CSS var().
  const resolvePreset = value => {
    if (typeof value === 'string' && value.startsWith('var:preset|')) {
      const [, cat, slug] = value.split('|');
      if (cat && slug) {
        return `var(--wp--preset--${cat}--${slug})`;
      }
    }
    return value;
  };

  // Merge spacing (padding per-side) from style attribute.
  if (style && style.spacing) {
    const {
      padding,
      blockGap
    } = style.spacing;
    if (padding) {
      if (padding.top) flexStyle.paddingTop = resolvePreset(padding.top);
      if (padding.right) flexStyle.paddingRight = resolvePreset(padding.right);
      if (padding.bottom) flexStyle.paddingBottom = resolvePreset(padding.bottom);
      if (padding.left) flexStyle.paddingLeft = resolvePreset(padding.left);
    }
    if (blockGap) {
      flexStyle.gap = resolvePreset(blockGap);
    }
  }
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useBlockProps)({
    style: flexStyle
  });
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    ...blockProps
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InnerBlocks, {
    template: [['snap-megamenu/nav-menu-area', {}], ['snap-megamenu/nav-toggle', {}]],
    templateLock: false
  }));
}

/***/ },

/***/ "./src/blocks/snap-navigation/index.js"
/*!*********************************************!*\
  !*** ./src/blocks/snap-navigation/index.js ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _blocks_snap_navigation_block_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../blocks/snap-navigation/block.json */ "./blocks/snap-navigation/block.json");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./edit */ "./src/blocks/snap-navigation/edit.js");





(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__.registerBlockType)(_blocks_snap_navigation_block_json__WEBPACK_IMPORTED_MODULE_3__.name, {
  ..._blocks_snap_navigation_block_json__WEBPACK_IMPORTED_MODULE_3__,
  edit: _edit__WEBPACK_IMPORTED_MODULE_4__["default"],
  save: () => (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InnerBlocks.Content, null)
});

/***/ },

/***/ "./blocks/link-item/editor.css"
/*!*************************************!*\
  !*** ./blocks/link-item/editor.css ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./blocks/link-item/style.css"
/*!************************************!*\
  !*** ./blocks/link-item/style.css ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "react"
/*!************************!*\
  !*** external "React" ***!
  \************************/
(module) {

module.exports = window["React"];

/***/ },

/***/ "@wordpress/block-editor"
/*!*************************************!*\
  !*** external ["wp","blockEditor"] ***!
  \*************************************/
(module) {

module.exports = window["wp"]["blockEditor"];

/***/ },

/***/ "@wordpress/block-library"
/*!**************************************!*\
  !*** external ["wp","blockLibrary"] ***!
  \**************************************/
(module) {

module.exports = window["wp"]["blockLibrary"];

/***/ },

/***/ "@wordpress/blocks"
/*!********************************!*\
  !*** external ["wp","blocks"] ***!
  \********************************/
(module) {

module.exports = window["wp"]["blocks"];

/***/ },

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

/***/ },

/***/ "@wordpress/core-data"
/*!**********************************!*\
  !*** external ["wp","coreData"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["coreData"];

/***/ },

/***/ "@wordpress/data"
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["data"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/escape-html"
/*!************************************!*\
  !*** external ["wp","escapeHtml"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["escapeHtml"];

/***/ },

/***/ "@wordpress/hooks"
/*!*******************************!*\
  !*** external ["wp","hooks"] ***!
  \*******************************/
(module) {

module.exports = window["wp"]["hooks"];

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/server-side-render"
/*!******************************************!*\
  !*** external ["wp","serverSideRender"] ***!
  \******************************************/
(module) {

module.exports = window["wp"]["serverSideRender"];

/***/ },

/***/ "@wordpress/url"
/*!*****************************!*\
  !*** external ["wp","url"] ***!
  \*****************************/
(module) {

module.exports = window["wp"]["url"];

/***/ },

/***/ "./blocks/link-item/block.json"
/*!*************************************!*\
  !*** ./blocks/link-item/block.json ***!
  \*************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"snap-megamenu/link-item","title":"Link Item","category":"snap-megamenu","description":"Navigation link with optional badge and description for mega menu panels.","keywords":["link","navigation","menu","badge","mega menu"],"textdomain":"snap-megamenu-builder","icon":"admin-links","style":"file:./style.css","editorStyle":["file:./editor.css","file:./style.css"],"render":"file:./render.php","supports":{"html":false,"anchor":false,"reusable":false,"multiple":true,"className":false},"attributes":{"label":{"type":"string","default":""},"url":{"type":"string","default":""},"id":{"type":"number","default":0},"kind":{"type":"string","default":""},"type":{"type":"string","default":""},"opensInNewTab":{"type":"boolean","default":false},"rel":{"type":"string","default":""},"description":{"type":"string","default":""},"badge":{"type":"string","default":""},"badgeVariant":{"type":"string","default":"default"}}}');

/***/ },

/***/ "./blocks/nav-menu-area/block.json"
/*!*****************************************!*\
  !*** ./blocks/nav-menu-area/block.json ***!
  \*****************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"snap-megamenu/nav-menu-area","title":"Menu Area","category":"header","parent":["snap-megamenu/snap-navigation"],"icon":"list-view","description":"Renders a classic WordPress menu using the existing mega menu engine.","keywords":["menu","navigation","classic menu","snap"],"textdomain":"snap-megamenu-builder","attributes":{"menuId":{"type":"number","default":0}},"usesContext":["snap-megamenu/instanceId"],"supports":{"html":false,"spacing":{"padding":true},"typography":{"fontSize":true,"lineHeight":true,"__experimentalFontFamily":true,"__experimentalFontWeight":true,"__experimentalFontStyle":true,"__experimentalTextTransform":true,"__experimentalLetterSpacing":true}},"render":"file:./render.php","style":"file:./style.css","editorScript":"file:../../build/blocks.js"}');

/***/ },

/***/ "./blocks/nav-toggle/block.json"
/*!**************************************!*\
  !*** ./blocks/nav-toggle/block.json ***!
  \**************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"snap-megamenu/nav-toggle","title":"Nav Toggle","category":"header","ancestor":["snap-megamenu/snap-header"],"icon":"menu","description":"Hamburger button that opens the mobile navigation overlay below the breakpoint.","keywords":["hamburger","toggle","menu","mobile","snap"],"textdomain":"snap-megamenu-builder","attributes":{"iconStyle":{"type":"string","default":"lines-3"},"label":{"type":"string","default":""},"labelVisible":{"type":"boolean","default":false}},"usesContext":["snap-megamenu/overlayId","snap-megamenu/instanceId","snap-megamenu/mobileBreakpoint"],"supports":{"html":false,"spacing":{"padding":true,"margin":true}},"render":"file:./render.php","style":"file:./style.css","editorStyle":"file:./editor.css","editorScript":"file:../../build/blocks.js"}');

/***/ },

/***/ "./blocks/snap-header/block.json"
/*!***************************************!*\
  !*** ./blocks/snap-header/block.json ***!
  \***************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"snap-megamenu/snap-header","title":"Snap Header","category":"header","icon":"table-row-before","description":"Outer header container with sticky positioning, scroll effects, and per-instance mobile breakpoint.","keywords":["header","sticky","navigation","snap"],"textdomain":"snap-megamenu-builder","attributes":{"instanceId":{"type":"string","default":""},"mobileBreakpoint":{"type":"number","default":782},"sticky":{"type":"boolean","default":false},"scrollEffect":{"type":"string","default":"none"},"transparentTop":{"type":"boolean","default":false},"gridColumns":{"type":"string","default":"auto 1fr"},"scrollBgColor":{"type":"string","default":""}},"providesContext":{"snap-megamenu/instanceId":"instanceId","snap-megamenu/mobileBreakpoint":"mobileBreakpoint","snap-megamenu/sticky":"sticky"},"supports":{"spacing":{"blockGap":true,"padding":true,"margin":false},"color":{"background":true,"text":true},"align":["wide","full"]},"render":"file:./render.php","viewScript":"file:./view.js","style":"file:./style.css","editorStyle":"file:./editor.css","editorScript":"file:../../build/blocks.js"}');

/***/ },

/***/ "./blocks/snap-navigation/block.json"
/*!*******************************************!*\
  !*** ./blocks/snap-navigation/block.json ***!
  \*******************************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"snap-megamenu/snap-navigation","title":"Snap Navigation","category":"header","parent":["snap-megamenu/snap-header","core/group","core/column"],"icon":"menu","description":"Flexible navigation container that hosts a classic menu and hamburger toggle.","keywords":["navigation","menu","nav","snap"],"textdomain":"snap-megamenu-builder","attributes":{"overlayId":{"type":"string","default":""}},"usesContext":["snap-megamenu/instanceId","snap-megamenu/mobileBreakpoint"],"providesContext":{"snap-megamenu/overlayId":"overlayId"},"supports":{"layout":{"type":"flex","allowJustification":true,"allowVerticalAlignment":true},"spacing":{"blockGap":true,"padding":true}},"render":"file:./render.php","style":"file:./style.css","editorStyle":"file:./editor.css","editorScript":"file:../../build/blocks.js"}');

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"blocks": 0,
/******/ 			"./style-index": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunksnap_megamenu_builder"] = globalThis["webpackChunksnap_megamenu_builder"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["./style-index"], () => (__webpack_require__("./src/blocks.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=blocks.js.map