import '@servicenow/now-icon';
import {NOW_GRID_CLOSE_POPOVER} from '@servicenow/now-grid';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import startsWith from 'lodash/startsWith';

import {
	KEY_BACKSPACE,
	KEY_DELETE,
	KEY_ENTER,
	KEY_SPACE,
	KEY_SPACEBAR
} from '../../constants';
import getTooltip from '../../utils/tooltipUtil';

import {
	DELETE_TAG_LABEL_ENTRIES,
	LABEL,
	REMOVE,
	TAG_CLICKED,
	TAG_LIST_PILL_ARIA_DESCRIPTION,
	TAG_LIST_PILL_REMOVE_ARIA_DESCRIPTION,
	TRUNCATED,
	WRAP
} from './constants';

export const escapeSeismicSpecialSymbols = name =>
	startsWith(name, '@') ? `\\${name}` : name;

export const createPillFromTag = (tag, isPillContainerWrapped, dispatch) => {
	if (!tag) return null;

	const {sysId: tagId, name, canEdit, viewableBy, labelEntry, rowId} = tag;

	const pillAriaDescriptionId = `${tagId}-ally-description`;
	const label = escapeSeismicSpecialSymbols(name);
	const wrapClass = isPillContainerWrapped ? WRAP : TRUNCATED;

	const tagHandler = event => {
		const id = get(event, 'target.id', '');
		const eventType = event.type;

		if (!id || !eventType) return;

		let dispatchEvent = '';
		if (eventType === 'click') {
			dispatchEvent = id === LABEL ? TAG_CLICKED : DELETE_TAG_LABEL_ENTRIES;
		} else if (eventType === 'keydown') {
			if ([KEY_SPACE, KEY_SPACEBAR, KEY_ENTER].includes(event.key)) {
				event.preventDefault();
				event.stopPropagation();
				dispatchEvent = id === LABEL ? TAG_CLICKED : DELETE_TAG_LABEL_ENTRIES;
			} else if ([KEY_BACKSPACE, KEY_DELETE].includes(event.key)) {
				dispatchEvent = DELETE_TAG_LABEL_ENTRIES;
			}
		}

		if (dispatchEvent) {
			const payload =
				dispatchEvent === DELETE_TAG_LABEL_ENTRIES
					? {recordSysIds: rowId, labelEntrySysIds: labelEntry}
					: {tagId, name, canEdit, viewableBy};
			if (dispatchEvent === TAG_CLICKED) {
				dispatch(NOW_GRID_CLOSE_POPOVER);
			}
			dispatch(dispatchEvent, payload);
		}
	};

	return (
		<Fragment>
			<div
				className={`sn-tag ${wrapClass}`}
				aria-describedby={pillAriaDescriptionId}>
				<span className="sn-tag-container">
					<button
						className="sn-tag-label"
						id={LABEL}
						type="button"
						aria-pressed="false"
						on-click={event => tagHandler(event)}
						onkeydown={event => tagHandler(event)}>
						<span className="now-line-height-crop">
							<span
								data-truncation
								className="tag-label"
								title={label}
								id={LABEL}>
								{label}
							</span>
						</span>
					</button>

					<span className="sn-tag-button-iconic">
						<button
							className="tag-button"
							type="button"
							aria-label={`${REMOVE} ${label}`}
							aria-disabled="false"
							title=""
							id="dismiss-button"
							aria-describedby={`remove-${pillAriaDescriptionId}`}
							on-click={event => tagHandler(event)}
							onkeydown={event => tagHandler(event)}
							data-tooltip={REMOVE}
							{...getTooltip(dispatch)}>
							<now-icon
								icon="close-fill"
								size="sm"
								id="dismiss-icon"></now-icon>
						</button>
						<span
							className="now-a11y-label"
							id={`remove-${pillAriaDescriptionId}`}>
							{TAG_LIST_PILL_REMOVE_ARIA_DESCRIPTION}
						</span>
					</span>
				</span>
			</div>
			<span className="now-a11y-label" id={pillAriaDescriptionId}>
				{TAG_LIST_PILL_ARIA_DESCRIPTION}
			</span>
		</Fragment>
	);
};
