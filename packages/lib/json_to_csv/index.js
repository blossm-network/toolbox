const { Parser } = require("@json2csv/plainjs");

module.exports = ({ data, fields }) => new Parser({ fields }).parse(data);
