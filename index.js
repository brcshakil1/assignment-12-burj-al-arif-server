const express = require("express");
const app = express();

const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

// middlewares
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Burj Al Arif is running");
  console.log("hello world");
});

app.listen(port, () => {
  console.log(`Burj Al Arif is listening on ${port}`);
});
