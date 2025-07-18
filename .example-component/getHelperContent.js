import react from '@servicenow/ui-renderer-react';
import { dangerouslyCreateElementFromString } from '@servicenow/ui-renderer-snabbdom';

export function getHelperTextForFormControls(content) {
    return (
        <div className='variable-annotation'
            dangerouslySetInnerHTML={{
                __html: content
            }}
        />
    )
}

export function getHelperContentForNDS(content) {
	return dangerouslyCreateElementFromString(
		`<div className='variable-annotation'>${content}</div>`
	)
}