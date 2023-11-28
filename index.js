const express = require("express");
const app = express();

const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

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

    // agreement collection
    const agreementsCollection = client
      .db("burjAlArifDB")
      .collection("agreements");

    // users collection
    const usersCollection = client.db("burjAlArifDB").collection("users");

    // announcements collections
    const announcementsCollection = client
      .db("burjAlArifDB")
      .collection("announcements");

    // coupons collections
    const couponsCollections = client.db("burjAlArifDB").collection("coupons");

    // auth related api
    // login
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // admin related apis
    // get admin
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // apartments related apis
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

    // users related apis
    // get all users
    app.get("/users", async (req, res) => {
      const role = req.query.role;
      let query = {};
      // user by role member
      if (role === "member") {
        query.role = role;
      }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // get a user
    app.patch("/users/:email", async (req, res) => {
      const userEmail = req.params.email;
      console.log(userEmail);
      const filter = { email: userEmail };
      const updateUser = req.body;
      console.log(updateUser);
      const updatedDoc = {
        $set: {
          role: updateUser?.role,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // save and modify user name, email and role in DB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      console.log("User found?------->", isExist);

      if (isExist) return res.send(isExist);
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timeStamp: Date.now() },
        },
        options
      );
      res.send(result);
    });

    // agreements related apis
    // all agreements
    app.get("/agreements", async (req, res) => {
      const status = req.query.status;
      console.log(status);
      let query = {};
      // agreement by status pending
      if (status === "pending") query.status = status;
      const result = await agreementsCollection.find(query).toArray();
      res.send(result);
    });

    // post agreement
    app.post("/agreements", async (req, res) => {
      const agreementInfo = req.body;
      const result = await agreementsCollection.insertOne(agreementInfo);
      res.send(result);
    });

    // update agreement status
    app.patch("/agreements/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateStatus = req.body;
      const updatedDoc = {
        $set: {
          status: updateStatus?.status,
          confirmationDate: updateStatus?.confirmationDate,
        },
      };
      const result = await agreementsCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.delete("/agreements-rejected/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await agreementsCollection.deleteOne(query);
      res.send(result);
    });

    // Announcement apis
    // get
    app.get("/agreements", async (req, res) => {
      const result = await agreementsCollection.find().toArray();
      res.send(result);
    });
    // post
    app.post("/announcements", async (req, res) => {
      const agreementInfo = req.body;
      const result = await announcementsCollection.insertOne(agreementInfo);
      res.send(result);
    });

    // Coupons apis
    // get all coupons
    app.get("/coupons", async (req, res) => {
      const result = await couponsCollections.find().toArray();
      res.send(result);
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
