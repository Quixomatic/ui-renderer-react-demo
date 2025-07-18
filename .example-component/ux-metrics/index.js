import track from "./track.js";
import { markTypes } from "./constants";
import { types } from "@servicenow/ui-metrics";

export default track;
export { markTypes, types };

if (globalThis.nowUiFrameworkMetrics)
	globalThis.nowUiFrameworkMetrics.track = track;
