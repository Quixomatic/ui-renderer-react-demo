export const deepSearchElement = (selector, root = document.body) => {
	let queue = [root];
	while (queue.length > 0) {
		const top = queue.shift();
		const ele = top.querySelector(selector);
		if (ele) return ele;

		const topShadow = top.shadowRoot;
		if (topShadow) queue.push(topShadow);
		const allSearched = top.querySelectorAll('*');
		for (let i = 0; i < allSearched.length; i++) {
			if (allSearched[i].shadowRoot) queue.push(allSearched[i].shadowRoot);
		}
	}
};
