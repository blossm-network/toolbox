import deps from "./deps.js";

export default ({ data, fields }) => new deps.Parser({ fields }).parse(data);
