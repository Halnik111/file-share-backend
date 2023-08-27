import mongoose from "mongoose";

const filesSchema = new mongoose.Schema({
    takenIds: {
        type: [Number],
        required: true,
    }
}, {timestamps: true});

export default mongoose.model("Temp_file-share_overview", filesSchema);