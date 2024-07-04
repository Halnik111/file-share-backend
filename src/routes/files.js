import express from "express";
import {uploadFiles, getFiles, getFileTest,} from "../controllers/file.js";


const router = express.Router();

router.post('/upload', uploadFiles);
router.get('/get/:id', getFiles);
router.get('/get/single/:id', getFileTest)

export default router;