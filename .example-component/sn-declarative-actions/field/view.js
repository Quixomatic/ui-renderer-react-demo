import '../mediator';
import './field-renderer';

export function isClassicForm(formData = {}) {
	// Just doing this for now to unblock us. Will clean up later
	// eslint-disable-next-line no-prototype-builtins
	if (!formData.hasOwnProperty('classicForm')) return true;
	return formData.classicForm || false;
}

const view = ({properties}) => {
	const {formData} = properties;
	const classicForm = isClassicForm(formData);

	return (
		<sn-declarative-mediator
			should-wrap-action={!classicForm}
			should-append-action-event={!classicForm}>
			<sn-declarative-field-action-renderer {...properties} />
		</sn-declarative-mediator>
	);
};

export default view;
