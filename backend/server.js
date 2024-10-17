import express from "express";
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDb.js"

import authRoutes from "./routes/auth-routes.js";
import { connect } from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log(process.env.MONGO_URI);

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})