export default (path, key) => (path == undefined ? key : `${path}.${key}`);
