import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import filesRoutes from './src/routes/files.js';
import bodyParser from "body-parser";


const corsOptions ={
    origin: '*',
    credentials: true,
    allowCredentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus:200,
}

const app = express();

const connect = () => {
    mongoose.connect(process.env.MONGO)
            .then(() => {
                console.log("DB Connected");
            })
            .catch(err => {
                throw err;
            });
}

app.use(cors(corsOptions));
app.use(express.json({limit: '5mb'}));
app.use(bodyParser.json({limit: '5mb'}))
app.use("/files", filesRoutes)
app.get('/', (req,res) => {res.status(200).json('working!')});


app.listen(process.env.PORT || 8080, () => {
    console.log("Connected!");
    connect();
});