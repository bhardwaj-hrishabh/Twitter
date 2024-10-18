import express from "express";
import dotenv from "dotenv";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import connectMongoDB from "./db/connectMongoDb.js"
import authRoutes from "./routes/auth-routes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log(process.env.MONGO_URI);

app.use(express.json()); // to parse req.body
app.use(express.urlencoded({extended: true})); //to parse from data(url)

app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})