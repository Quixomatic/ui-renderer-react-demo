import '@servicenow/now-loader';
import {t} from 'sn-translate';
import Modal from '../modal-wrapper';

const SN_RECORD_CONTENT_TREE_CONNECTED_MODAL_CLOSE_CLICKED_ACTION =
	'SN_RECORD_CONTENT_TREE_CONNECTED#MODAL_CLOSE_CLICKED_ACTION';
const SN_RECORD_CONTENT_TREE_CONNECTED_MODAL_ADD_CLICKED_ACTION =
	'SN_RECORD_CONTENT_TREE_CONNECTED#MODAL_ADD_CLICKED_ACTION';

const actions = [
	{
		label: t('Close'),
		variant: 'primary',
		tooltipContent: t('Close'),
		bare: true,
		clickActionType: SN_RECORD_CONTENT_TREE_CONNECTED_MODAL_CLOSE_CLICKED_ACTION
	},
	{
		label: t('Add'),
		variant: 'primary',
		tooltipContent: t('Add'),
		clickActionType: SN_RECORD_CONTENT_TREE_CONNECTED_MODAL_ADD_CLICKED_ACTION
	}
];

const RenderContentTreeConnected = props => {
	// import('@devsnc/sn-record-content-tree-connected');
	const {
		dependentField,
		displayFooter,
		domainId,
		fieldName,
		isGlideList,
		referenceTable,
		tableName,
		targetValue,
		treePickerConfig
	} = props;

	return (
		<div
			className={`tree-container ${isGlideList ? `tree-container-multi` : ''} ${
				displayFooter ? 'tree-container-with-footer' : ''
			}`}>
			<sn-record-content-tree-connected
				tableName={tableName}
				fieldName={fieldName}
				referenceTable={referenceTable}
				dependentField={dependentField}
				dependentValue={targetValue}
				treePickerConfig={treePickerConfig}
				domainId={domainId}
				query={treePickerConfig.queryString}
				select={isGlideList ? 'multi' : 'single'}
			/>
		</div>
	);
};

const RenderListConnectedReference = props => {
	// import('@servicenow/now-record-list-connected');
	const {
		componentId,
		chars,
		encodedRecord,
		fieldName,
		ignoreDepAsRefQual,
		label,
		recordSysId,
		referenceTable,
		serializedChanges,
		tableName,
		referenceKey
	} = props;
	return (
		<div className="list-container">
			<now-record-list-connected-reference
				component-id={`${componentId}_modal_refList`}
				chars={chars || '**'}
				ignore-ref-qual={false}
				list-title={label}
				record-sys-id={recordSysId}
				field={fieldName}
				table={tableName}
				serializedChanges={serializedChanges}
				encodedRecord={encodedRecord}
				ignoreDepAsRefQual={ignoreDepAsRefQual}
				refTableName={referenceTable}
				referenceKey={referenceKey}
			/>
		</div>
	);
};

export default ({
	properties: {
		fieldName,
		tableName,
		recordSysId,
		label,
		serializedChanges,
		encodedRecord,
		componentId,
		referenceTable,
		ignoreDepAsRefQual = false,
		dependentField,
		fieldType,
		referenceKey,
		chars
	},
	active,
	componentLoading,
	fetchingTreePicker,
	treePickerConfig,
	domainId
}) => {
	const {isSupported: isTreePicker, targetValue} = treePickerConfig;
	const isGlideList = fieldType === 'glide_list';
	const displayFooter = isTreePicker && isGlideList;
	const footerActions = displayFooter ? actions : undefined;

	return (
		<Modal
			opened={active}
			size="lg"
			header-label={label}
			component-id={`${componentId}_modal`}
			footerActions={footerActions}>
			{fetchingTreePicker || componentLoading ? (
				<div
					className={`loader-container ${isGlideList ? `loader-container-multi` : ''} ${
						displayFooter ? 'loader-container-with-footer' : ''
					}`}>
					<now-loader />
				</div>
			) : isTreePicker ? (
				<RenderContentTreeConnected
					displayFooter={displayFooter}
					isGlideList={isGlideList}
					tableName={tableName}
					fieldName={fieldName}
					referenceTable={referenceTable}
					dependentField={dependentField}
					targetValue={targetValue}
					treePickerConfig={treePickerConfig}
					domainId={domainId}
				/>
			) : (
				<RenderListConnectedReference
					componentId={componentId}
					label={label}
					recordSysId={recordSysId}
					fieldName={fieldName}
					tableName={tableName}
					serializedChanges={serializedChanges}
					encodedRecord={encodedRecord}
					ignoreDepAsRefQual={ignoreDepAsRefQual}
					referenceTable={referenceTable}
					referenceKey={referenceKey}
					chars={chars}
				/>
			)}
		</Modal>
	);
};
