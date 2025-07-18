import { Fragment } from '@servicenow/ui-renderer-snabbdom'
import '@servicenow/now-tooltip';
import '@servicenow/now-button';
import '@servicenow/now-icon';

function isAttrTrue(val) {
	return val === true || val === 'true';
}

const oldIconToEDSIcon = {
	search: 'magnifying-glass-outline',
	phone: 'phone-outline',
	'info-circle': 'info-circle-outline'
};

const getIcon = old => oldIconToEDSIcon[old] || old;

const view = state => {
	const {
		properties: {
			icon: iconProp,
			disabled = false,
			variant = 'tertiary',
			size = 'sm',
			bare = true,
			iconic = false,
			configAria = {},
			reverseIconPlacement,
			label,
			tooltip
		}
	} = state;

	let icon = getIcon(iconProp);

	let ButtonComponent = 'now-button';
	if (bare && iconic) {
		ButtonComponent += '-iconic';
	}

	let children = reverseIconPlacement ? (
		<Fragment>
			{label && <span className="now-line-height-crop">{label}</span>}

			{!iconic && icon && (
				<now-icon
					className="now-button-icon"
					icon={icon}
					size={size}
					aria-hidden="true"
				/>
			)}
		</Fragment>
	) : undefined;

	return (
		<ButtonComponent
			label={label}
			size={size}
			icon={icon}
			icon-name={icon}
			icon-start={icon}
			disabled={isAttrTrue(disabled) ? true : undefined}
			variant={variant}
			bare={bare}
			tooltipContent={tooltip}
			config-aria={{
				// handles when tooltip is undefined
				'aria-label': tooltip || '',
				// allow for explicit overrides of aria-label
				...configAria
			}}
		>
			{children}
		</ButtonComponent>
	);
};

export default view;
