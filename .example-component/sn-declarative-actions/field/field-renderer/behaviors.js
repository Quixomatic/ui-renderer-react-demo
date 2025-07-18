import {createPreSourceBehavior} from 'sn-uxpage-presource';
import {get} from 'lodash';

const OPEN_FRAME = 'sn-component-openframe';
const openFrameDataPath = 'data.AppOpenframe_Query';

export const OPEN_FRAME_KEY = 'openFrameConfig';
export const openFrameBehavior = createPreSourceBehavior(OPEN_FRAME, {
	name: OPEN_FRAME_KEY,
	transform: data => get(data, openFrameDataPath, null)
});
