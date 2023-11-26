const express = require("express");
const app = express();

const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// middlewares
app.use(express.json());
app.use(cors());

// mongodb

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ufgx0zu.mongodb.net/?retryWrites=true&w=majority`;

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-scj1kyz-shard-00-00.ufgx0zu.mongodb.net:27017,ac-scj1kyz-shard-00-01.ufgx0zu.mongodb.net:27017,ac-scj1kyz-shard-00-02.ufgx0zu.mongodb.net:27017/?ssl=true&replicaSet=atlas-ts3tkk-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // all apartments collection
    const apartmentsCollection = client
      .db("burjAlArifDB")
      .collection("apartments");

    // get all apartments
    app.get("/apartments", async (req, res) => {
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;

      const result = await apartmentsCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalApartments =
        await apartmentsCollection.estimatedDocumentCount();
      res.send({ result, totalApartments });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Burj Al Arif is running");
});

app.listen(port, () => {
  console.log(`Burj Al Arif is listening on port: ${port}`);
});
