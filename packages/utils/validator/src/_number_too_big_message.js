module.exports = ({ title, max }) => {
  const text =
    (title || "Number") +
    " should be less than " +
    max +
    ". Give this another try with a smaller number.";

  return text;
};
