module.exports = () => {
  return async (req, res) => {
    res
      .cookie(
        "${process.env.SERVICE}-session",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV != "local"
        }
      )
      .status(204)
      .send();
  };
};
