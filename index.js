import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import filesRoutes from './src/routes/files.js';
import bodyParser from "body-parser";
import morgan from "morgan";


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

app.use(morgan('combined'));
app.use(cors(corsOptions));
app.use(express.json({limit: '15mb'}));
app.use(bodyParser.json({limit: '15mb'}))
app.use("/files", filesRoutes)
app.get('/', (req,res) => {res.status(200).json('working!@!')});


const port = Number(process.env.PORT || 3001);
app.listen(port, "0.0.0.0", () => {
    console.log("Connected! " + port);
    //connect();
});