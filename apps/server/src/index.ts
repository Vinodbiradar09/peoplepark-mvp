import 'dotenv/config';
import cors from "cors";
import http from "http";
import express, { Request, Response } from "express";
import { roomRouter } from './r';
const app = express();
const server = http.createServer(app);

app.use(cors({
    origin : process.env.WEB_URL,
    credentials : true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use("/api/v1/rooms" , roomRouter);

const PORT = process.env.PORT || 4000;
server.listen(PORT , ()=>{
    console.log(`server is running at http://localhost:${PORT}`);
})
