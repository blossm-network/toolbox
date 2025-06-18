import moment from "moment";

//Months are zero indexed, days are not.
export default ({ year, month, day, time }) => {
  const m = moment().utc();
  m.year(year).month(month);
  m.date(Math.min(day, m.daysInMonth()));
  m.startOf("day");
  m.add(time, "seconds");
  return m;
};
