import { Parser } from "@json2csv/plainjs";

export default ({ data, fields }) => new Parser({ fields }).parse(data);
