export function difference(arr1, arr2) {
    return arr1.filter(x => !arr2.includes(x));
}

export function camelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0) return ''; // ignore 0s
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

export function keys(obj) {
    return Object.keys(obj);
}

export function pick(obj, props) {
    return props.reduce((acc, prop) => {
        if (obj.hasOwnProperty(prop)) {
            acc[prop] = obj[prop];
        }
        return acc;
    }, {});
}

export function forEach(collection, callback) {
    if (Array.isArray(collection)) {
        for (let i = 0; i < collection.length; i++) {
            callback(collection[i], i, collection);
        }
    } else {
        for (const key in collection) {
            if (collection.hasOwnProperty(key)) {
                callback(collection[key], key, collection);
            }
        }
    }
}

export function get(obj, path, defaultValue) {
    const keys = Array.isArray(path) ? path : path.split('.');
    const result = keys.reduce((acc, key) => acc && acc[key], obj);
    return result === undefined ? defaultValue : result || defaultValue;
}

export function isNil(value) {
    return value == null;
}

export function isEqualWith(value, other, customizer) {
    if (typeof customizer !== 'function') {
        customizer = undefined;
    }

    const result = customizer ? customizer(value, other) : undefined;

    if (result !== undefined) {
        return Boolean(result);
    }
    if (value === other) {
        return true;
    }
    if (value == null || other == null || typeof value !== 'object' || typeof other !== 'object') {
        return false;
    }
    const keys = Object.keys(value);
    if (keys.length !== Object.keys(other)
        .length) {
        return false;
    }
    return keys.every(key => isEqualWith(value[key], other[key], customizer));
}

export function pickBy(object, predicate) {
    const result = {};
    for (const key in object) {
        if (object.hasOwnProperty(key) && predicate(object[key], key)) {
            result[key] = object[key];
        }
    }
    return result;
}

export function identity(value) {
    return value;
}
