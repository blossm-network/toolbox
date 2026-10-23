import moment from "moment";

export default (string, offset) => moment(string).utcOffset(offset).format();
