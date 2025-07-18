/**
 * Group sequential numbers, i.e. [1,3,4,5,9,10] => [[1], [3,4,5], [9,10]]
 * @param {*} rows
 */
export const groupNumsSequentially = rows =>
	rows
		.sort((a, b) => a - b)
		.reduce((r, n) => {
			const lastSubArray = r[r.length - 1];

			if (!lastSubArray || lastSubArray[lastSubArray.length - 1] !== n - 1) {
				r.push([]);
			}

			r[r.length - 1].push(n);

			return r;
		}, []);
