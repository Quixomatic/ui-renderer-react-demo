import {isEmpty} from '@devsnc/snowdash';
import {isObject} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';

var nodeStore = (function() {
	let dataByNode = new Map();

	return {
		get: function(nodeId, path) {
			if (!dataByNode.get(nodeId)) return undefined;
			try {
				const data = dataByNode.get(nodeId);
				return path ? get(data, path) : data;
			} catch (e) {
				return undefined;
			}
		},
		set: function(nodeId, dataOrKeyPath, value) {
			if (isEmpty(dataOrKeyPath)) return;

			if (isObject(dataOrKeyPath)) {
				dataByNode.set(nodeId, dataOrKeyPath);
				return;
			}

			const paths = dataOrKeyPath.split('.', 2); //only allow 2 levels
			let data = dataByNode.get(nodeId) || {};
			if (paths.length > 1)
				data[paths[0]] = {
					...data[paths[0]],
					[paths[1]]: value
				};
			else data[paths[0]] = value;
			dataByNode.set(nodeId, data);
		},
		clear: function(nodeId) {
			dataByNode.delete(nodeId);
		}
	};
})();

export default nodeStore;
