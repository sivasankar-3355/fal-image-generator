import mongoose from 'mongoose';
import { genders, ethinities, eyeColors } from '../types.js';
import { falAiStatus } from '../constants.js';

const characterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, enum: genders, required: true },
    age: { type: Number, required: true },
    ethinicity: { type: String, enum: ethinities, required: true },
    eyeColor: { type: String, enum: eyeColors, required: true },
    isBald: { type: Boolean, required: true },
    status: { type: Number, enum: Object.values(falAiStatus), default: falAiStatus.PENDING },
    tensorURL: { type: String }, // Populated after the webhook is triggered
    trainingImagesZipPath: { type: String, required: true },
    falAiRequestId: { type: String, required: true }
}, { timestamps: true })

export const CharacterModel = mongoose.model("Character", characterSchema);  