import dotenv from 'dotenv'
dotenv.config()

export const maxFileSizeTrainingImage = 1024 * 1024 * 5
export const imagesCountForTraining = 10
export const trainingImagesDestinationFolder = 'training-images'
export const trainingImagesBucketName = 'image-generator-images'
export const falAiStatus = {
    PENDING: 1,
    COMPLETED: 2,
    FAILED: 3
}
export const falTrainingModel = 'fal-ai/flux-lora-fast-training'
export const falInferenceModel = 'fal-ai/flux-lora'
export const apiBasePath = `${process.env.ENVIRONMENT === 'development' ? `http://localhost:${process.env.PORT}` : ''}`

