module.exports = ({ title, min }) => {
  const text = `${title ||
    "Number"} should be more than ${min}. Give this another try with a bigger number.`;

  return text;
};
