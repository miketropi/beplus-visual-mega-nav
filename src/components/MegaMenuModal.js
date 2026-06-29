/**
 * MegaMenuModal — full-screen modal with Settings and Builder tabs.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import {
	Modal,
	TabPanel,
	Button,
	Spinner,
	Notice,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import SettingsPanel from './SettingsPanel';
import IsolatedEditor from './IsolatedEditor';
import TemplatePanel from './TemplatePanel';
import { normalizeSettings } from '../utils/templates';

const DEFAULT_SETTINGS = normalizeSettings();

export default function MegaMenuModal({ menuItemId, onClose }) {
	const [enabled, setEnabled] = useState(false);
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState(null);
	const [contentRevision, setContentRevision] = useState(0);

	useEffect(() => {
		setLoading(true);
		apiFetch({
			path: `/beplus-visual-mega-nav/v1/item/${menuItemId}`,
		})
			.then((data) => {
				setEnabled(data.enabled || false);
				setSettings(normalizeSettings(data.settings));
				setContent(data.content || '');
			})
			.catch(() => {
				setNotice({
					status: 'error',
					message: __(
						'Failed to load mega menu data.',
						'beplus-visual-mega-nav'
					),
				});
			})
			.finally(() => setLoading(false));
	}, [menuItemId]);

	const handleSave = async () => {
		setSaving(true);
		setNotice(null);

		try {
			await apiFetch({
				path: `/beplus-visual-mega-nav/v1/item/${menuItemId}`,
				method: 'POST',
				data: {
					enabled,
					settings: normalizeSettings(settings),
					content,
				},
			});

			setNotice({
				status: 'success',
				message: __('Mega menu saved.', 'beplus-visual-mega-nav'),
			});

			setTimeout(onClose, 900);
		} catch {
			setNotice({
				status: 'error',
				message: __(
					'Failed to save. Please try again.',
					'beplus-visual-mega-nav'
				),
			});
		} finally {
			setSaving(false);
		}
	};

	const handleApplyTemplate = ({
		settings: templateSettings,
		content: templateContent,
	}) => {
		setSettings(normalizeSettings(templateSettings));
		setContent(templateContent);
		setContentRevision((revision) => revision + 1);
	};

	const headerActions = loading ? null : (
		<div className="beplus-vmn-modal__header-actions">
			<TemplatePanel
				settings={settings}
				content={content}
				onApplyTemplate={handleApplyTemplate}
				onNotice={setNotice}
			/>
			<span
				className="beplus-vmn-modal__header-divider"
				aria-hidden="true"
			/>
			<Button variant="tertiary" onClick={onClose}>
				{__('Cancel', 'beplus-visual-mega-nav')}
			</Button>
			<Button
				variant="primary"
				onClick={handleSave}
				isBusy={saving}
				disabled={saving}
			>
				{saving
					? __('Saving…', 'beplus-visual-mega-nav')
					: __('Save', 'beplus-visual-mega-nav')}
			</Button>
		</div>
	);

	const tabs = [
		{
			name: 'settings',
			title: __('Settings', 'beplus-visual-mega-nav'),
			className: 'beplus-vmn-tab-settings',
		},
		{
			name: 'builder',
			title: __('Content Builder', 'beplus-visual-mega-nav'),
			className: 'beplus-vmn-tab-builder',
		},
	];

	return (
		<Modal
			title={__('Mega Menu Builder', 'beplus-visual-mega-nav')}
			headerActions={headerActions}
			onRequestClose={onClose}
			isFullScreen={true}
			className="beplus-vmn-modal"
		>
			{loading ? (
				<div className="beplus-vmn-modal__loading">
					<Spinner />
					<p className="beplus-vmn-modal__loading-text">
						{__(
							'Loading mega menu data…',
							'beplus-visual-mega-nav'
						)}
					</p>
				</div>
			) : (
				<div className="beplus-vmn-modal__shell admin-ui-page">
					<div className="beplus-vmn-modal__intro">
						<div className="beplus-vmn-modal__intro-text">
							<p className="admin-ui-page__header-subtitle">
								{sprintf(
									/* translators: %s: menu item ID number */
									__(
										'Editing menu item #%s',
										'beplus-visual-mega-nav'
									),
									menuItemId
								)}
							</p>
							<p className="beplus-vmn-modal__intro-hint">
								{enabled
									? __(
											'Changes apply to this menu item only.',
											'beplus-visual-mega-nav'
										)
									: __(
											'Enable the mega menu to replace the default sub-menu.',
											'beplus-visual-mega-nav'
										)}
							</p>
						</div>
						<span
							className={
								enabled
									? 'beplus-vmn-status-pill beplus-vmn-status-pill--active'
									: 'beplus-vmn-status-pill'
							}
						>
							{enabled
								? __('Enabled', 'beplus-visual-mega-nav')
								: __('Disabled', 'beplus-visual-mega-nav')}
						</span>
					</div>

					{notice && (
						<div className="beplus-vmn-modal__notice">
							<Notice
								status={notice.status}
								isDismissible={true}
								onDismiss={() => setNotice(null)}
							>
								{notice.message}
							</Notice>
						</div>
					)}

					<TabPanel className="beplus-vmn-modal__tabs" tabs={tabs}>
						{(tab) => {
							if (tab.name === 'settings') {
								return (
									<SettingsPanel
										enabled={enabled}
										onEnabledChange={setEnabled}
										settings={settings}
										onSettingsChange={setSettings}
									/>
								);
							}

							return (
								<IsolatedEditor
									key={`${menuItemId}-${contentRevision}`}
									initialContent={content}
									onChange={setContent}
									disabled={!enabled}
								/>
							);
						}}
					</TabPanel>
				</div>
			)}
		</Modal>
	);
}
