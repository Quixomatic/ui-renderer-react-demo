/*
 * Proxy copied over from sn-uxf-builder-middleware
 * Doing this so we can avoid the overhead of npm installing all of that package
 * when we only really want this one function
 */
export default effect => coeffects => effect.effect(...effect.args, coeffects);
