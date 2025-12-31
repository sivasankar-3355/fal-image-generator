import { fal } from '@fal-ai/client'
import { Storage } from '@google-cloud/storage'

import { trainingImagesBucketName, falTrainingModel, falInferenceModel, apiBasePath } from '../constants.js'

export const trainCharacter = async (zipPath: string, storageInstance: Storage) => {
    try {
        const [signedUrl] = await storageInstance.bucket(trainingImagesBucketName).file(zipPath).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        })

        const { request_id } = await fal.queue.submit(falTrainingModel, {
            input: {
                images_data_url: signedUrl,
            },
            webhookUrl: `${apiBasePath}/post-training-callback`
        })

        return { request_id }
    } catch (error) {
        console.error(`An error occurred at trainCharacter() zipPath: ${zipPath}`)
        console.error(error)
        return { request_id: null }
    }
}

export const generateImageFromPrompt = async (prompt: string, tensorURL: string, count: number) => {
    try {
        const { request_id } = await fal.queue.submit(falInferenceModel, {
            input: {
                prompt: prompt.trim(),
                loras: [
                    { path: tensorURL, scale: 1 }
                ],
                num_images: count
            },
            webhookUrl: `${apiBasePath}/post-inference-callback`
        })

        return { request_id }
    } catch (error) {
        console.error(`An error occurred at generateImageFromPrompt() prompt: ${prompt}`)
        console.error(error)
        return { request_id: null }
    }
}