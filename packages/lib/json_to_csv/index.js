const { Parser } = require("json2csv");

module.exports = ({ data, fields }) => new Parser({ fields }).parse(data);
