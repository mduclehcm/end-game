// Loader that replaces .map / .d.ts (and similar) with an empty module so they are not parsed as JS.
module.exports = () => "module.exports = {};";
