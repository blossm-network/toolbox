const randomInt = require("@sustainers/random-int");

module.exports = length => {
  let numberString = "";
  for (let i = 0; i < length; i++) {
    //Don't lead a zero;
    let min = i == 0 ? 1 : 0;
    let nextInt = randomInt({ min, max: 10 }).toString(10);
    numberString = numberString.concat(nextInt);
  }
  return parseInt(numberString);
};
