import moment from "moment";
const { utc } = moment;

export default () => {
  const date = new Date();
  return utc(date.getTime());
};
