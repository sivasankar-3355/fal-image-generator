import mongoose from 'mongoose';
import { falAiStatus } from '../constants.js';

const inferenceSchema = new mongoose.Schema({
    character: { type: mongoose.Types.ObjectId, ref: "Character" },
    prompt: { type: String },
    pack: { type: mongoose.Types.ObjectId, ref: "Pack" },
    status: { type: Number, enum: Object.values(falAiStatus), default: falAiStatus.PENDING },
    count: { type: Number, default: 1, required: true },
    falAiRequestId: { type: String, required: true }
}, { timestamps: true })

export const InferenceModel = mongoose.model("Inference", inferenceSchema);