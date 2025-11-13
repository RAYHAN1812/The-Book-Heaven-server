import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { createRequire } from "module";
import bookRoutes from "./routes/bookRoutes.js";
import connectDB from "./connectDB.js";

dotenv.config();

const require = createRequire(import.meta.url);
const serviceAccount = require("./firebase-admin-key.json");

try {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) {
  if (e.code !== "app/duplicate-app") {
    console.error(e.message);
    process.exit(1);
  }
}

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = process.env.CLIENT_URL.split(",").map(url => url.trim());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"]
}));

//app.options("*", cors());
app.use(express.json());
app.use("/api", bookRoutes);

app.get("/", (req, res) => res.send("Book-Heaven Server is Running!"));

const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
