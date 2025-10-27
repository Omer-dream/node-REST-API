require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const socket = require("./utils/socket");

const feedRoutes = require("./routes/feed");
const rootDir = require("./utils/path");
const authRoutes = require("./routes/auth");

const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use("/images", express.static(path.join(rootDir, "uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/auth", authRoutes);
app.use("/feed", feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    const server = http.createServer(app);
    const io = socket.init(server);

    io.on("connection", (socket) => {
      console.log("New client connected");
      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });

    server.listen(8080);
    console.log("Connected to MongoDB and server is running on port 8080");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }
};

startServer();

// mongoose.connect('mongodb+srv://omerzebary841:XdAs2a3wsTRr6bEu@cluster0.tcgzslw.mongodb.net/react-node?retryWrites=true&w=majority&appName=Cluster0')
// .then(()=>{
//   app.listen(8080);
//     console.log('Connected to MongoDB and server is running on port 8080');
// })
// .catch((err)=>{
//  console.log( 'Error connecting to MongoDB:', err);
// })
