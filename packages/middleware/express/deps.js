const { json } = require("body-parser");
const cookieParser = require("cookie-parser");

exports.jsonBodyParser = json;
exports.cookieParser = cookieParser;
