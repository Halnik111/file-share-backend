import express from "express";
import {upload, getFiles} from "../controllers/file.js";

const router = express.Router();

router.post('/upload', upload);
router.get('/get/:id', getFiles);

export default router;