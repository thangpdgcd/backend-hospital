// local-server.js
const app = require("./server");

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`MedStaff AI server running at http://localhost:${port}`);
});
