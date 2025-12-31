import mongoose from "mongoose";

const packSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    prompt: { type: String, required: true },
    sampleImageURL: { type: String }
}, { timestamps: true })

export const PackModel = mongoose.model("Pack", packSchema);