import '@servicenow/now-heading';
import {
	OPEN_RECORD,
	CANCEL,
	SAVE,
	BROWSE,
	SLUSH_LEFT_LABEL,
	SLUSH_RIGHT_LABEL,
	IFRAME_LOADED
} from './constants';
import { getFieldAnnotation, isAttrTrue } from '../utils';
// eslint-disable-next-line no-unused-vars
import { Fragment } from '@servicenow/ui-renderer-snabbdom';
import { t } from 'sn-translate';

export const view = (
	{ properties: { field = {} }, openModal = false, valuesList = [] },
	dispatch
) => {
	var printableVersion = isAttrTrue(field.readonly)
		? 'hide-printable-buttons'
		: '';
	const {
		listTable,
		label,
		visible,
		mandatory,
		isInvalid,
		hasScript,
		messages
	} = field;
	var onLoadSysIds = valuesList.map(item => item.value);

	if (isAttrTrue(visible)) {
		return (
			<div className="sn-catalog-form-multiple-select">
				{renderBrowseButton(
					valuesList,
					label,
					printableVersion,
					mandatory,
					isInvalid,
					messages,
					field
				)}
				{renderList(
					valuesList,
					label,
					listTable,
					printableVersion,
					mandatory,
					hasScript,
					isInvalid,
					messages,
					field
				)}
				{renderModal(onLoadSysIds, field, openModal, label, dispatch)}
			</div>
		);
	}
};

const renderModal = (onLoadSysIds, field, openModal, label, dispatch) => {
	if (openModal) {
		return (
			<div className="sn-catalog-form-multiple-select-modal">
				<now-modal
					footerActions={[
						{ variant: 'primary', label: SAVE, tooltipContent: SAVE },
						{ variant: 'secondary', label: CANCEL, tooltipContent: CANCEL }
					]}
					size="fullscreen"
					opened={openModal}
					header-label={label}
				>
					<slot name="defaultSlot">
						{renderModalContent({ onLoadSysIds, field, dispatch })}
					</slot>
				</now-modal>
			</div>
		);
	} else {
		return <Fragment />;
	}
};

const renderList = (
	values = [],
	label,
	tableName,
	printableVersion,
	mandatory,
	hasScript,
	isInvalid,
	messages,
	field
) => {
	if (values.length == 0) {
		return <Fragment />;
	}

	return (
		<div className="sn-catalog-form-multiple-select-list">
			<div className="sn-catalog-form-multiple-select-list-buttons">
				<div className="multi-select-label">
					<sn-record-control-wrapper
						label={label}
						required={isAttrTrue(mandatory)}
						invalid={isAttrTrue(isInvalid)}
						helperContent={getFieldAnnotation(field)}
					/>
				</div>
				<span className="multi-select-icon">
					<now-icon className={printableVersion} icon="pencil-fill" size="sm" />
				</span>
				<now-button-bare
					className={printableVersion}
					label={t('Edit {0}', label.toLowerCase())}
					tooltipContent={t('Edit {0}', label.toLowerCase())}
					size="sm"
					variant="secondary"
					high-contrast={true}
				/>
			</div>
			<div className="multi-select-values">
				<ul>
					{values.map(item =>
						renderListItem(item, tableName, printableVersion, hasScript)
					)}
				</ul>
			</div>
			<sn-record-control-wrapper messages={messages} />
		</div>
	);
};

const renderListItem = (item, tableName, printableVersion, hasScript) => {
	printableVersion = hasScript ? 'hide-printable-buttons' : printableVersion;
	return (
		<li key={item.value} id={item.value}>
			{item.displayValue}
			<now-button-iconic
				className={printableVersion}
				id={item.value}
				icon="open-link-fill"
				variant="primary"
				bare
				size="sm"
				tooltipContent={t('{0}: Open record in new tab', item.displayValue)}
				append-to-payload={{
					action: OPEN_RECORD,
					id: item.value,
					table: tableName
				}}
			/>
		</li>
	);
};

const renderBrowseButton = (
	values = [],
	label,
	printableVersion,
	mandatory,
	isInvalid,
	messages,
	field
) => {
	if (values.length != 0) {
		return <Fragment />;
	}
	const dottedLineClass =
		printableVersion != '' ? '' : 'hide-printable-buttons';

	return (
		<div>
			<sn-record-control-wrapper
				label={label}
				required={isAttrTrue(mandatory)}
				invalid={isAttrTrue(isInvalid)}
				messages={messages}
				helperContent={getFieldAnnotation(field)}
			>
				<div className="multi-select-values">
					<span className="multi-select-icon">
						<now-icon
							className={printableVersion}
							icon="folder-open-fill"
							size="md"
						/>
					</span>
					<now-button-bare
						className={printableVersion}
						label={BROWSE}
						tooltipContent={BROWSE}
						configAria={{
							'aria-label': t('{0} {1}', BROWSE, label)
						}}
						variant="secondary"
						high-contrast={true}
					/>
					<span className={dottedLineClass}>--</span>
				</div>
			</sn-record-control-wrapper>
		</div>
	);
};

const renderModalContent = ({
	onLoadSysIds = [],
	field: {
		helpTag = '',
		instructions = '',
		name = '',
		label = SLUSH_RIGHT_LABEL,
		listTable = '',
		id,
		hasScript = ''
	},
	dispatch
}) => {
	const url = `multiple_select_slush_bucket.do?sysparm_loadIds=${onLoadSysIds.join()}&sysparm_reftablename=${listTable}&sysparm_questionname=${name}&sysparm_question_id=${id}&&sysparm_nopreload=true&sysparm_variable_list=${label}&sysparm_variable_collection=${SLUSH_LEFT_LABEL}&sysparm_has_script=${hasScript}`;
	return (
		<div className="sn-catalog-form-multiple-select-modal-content">
			<div className="sn-catalog-form-modal-content-headers">
				<now-heading level="3" variant="title-primary" label={helpTag} />
				<now-rich-text html={instructions} />
			</div>
			<iframe
				src={url}
				height="600px"
				width="100%"
				frameBorder="0"
				sandbox="allow-scripts allow-same-origin"
				id="SlushBucketFrame"
				title="SlushBucketFrame"
				on-load={() => {
					dispatch(IFRAME_LOADED);
				}}
			/>
		</div>
	);
};
