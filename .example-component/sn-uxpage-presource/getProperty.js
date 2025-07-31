import get from 'lodash/get';

const getProperty = (propertyName, defaultValue = null) => get(window, `ux_globals.sysprops['${propertyName}']`, defaultValue);

export default getProperty;
