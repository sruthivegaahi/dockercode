const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");

const app = express();
app.use(bodyParser.json());
app.use("/api", routes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Code execution service running on port ${PORT}`);
});
