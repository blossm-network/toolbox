const { expect } = require("chai");

const { momentFromComponents } = require("..");

describe("Converts correctly", () => {
  it("it should return the correct moment", async () => {
    const time = 68837;
    const day = 31;
    const month = 4;
    const year = 2019;
    const components = {
      time,
      day,
      month,
      year,
    };
    const moment = momentFromComponents(components);

    const secondsInDay =
      moment.hours() * 3600 + moment.minutes() * 60 + moment.seconds();
    expect(secondsInDay).to.equal(time);
    expect(moment.date()).to.equal(day);
    expect(moment.month()).to.equal(month);
    expect(moment.year()).to.equal(year);
  });
});
