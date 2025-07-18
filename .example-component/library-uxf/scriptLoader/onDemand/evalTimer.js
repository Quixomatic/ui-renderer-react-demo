const evalTimers = [];

export default class EvalTimer {
	constructor() {
		this.start = Date.now();
		this.end = undefined;
		this.sub = 0;
		evalTimers.push(this);
	}

	addSubTime(time) {
		this.sub += time;
	}

	totalTime() {
		if (this.end) {
			return this.end - this.start;
		}
		return Date.now() - this.start;
	}

	getTime() {
		return this.totalTime() - this.sub;
	}

	stop() {
		this.end = Date.now();
		evalTimers.pop();
		evalTimers.forEach((timer) => timer.addSubTime(this.getTime()));
	}
}
