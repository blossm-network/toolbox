module.exports = (number1, number2) => {
  if (!number1 || !number2) {
    return false;
  }
  return number1 === number2;
};
