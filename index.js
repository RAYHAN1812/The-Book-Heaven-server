import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketServer } from "socket.io";
import http from "http";
import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("./firebase-admin-key.json");
import bookRoutes from "./routes/bookRoutes.js";
import commentSocketHandler from "./socket/comments.js";

dotenv.config();

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (e) {
  if (e.code !== "app/duplicate-app") {
    console.error(e.message);
    process.exit(1);
  }
}

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map(o => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

const uri = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

app.use("/api", bookRoutes);

app.get("/", (req, res) => {
  res.send("Book-Heaven Server is Running!");
});

const startServer = async () => {
  await connectDB();
  const server = http.createServer(app);

  const io = new SocketServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  commentSocketHandler(io);

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
