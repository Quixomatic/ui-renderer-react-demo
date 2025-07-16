import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';

// Import the React components so they register themselves
import './components/shadcn-example';

const view = (state, { updateState }) => {
	const {
		showShadcnExample = false
	} = state;

	return (
		<div className="tf-form-container">
			<h1>TurboForge Form v2</h1>
			<p>Hybrid Snabbdom + React Component with External UI Libraries</p>

			<div className="form-controls">
				<button
					className="btn btn-primary"
					on-click={() => updateState({ showShadcnExample: !showShadcnExample })}
				>
					{showShadcnExample ? 'Hide' : 'Show'} shadcn/ui Example
				</button>
			</div>

			{showShadcnExample && (
				<div className="react-component-container">
					<h3>External UI Library Example (shadcn/ui style)</h3>
					<p>This demonstrates how external UI libraries work within ServiceNow's shadow DOM:</p>
					<shadcn-example title="Shadow DOM UI Components" />
				</div>
			)}

			<div className="state-preview">
				<h3>Current State:</h3>
				<pre>{JSON.stringify({ showShadcnExample }, null, 2)}</pre>
			</div>
		</div>
	);
};

createCustomElement('x-312987-tf-form-v-2', {
	renderer: { type: snabbdom },
	view,
	styles,
	initialState: {
		showShadcnExample: true
	}
});
