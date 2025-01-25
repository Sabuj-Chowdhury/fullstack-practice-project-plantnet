require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

const port = process.env.PORT || 9000;
const app = express();
// middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i53p4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // db
    const db = client.db("plant_store");
    const plantsCollection = db.collection("plants");
    const userCollection = db.collection("user");
    const orderCollection = db.collection("orders");

    // Generate jwt token
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    // Logout
    app.get("/logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    // save user data in db
    app.post("/users/:email", async (req, res) => {
      const email = req.params.email;
      const users = req.body;
      const query = { email };
      const isExist = await userCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      }
      const result = await userCollection.insertOne({
        ...users,
        timeStamp: Date.now(),
        role: "customer",
      });
      res.send(result);
    });

    // mange user role and request
    app.patch("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      if (!user || user.status === "requested") {
        return res.status(400).send({
          message: "Already requested!Please wait for the decision.",
        });
      }
      const updateDoc = {
        $set: {
          status: "requested",
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // get user role
    app.get("/user/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    // sava a plant data in the DB
    app.post("/plant", verifyToken, async (req, res) => {
      const plant = req.body;
      const result = await plantsCollection.insertOne(plant);
      res.send(result);
    });

    // Homepage get all plants data
    app.get("/plants", async (req, res) => {
      const result = await plantsCollection.find().limit(20).toArray();
      res.send(result);
    });

    // get plant details by id
    app.get("/plant/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantsCollection.findOne(query);
      res.send(result);
    });

    // save order info in the db
    app.post("/orders", verifyToken, async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // manage quantity
    app.patch("/plants/quantity/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { quantityNum, status } = req.body;
      let updateDoc = {
        $inc: {
          quantity: -quantityNum,
        },
      };
      if (status === "increase") {
        updateDoc = {
          $inc: {
            quantity: quantityNum,
          },
        };
      }
      const result = await plantsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get all orders for specific logged in user
    // app.get("/orders/:email", verifyToken, async (req, res) => {
    //   const email = req.params.email;
    //   const query = {
    //     "customer.email": email,
    //   };
    //   const result = await orderCollection.find(query).toArray();
    //   res.send(result);
    // });

    // get all orders for specific logged in user using aggregation
    app.get("/orders/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await orderCollection
        .aggregate([
          {
            $match: {
              "customer.email": email, //Match specific customers data only by email
            },
          },
          {
            $addFields: {
              plantId: { $toObjectId: "$plantId" }, //convert plantId string field to objectId field
            },
          },
          {
            $lookup: {
              // go to a different collection and look for data
              from: "plants", // collection name
              localField: "plantId", // local data that need to match
              foreignField: "_id", // foreign field name of that same data
              as: "plants", // return the data as plants array (array naming)
            },
          },
          {
            $unwind: "$plants", // unwind lookup result, return without array
          },
          {
            $addFields: {
              // add these fields in order object
              image: "$plants.image",
              name: "$plants.name",
              category: "$plants.category",
            },
          },
          {
            // remove plants object property from order object
            $project: {
              plants: 0,
            },
          },
        ])
        .toArray();
      res.send(result);
    });

    // cancel/delete order
    app.delete("/order/delete/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const order = await orderCollection.findOne(query);
      if (order.status === "delivered") {
        return res
          .status(409)
          .send({ message: "Can not delete once delivered" });
      }
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from plantNet Server..");
});

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`);
});
