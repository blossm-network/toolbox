module.exports = (moment) => {
  const time = moment.second() + moment.minute() * 60 + moment.hour() * 3600;
  const day = moment.date();
  const month = moment.month();
  const year = moment.year();

  return {
    time,
    day,
    month,
    year,
  };
};
