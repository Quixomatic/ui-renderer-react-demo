import '../../../components/emptyContentArea/emptyContentArea';
import '../overlay/components/loadingOverlay';
import {templateDefaults} from '@servicenow/now-grid';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';

export const renderTable = context => {
	const {
		properties: {
			options: {
				recordData: {
					hideEmptyStateImage,
					listModel,
					listModel: {
						layoutQuery: {queryRows = []}
					},
					listType,
					headingLevel
				}
			}
		}
	} = context;

	return (
		<Fragment>
			{templateDefaults.table(context)}
			{listModel && !queryRows.size ? (
				<sn-record-list-state-empty
					hideEmptyStateImage={hideEmptyStateImage}
					listType={listType}
					headingLevel={headingLevel}
				/>
			) : null}
		</Fragment>
	);
};
