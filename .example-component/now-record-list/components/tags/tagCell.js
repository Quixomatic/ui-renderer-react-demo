import {ARBITRARY_PILL_WIDTH, TRUNCATED, WRAP} from './constants';
import {createPillFromTag} from './tagRender';

export const getTagCell = (tags, rowId, wrap, width, dispatch) => {
	if (!tags || !tags.length) return null;

	const wrapClassName = wrap ? WRAP : TRUNCATED;
	const displayTags = getDisplayTags(tags, wrap, width);
	const ellipsis = displayTags.length < tags.length;
	return (
		<div className="sn-tags">
			<div className={`sn-tags-container ${wrapClassName}`}>
				{displayTags.map(pill =>
					createPillFromTag(
						{...pill, labelEntry: [pill.labelEntry], rowId: [rowId]},
						wrap,
						dispatch
					)
				)}
			</div>
			{ellipsis && <div className="sn-tags-ellipsis">...</div>}
		</div>
	);
};

//Returns all tags when wrap is enabled, else returns a new tag for every 100px Available
export const getDisplayTags = (tags, wrap, width) => {
	if (wrap) return tags;

	let numberOfTags = parseInt(width / ARBITRARY_PILL_WIDTH);
	numberOfTags = numberOfTags > 1 ? numberOfTags : 1;
	return tags.slice(0, numberOfTags);
};
