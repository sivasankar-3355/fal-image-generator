import mongoose from 'mongoose';

const inferenceImageSchema = new mongoose.Schema({
    inference: { type: mongoose.Types.ObjectId, ref: "Inference" },
    imageURL: { type: String, required: true },
}, { timestamps: true })

export const InferenceImageModel = mongoose.model("InferenceImage", inferenceImageSchema);