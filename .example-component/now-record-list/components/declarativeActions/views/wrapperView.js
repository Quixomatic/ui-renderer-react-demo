import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import '@servicenow/now-scripting-ui-components';

const DeclarativeActionsWrapper = state => {
	const {
		properties: {
			hideDeclarativeActions,
			toolbarProps,
			declarativeActions,
			daModel,
			isWorkspace,
			dynamicEvaluationEnabled,
			table,
			parentTable,
			parentRecordSysId,
			selectedRecords,
			editedRecords,
			cellUpdatedOn,
			recordSysIds,
			allRecordsSelected,
			conditions,
			refreshRequested
		},
		actionBarWidth
	} = state;

	return actionBarWidth ? (
		<Fragment>
			<sn-record-list-header-toolbar {...toolbarProps} />
			{!hideDeclarativeActions && declarativeActions?.length ? (
				<now-record-common-uiactionbar
					actionNodes={declarativeActions}
					daModel={daModel}
					isWorkspace={isWorkspace}
					shouldEvaluateDynamicConditions={dynamicEvaluationEnabled}
					shouldContinueDaPropagation={true}
					width={actionBarWidth}
					modelData={
						dynamicEvaluationEnabled
							? {
									model: 'list',
									table,
									parentTable,
									parentRecordSysId,
									selectedRecords,
									editedRecords,
									cellUpdatedOn,
									recordSysIds,
									conditions: allRecordsSelected
										? `${daModel.selectionQuery}^${conditions}`
										: '',
									listRefresh: refreshRequested,
									daRelayPropName: 'actionNodes'
							  }
							: {}
					}
				/>
			) : null}
		</Fragment>
	) : null;
};

export default DeclarativeActionsWrapper;
