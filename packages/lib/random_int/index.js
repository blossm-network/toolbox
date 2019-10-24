module.exports = ({ min, max }) => {
  if (min >= max) return null;
  return Math.floor(Math.random() * (max - min)) + min;
};
