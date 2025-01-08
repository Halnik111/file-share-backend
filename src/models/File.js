import mongoose from "mongoose";

const filesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    folders: {
        type: [Object],
    },
    files: {
        type: [Object],
    }
}, {timestamps: true});

export default mongoose.model("Files", filesSchema, "files");