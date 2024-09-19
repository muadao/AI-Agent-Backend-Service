import dotenv from "dotenv"

dotenv.config()

import express from "express";
import multer, {diskStorage} from "multer";
import fs from "fs";
import completionHandler from "./handlers/chat_handler";
import cors from 'cors'
import {InitOpenAi, Asr} from "./asr/asr";

//process.env.PLAYHT_API_KEY
console.log(`playht api key: ${typeof (process.env.PLAYHT_API_KEY)}`)
console.log(`playht api key: ${process.env.PLAYHT_API_KEY}`)

function main() {
    const app = express()
    app.use(cors({origin: '*'}))
    const port = process.env.PORT || 4242

    const upload = multer({
        storage: diskStorage({
            destination: '/tmp/uploads/',
            filename: (req, file, cb) => {
                cb(null, Date.now() + file.originalname.slice(file.originalname.lastIndexOf('.'), file.originalname.length))
            }
        })
    })

    const cleanUpUploadedAudio = (path: string) => {
        try {
            fs.unlink(path, err => {
                if (err)
                    console.error(err)
            })
        } catch (e) {
            console.log(`error cleaning up uploaded audio: ${e}`)
        }
    }

    const setStream = (res: any) => {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache no-transform')
        res.setHeader('Connection', 'keep-alive')
        res.flushHeaders()
    }

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== '') {
        InitOpenAi()
        app.post('/completions/stream/audio',
            upload.single('audio'),
            async (req, res) => {
                try {
                    setStream(res)
                    const aia = req.body['aia']
                    const history = req.body['history']
                    console.log(`extracted aia: ${aia}, history: ${history} from request`)
                    const asrResult = await Asr(req.file?.path!, res)
                    cleanUpUploadedAudio(req.file?.path!)
                    if (asrResult) {
                        await completionHandler(aia, asrResult.text, history, res)
                    } else {
                        res.end()
                    }
                } catch (e) {
                    console.error(e)
                    cleanUpUploadedAudio(req.file?.path!)
                } finally {
                    if (!req.file?.path)
                        return
                    fs.access(req.file?.path, fs.constants.F_OK, (err) => {
                        if (!err) cleanUpUploadedAudio(req.file?.path!)
                    })
                }
            }
        )
    }

    app.post('/completions/stream', upload.none(), async (req, res) => {
        const aia = req.body['aia']
        const history = req.body['history']
        const message = req.body['message']

        try {
            setStream(res)
            await completionHandler(aia, message, history, res)
        } catch (e) {
            console.error(e)
        }
    })

    app.listen(port)
    console.log('Listening on port ' + port)

    console.log('service started')
}

main()