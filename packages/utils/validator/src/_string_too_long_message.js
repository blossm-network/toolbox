module.exports = ({ title, max }) => {
  const text =
    (title || "Number") +
    " should be less than " +
    max +
    " characters. Give this another try after cutting some words.";

  return text;
};
