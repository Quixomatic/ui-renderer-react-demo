const NEWER = Symbol('newer');
const OLDER = Symbol('older');

/**
 * A doubly linked list-based most recently used cache. It will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 */
export class Cache {
	/**
	 * Construct a new cache object which will hold up to limit entries.
	 * When the size == limit, a `put` operation will evict the oldest entry.
	 * If `entries` is provided, all entries are added to the new map.
	 *
	 * `entries` should be an Array or other iterable object whose elements are
	 *   key-value pairs (2-element Arrays). Each key-value pair is added to the new Map.
	 *   null is treated as undefined.
	 *
	 * @param limit
	 * @param entries
	 */
	constructor(limit, entries) {
		if (typeof limit !== 'number') {
			entries = limit;
			limit = 0;
		}

		/**
		 * Current number of items
		 * @type {number}
		 */
		this.size = 0;

		/**
		 * Maximum number of items this map can hold
		 * @type {number}
		 */
		this.limit = limit;

		/**
		 * Least recently-used entry. Invalidated when map is modified.
		 * @type {undefined}
		 */
		this.oldest = this.newest = undefined;

		/**
		 * Most recently-used entry. Invalidated when map is modified.
		 * @type {Map<any, any>}
		 * @private
		 */
		this._keymap = new Map();

		if (entries) {
			this.assign(entries);
			if (limit < 1) {
				this.limit = this.size;
			}
		}
	}

	_registerEntryAsUsed(entry) {
		if (entry === this.newest) {
			return;
		}

		if (entry[NEWER]) {
			if (entry === this.oldest) {
				this.oldest = entry[NEWER];
			}
			entry[NEWER][OLDER] = entry[OLDER];
		}
		if (entry[OLDER]) {
			entry[OLDER][NEWER] = entry[NEWER];
		}
		entry[NEWER] = undefined;
		entry[OLDER] = this.newest;
		if (this.newest) {
			this.newest[NEWER] = entry;
		}
		this.newest = entry;
	}

	/**
	 * Replace all values in this map with key-value pairs (2-element Arrays) from
	 * provided iterable.
	 *
	 * @param entries
	 */
	assign(entries) {
		let entry,
			limit = this.limit || 10;
		this._keymap.clear();
		let it = entries[Symbol.iterator]();

		for (let itv = it.next(); !itv.done; itv = it.next()) {
			let e = new Entry(itv.value[0], itv.value[1]);
			this._keymap.set(e.key, e);

			if (!entry) {
				this.oldest = e;
			} else {
				entry[NEWER] = e;
				e[OLDER] = entry;
			}
			entry = e;

			if (limit-- == 0) {
				throw new Error('overflow');
			}
		}

		this.newest = entry;
		this.size = this._keymap.size;
	}

	/**
	 * Get and register recent use of <key>. Returns the value
	 * associated with <key> or undefined if not in cache.
	 *
	 * @param key
	 * @returns {*}
	 */
	get(key) {
		// Find our cache entry
		const entry = this._keymap.get(key);

		// Not cached. Sorry.
		if (!entry) return;

		// As <key> was found in the cache, register it as being requested recently
		this._registerEntryAsUsed(entry);

		return entry.value;
	}

	/**
	 * Put <value> into the cache associated with <key>. Replaces any existing
	 * entry with the same key. Returns `this`.
	 *
	 * @param key
	 * @param value
	 * @returns {Cache}
	 */
	set(key, value) {
		let entry = this._keymap.get(key);

		if (entry) {
			// update existing
			entry.value = value;
			this._registerEntryAsUsed(entry);
			return this;
		}

		// new entry
		this._keymap.set(key, (entry = new Entry(key, value)));

		if (this.newest) {
			// link previous tail to the new tail (entry)
			this.newest[NEWER] = entry;
			entry[OLDER] = this.newest;
		} else {
			// first entry
			this.oldest = entry;
		}

		// add new entry to the end of the linked list -- newest entry.
		this.newest = entry;
		++this.size;

		if (this.size > this.limit) {
			// limit reached -- remove the head
			this.shift();
		}

		return this;
	}

	/**
	 * Purge the least recently used (oldest) entry from the cache. Returns the removed
	 * entry or undefined if the cache was empty.
	 *
	 * @returns {*[]}
	 */
	shift() {
		const entry = this.oldest;

		if (entry) {
			if (this.oldest[NEWER]) {
				// advance the list
				this.oldest = this.oldest[NEWER];
				this.oldest[OLDER] = undefined;
			} else {
				// the cache is exhausted
				this.oldest = undefined;
				this.newest = undefined;
			}

			// Removing last reference to <entry> and remove links from the purged
			// entry being returned:
			entry[NEWER] = entry[OLDER] = undefined;
			this._keymap.delete(entry.key);
			--this.size;
			return [entry.key, entry.value];
		}
	}

	/**
	 * Access value for <key> without registering recent use. Useful if you do not want to
	 * change the state of the map, but only "peek" at it.
	 * Returns the value associated with <key> if found, or undefined if not found.
	 *
	 * @param key
	 * @returns {*|undefined}
	 */
	find(key) {
		let e = this._keymap.get(key);
		return e ? e.value : undefined;
	}

	/**
	 * Check if there's a value for key in the cache without registering recent use.
	 * @param key
	 * @returns {boolean}
	 */
	has(key) {
		return this._keymap.has(key);
	}

	/**
	 * Remove entry <key> from cache and return its value. Returns the
	 * removed value, or undefined if not found.
	 *
	 * @param key
	 * @returns {*}
	 */
	delete(key) {
		const entry = this._keymap.get(key);

		if (!entry) return;
		this._keymap.delete(entry.key);

		if (entry[NEWER] && entry[OLDER]) {
			// relink the older entry with the newer entry
			entry[OLDER][NEWER] = entry[NEWER];
			entry[NEWER][OLDER] = entry[OLDER];
		} else if (entry[NEWER]) {
			// remove the link to us
			entry[NEWER][OLDER] = undefined;
			// link the newer entry to head
			this.oldest = entry[NEWER];
		} else if (entry[OLDER]) {
			// remove the link to us
			entry[OLDER][NEWER] = undefined;
			// link the newer entry to head
			this.newest = entry[OLDER];
		} else {
			// if(entry[OLDER] === undefined && entry.newer === undefined) {
			this.oldest = this.newest = undefined;
		}

		this.size--;
		return entry.value;
	}

	/**
	 * Removes all entries
	 */
	clear() {
		this.oldest = this.newest = undefined;
		this.size = 0;
		this._keymap.clear();
	}

	/**
	 * Returns an iterator over all keys, starting with the oldest.
	 * @returns {KeyIterator}
	 */
	keys() {
		return new KeyIterator(this.oldest);
	}

	/**
	 * Returns an iterator over all values, starting with the oldest.
	 * @returns {ValueIterator}
	 */
	values() {
		return new ValueIterator(this.oldest);
	}

	/**
	 * Returns an iterator over all entries, starting with the oldest.
	 * @returns {Cache}
	 */
	entries() {
		return this;
	}

	/**
	 * Returns an iterator over all entries, starting with the oldest.
	 *
	 * @returns {EntryIterator}
	 */
	[Symbol.iterator]() {
		return new EntryIterator(this.oldest);
	}

	/**
	 * Call `fun` for each entry, starting with the oldest entry.
	 *
	 * @param fun
	 * @param thisObj
	 */
	forEach(fun, thisObj) {
		if (typeof thisObj !== 'object') {
			thisObj = this;
		}
		let entry = this.oldest;
		while (entry) {
			fun.call(thisObj, entry.value, entry.key, this);
			entry = entry[NEWER];
		}
	}

	/**
	 * Returns a JSON (array) representation
	 *
	 * @returns {any[]}
	 */
	toJSON() {
		let s = new Array(this.size),
			i = 0,
			entry = this.oldest;
		while (entry) {
			s[i++] = {key: entry.key, value: entry.value};
			entry = entry[NEWER];
		}
		return s;
	}

	/**
	 * Returns a String representation
	 *
	 * @returns {string}
	 */
	toString() {
		let s = '',
			entry = this.oldest;
		while (entry) {
			s += String(entry.key) + ':' + entry.value;
			entry = entry[NEWER];
			if (entry) {
				s += ' < ';
			}
		}
		return s;
	}
}

/**
 * An entry holds the key and value, and pointers to any older and newer entries.
 * Entries might hold references to adjacent entries in the internal linked-list.
 * Therefore you should never store or modify Entry objects. Instead, reference the
 * key and value of an entry when needed.
 *
 * @param key
 * @param value
 * @constructor
 */
function Entry(key, value) {
	this.key = key;
	this.value = value;
	this[NEWER] = undefined;
	this[OLDER] = undefined;
}

function EntryIterator(oldestEntry) {
	this.entry = oldestEntry;
}

EntryIterator.prototype[Symbol.iterator] = function() {
	return this;
};
EntryIterator.prototype.next = function() {
	let ent = this.entry;
	if (ent) {
		this.entry = ent[NEWER];
		return {done: false, value: [ent.key, ent.value]};
	} else {
		return {done: true, value: undefined};
	}
};

function KeyIterator(oldestEntry) {
	this.entry = oldestEntry;
}

KeyIterator.prototype[Symbol.iterator] = function() {
	return this;
};
KeyIterator.prototype.next = function() {
	let ent = this.entry;
	if (ent) {
		this.entry = ent[NEWER];
		return {done: false, value: ent.key};
	} else {
		return {done: true, value: undefined};
	}
};

function ValueIterator(oldestEntry) {
	this.entry = oldestEntry;
}

ValueIterator.prototype[Symbol.iterator] = function() {
	return this;
};
ValueIterator.prototype.next = function() {
	let ent = this.entry;
	if (ent) {
		this.entry = ent[NEWER];
		return {done: false, value: ent.value};
	} else {
		return {done: true, value: undefined};
	}
};
