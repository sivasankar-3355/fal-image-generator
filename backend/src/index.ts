import express from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import dotenv from 'dotenv'
import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import { fal } from '@fal-ai/client'

import { CharacterModel } from './db/character.model.js'
import { InferenceModel } from './db/inference.model.js'
import { InferenceImageModel } from './db/inference-image.model.js'

import { trainCharacter, generateImageFromPrompt } from './services/fal-ai.js'
import { zipImages } from './services/zipper.js'

import { validate } from './middlewares.js'
import { generateImageFromPromptSchema, trainSchema } from './types.js'
import { maxFileSizeTrainingImage, imagesCountForTraining, trainingImagesBucketName, trainingImagesDestinationFolder, falAiStatus, falTrainingModel, falInferenceModel } from './constants.js'

dotenv.config()
const app = express()
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxFileSizeTrainingImage,
        files: imagesCountForTraining
    }
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/**-------------------------Routes------------------------- */

/**-------------------------Training------------------------- */

app.post('/train', upload.array('images'), validate(trainSchema), async (req, res) => {
    let localZipPath = ''
    try {
        const images = req.files as Express.Multer.File[]
        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                msg: 'No images uploaded'
            })
        }

        // Create zip file
        localZipPath = await zipImages(images)

        // Upload zip file to Google Cloud Storage
        const storage = new Storage({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
        })
        const bucket = storage.bucket(trainingImagesBucketName)
        await bucket.upload(localZipPath, {
            destination: trainingImagesDestinationFolder
        });

        const googleCloudZipPath = `${trainingImagesDestinationFolder}/${localZipPath}`

        // Train character
        const { request_id } = await trainCharacter(googleCloudZipPath, storage)

        const { name, age, gender, ethinicity, eyeColor, isBald } = req.body
        const character = await CharacterModel.create({
            name,
            age,
            gender,
            ethinicity,
            eyeColor,
            isBald,
            trainingImagesZipPath: googleCloudZipPath,
            status: falAiStatus.PENDING,
            falAiRequestId: request_id ? request_id.toString() : ''
        })

        fs.unlink(localZipPath, (err) => {
            if (err) {
                console.error(`Failed to delete local zip file at ${localZipPath}`)
            }
        })

        res.status(201).json({
            msg: 'training',
            data: {
                character: character._id,
            }
        })
    } catch (error) {
        if (localZipPath) {
            fs.unlink(localZipPath, (err) => {
                if (err) {
                    console.error(`Failed to delete local zip file at ${localZipPath}`)
                }
            })
        }
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'training failed'
        })
    }
})

app.post('/post-training-callback', async (req, res) => {
    try {
        const { request_id, status } = req.body
        const character = await CharacterModel.findOne({ falAiRequestId: request_id }, { _id: 1 })
        if (!character) {
            return res.status(404).json({
                msg: 'character not found'
            })
        }

        const result = await fal.queue.result(falTrainingModel, request_id)

        await CharacterModel.updateOne(
            { _id: character._id },
            {
                $set: {
                    status: status === 'COMPLETED' ? falAiStatus.COMPLETED : falAiStatus.FAILED,
                    tensorURL: result.data.diffusers_lora_file.url
                }
            })


        res.status(200).json({
            msg: 'training callback received'
        })
    } catch (error) {
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'training callback failed'
        })
    }
})

// poll from frontend
app.get('/check-training-status', async (req, res) => {
    try {
        const { characterId } = req.query
        if (!characterId) {
            return res.status(400).json({
                msg: 'character id is required'
            })
        }

        const character = await CharacterModel.findOne({ _id: new mongoose.Types.ObjectId(characterId.toString()) }, { _id: 1, status: 1 })
        if (!character) {
            return res.status(404).json({
                msg: 'character not found',
                data: {
                    status: 'FAILED'
                }
            })
        }
        res.status(200).json({
            msg: 'training status checked',
            data: {
                status: character.status === 1 ? 'PENDING' : character.status === 2 ? 'COMPLETED' : 'FAILED'
            }
        })
    } catch (error) {
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'training status check failed'
        })
    }
})

app.get('/characters', async (req, res) => {
    try {
        const characters = await CharacterModel.find({}, { _id: 1, name: 1 })
        res.status(200).json({
            msg: 'characters fetched',
            data: {
                characters
            }
        })
    } catch (error) {
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'fetching characters failed'
        })
    }
})

/**-------------------------Inference------------------------- */

app.post('/inference', validate(generateImageFromPromptSchema), async (req, res) => {
    try {
        const { prompt, character, count } = req.body
        const characterDoc = await CharacterModel.findOne({ _id: character }, { _id: 1, tensorURL: 1 })
        if (!characterDoc || !characterDoc.tensorURL) {
            return res.status(404).json({
                msg: 'character not found'
            })
        }

        const { request_id } = await generateImageFromPrompt(prompt, characterDoc.tensorURL, count)

        const inferenceDoc = await InferenceModel.create({
            character: new mongoose.Types.ObjectId(character),
            falAiRequestId: request_id ?? '',
            prompt: String(prompt).trim(),
            status: falAiStatus.PENDING,
            count,
        })

        res.status(201).json({
            msg: 'generate',
            data: {
                inferenceId: inferenceDoc._id
            }
        })
    } catch (error) {
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'generate failed'
        })
    }

})

app.post('/post-inference-callback', async (req, res) => {
    try {
        const { request_id, status } = req.body
        const inference = await InferenceModel.findOne({ falAiRequestId: request_id }, { _id: 1 })
        if (!inference) {
            return res.status(404).json({
                msg: 'inference not found'
            })
        }

        await InferenceModel.updateOne(
            { _id: inference._id },
            {
                $set: {
                    status: status === 'COMPLETED' ? falAiStatus.COMPLETED : falAiStatus.FAILED,
                }
            })

        if (status === 'COMPLETED') {
            const result = await fal.queue.result(falInferenceModel, request_id)
            const inferenceImageDocs = []

            for (const image of result.data.images) {
                inferenceImageDocs.push({
                    inference: inference._id,
                    imageURL: image.url
                })
            }

            await InferenceImageModel.insertMany(inferenceImageDocs)
        }

        res.status(200).json({
            msg: 'inference callback received'
        })
    } catch (error) {
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'inference callback failed'
        })
    }
})

// poll from frontend
app.get('/check-inference-status', async (req, res) => {
    try {
        const { inferenceId } = req.query
        if (!inferenceId) {
            return res.status(400).json({
                msg: 'inference id is required'
            })
        }

        const inference = await InferenceModel.findOne({ _id: new mongoose.Types.ObjectId(inferenceId?.toString()) }, { _id: 1, status: 1 })
        if (!inference) {
            return res.status(404).json({
                msg: 'inference not found',
                data: {
                    status: 'FAILED'
                }
            })
        }
        res.status(200).json({
            msg: 'inference status checked',
            data: {
                status: inference.status === 1 ? 'PENDING' : inference.status === 2 ? 'COMPLETED' : 'FAILED'
            }
        })
    } catch (error) {
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'inference status check failed'
        })
    }
})

app.get('/load-inferences', async (req, res) => {
    try {
        const { inferenceId } = req.query
        if (!inferenceId) {
            return res.status(400).json({
                msg: 'inference id is required'
            })
        }

        const inference = await InferenceModel.findOne({ _id: new mongoose.Types.ObjectId(inferenceId?.toString()) }, { _id: 1, status: 1, prompt: 1, character: 1 })
        if (!inference || inference.status !== falAiStatus.COMPLETED) {
            return res.status(404).json({
                msg: 'inference not found',
                data: {}
            })
        }

        const inferenceImageDocs = await InferenceImageModel.find({ inference: inference._id }, { _id: 1, imageURL: 1 })
        const inferenceImages = inferenceImageDocs.map(doc => doc.imageURL)

        const character = await CharacterModel.findOne({ _id: inference.character }, { name: 1 })

        res.status(200).json({
            msg: 'inference status checked',
            data: {
                images: inferenceImages,
                prompt: inference.prompt,
                characterName: character?.name ?? ''
            }
        })
    } catch (error) {
        console.error(`An error occurred at ${req.path}`)
        console.error(error)
        res.status(500).json({
            msg: 'inference status check failed'
        })
    }
})



// Test endpoint for local image upload
// app.get('/test-upload', async (req, res) => {
//     let zipPath = ''
//     try {
//         const imagesDir = path.join(process.cwd(), 'images', 'WhatsApp Unknown 2025-12-31 at 18.58.48')
//         const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg'))

//         // Convert local files to multer file format
//         const multerFiles: Express.Multer.File[] = files.map(filename => {
//             const filePath = path.join(imagesDir, filename)
//             const buffer = fs.readFileSync(filePath)
//             return {
//                 buffer,
//                 originalname: filename,
//                 fieldname: 'images',
//                 encoding: '7bit',
//                 mimetype: 'image/jpeg',
//                 size: buffer.length
//             } as Express.Multer.File
//         })

//         // Zip the images
//         zipPath = await zipImages(multerFiles)

//         // Upload to Google Cloud
//         const googleCloudProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID || ''
//         const googleCloudKeyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || ''
//         const storage = new Storage({
//             projectId: googleCloudProjectId,
//             keyFilename: googleCloudKeyFile,
//         })
//         const bucket = storage.bucket(trainingImagesBucketName)
//         const uploadResult = await bucket.upload(zipPath, {
//             destination: `${trainingImagesDestinationFolder}/test-${Date.now()}.zip`
//         })

//         fs.unlinkSync(zipPath)

//         res.json({
//             msg: 'Upload successful',
//             filesProcessed: files.length,
//             zipPath,
//             gcsBucket: trainingImagesBucketName,
//             gcsPath: uploadResult[0].name
//         })
//     } catch (error) {
//         if (zipPath) {
//             fs.unlinkSync(zipPath)
//         }

//         console.log('Test upload failed:', error)
//         res.status(500).json({
//             msg: 'Test upload failed',
//             error: error instanceof Error ? error.message : 'Unknown error'
//         })
//     }
// })

/**-------------------------Routes end------------------------- */

app.listen(3000, async () => {
    try {
        const mongoUri = process.env.MONGO_URI
        const googleCloudProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID
        const googleCloudKeyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS

        if (!mongoUri || !googleCloudProjectId || !googleCloudKeyFile) {
            throw new Error('Missing environment variables')
        }

        console.log('MongoDB URI:', mongoUri)
        console.log('Google Cloud Project ID:', googleCloudProjectId)
        console.log('Google Cloud Key File:', googleCloudKeyFile)

        await mongoose.connect(mongoUri)
        console.log('MongoDB connected')
    } catch (error) {
        console.error('An error occurred while bootstrapping the app')
        console.error(error)
    }
})
