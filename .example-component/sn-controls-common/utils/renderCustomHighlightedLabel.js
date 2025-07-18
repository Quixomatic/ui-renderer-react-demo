import {isEmpty} from "lodash";
import { t } from 'sn-translate';
import {createCustomElement, createPresentationalCustomElement} from "@servicenow/ui-core";
import '@servicenow/now-highlighted-value';
import '@servicenow/now-button';
import '@servicenow/now-popover';
import '@servicenow/now-icon';

import style from "@devsnc/sass-form-controls-common/_customLabel.scss";
import {NOW_BUTTON_ICONIC_CLICKED, NOW_POPOVER_OPENED_SET, FIELD_RECOMMENDATION_INFORMATION} from "../constants";
import { fieldLayoutSchema } from "../schemas";

export const popoverDescription = ({properties}) => {
	const { description, icon } = properties;
	return (
		<div className="sn-custom-highlighted-label-popover spacing">
			<div className="sn-custom-highlighted-label-popover-description">
				<div>
					<now-icon icon={icon} size="sm"></now-icon>
				</div>
				<div>
					{description}
				</div>
			</div>
			<div className="sn-custom-highlighted-label-popover-close">
				<now-button-iconic icon="close-fill" size="sm" variant="tertiary" bare="true"></now-button-iconic>
			</div>
		</div>
	)
}

createPresentationalCustomElement('sn-highlighted-label-info', {
	view: popoverDescription,
	styles: style,
	properties: {
		description: { default: ''},
		icon: { default: ''}
	}
})

export const customLabel = (state) => {
	const {
		opened,
		properties: {
			customHighlightedLabel: {
				value: highlightedValueLabel,
				status,
				showIcon,
				variantName,
				colorName,
				iconName,
				description
			},
			fieldLayout: {
				layout = 'vertical'
			} = {}
		}
	} = state;
	return (
		<div class={{
			'sn-custom-highlighted-label': true,
			['-' + layout]: layout
		}}>
			<now-highlighted-value
				label={highlightedValueLabel}
				color={colorName}
				show-icon={showIcon}
				variant={variantName}
				icon={showIcon ? iconName : null}
				status={!colorName ? status : null}
			></now-highlighted-value>
			{!isEmpty(description) && (
				<now-popover
					manage-opened
					opened={opened}
					interactionType="dialog"
					constrain={{width: 250, minHeight: 80, maxHeight: 200}}
					positions={{ target: 'top-center', content: 'bottom-center' }}
				>
					<now-button-iconic
						bare
						variant="tertiary"
						slot="trigger"
						config-aria={{
							button: { 'aria-label': t(FIELD_RECOMMENDATION_INFORMATION) }
						}}
						icon="circle-info-outline"
						size="sm">
					</now-button-iconic>
					<sn-highlighted-label-info slot="content" description={description} icon={iconName} />
				</now-popover>
			)}
		</div>
	);
}

createCustomElement('sn-custom-highlighted-label', {
	view: customLabel,
	styles: style,
	initialState: {
		opened: false
	},
	properties: {
		customHighlightedLabel: { default: {} },
		fieldLayout: {
			default: { layout: 'vertical' },
			schema: fieldLayoutSchema
		}
	},
	actionHandlers: {
		[NOW_BUTTON_ICONIC_CLICKED]: {
			effect: ({ updateState }) => {
				updateState({ opened: false });
			},
			stopPropagation: true
		},
		[NOW_POPOVER_OPENED_SET]: {
			effect: ({ action, updateState }) => {
				const { value } = action.payload;
				updateState({ opened: value });
			},
			stopPropagation: true
		}
	}
})
