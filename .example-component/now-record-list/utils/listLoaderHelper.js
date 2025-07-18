import '../components/listLoader/listLoader';

export const renderSpinnerContainer = size => (
	<div className="sn-list-loading-container">
		<sn-record-list-loader className="loader-container" size={size} />
	</div>
);
