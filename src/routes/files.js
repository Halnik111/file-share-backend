import express from "express";
import {uploadFiles, getFiles, getFilesFromDB,} from "../controllers/file.js";


const router = express.Router();

router.post('/upload', uploadFiles);
router.get('/get/:id', getFiles);
router.get('/get/db/:id', getFilesFromDB);

export default router;