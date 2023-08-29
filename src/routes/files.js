import express from "express";
import {uploadFiles, getFiles} from "../controllers/file.js";

const router = express.Router();

router.post('/upload', uploadFiles);
router.get('/get/:id', getFiles);

export default router;