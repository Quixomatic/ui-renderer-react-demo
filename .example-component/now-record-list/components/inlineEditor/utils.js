import {t} from 'sn-translate';

export const getInlineAnnotations = (
	numRecords,
	numEditableRecords,
	numVerifiedRecords
) => {
	const messages = [];

	if (numEditableRecords === 0) {
		if (numRecords > 1)
			messages.push(t('Security prevents writing to these fields.'));
		else messages.push(t('Security prevents writing to this field.'));
	}

	if (numEditableRecords > 1) {
		messages.push(t('{0} record(s) will be updated.', numEditableRecords));
	}

	if (numEditableRecords && numEditableRecords !== numRecords) {
		const numNotUpdated = numRecords - numEditableRecords;
		messages.push(
			t('{0} record(s) will not be updated due to security.', numNotUpdated)
		);
	}

	if (numRecords !== numVerifiedRecords) {
		const numNotVerified = numRecords - numVerifiedRecords;
		messages.push(
			t('{0} record(s) do not have a valid reference.', numNotVerified)
		);
	}

	return messages.map(message => <p>{message}</p>);
};
