const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`🚀 Code Executor service running on port ${PORT}`);
});
