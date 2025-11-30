// api/index.js
const app = require("../app");

// Vercel sẽ gọi hàm này cho mỗi request
module.exports = (req, res) => {
  return app(req, res);
};
