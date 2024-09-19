import {streamWriteData} from "../utils/handler_utils";
import {Readable} from 'node:stream'
import * as PlayHT from 'playht';
import {events} from 'fetch-event-stream'

const useTts = process.env.PLAYHT_API_KEY && process.env.PLAYHT_USER_ID && process.env.PLAYHT_API_KEY !== '' && process.env.PLAYHT_USER_ID !== ''

if (useTts) {
    PlayHT.init({
// @ts-ignore
        apiKey: process.env.PLAYHT_API_KEY,
// @ts-ignore
        userId: process.env.PLAYHT_USER_ID,
    });
}

const stream2buffer = (stream: NodeJS.ReadableStream): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        if (!stream.readable) return resolve(Buffer.concat([]))

        const buffers: any = []

        const onData = (d: any) => buffers.push(d)

        const onEnd = (error: any) => {
            error ? reject(error) : resolve(Buffer.concat(buffers))
            clean()
        }

        const onClose = () => {
            resolve(Buffer.concat(buffers))
            clean()
        }

        const clean = () => {
            stream.removeListener('data', onData)
            stream.removeListener('end', onEnd)
            stream.removeListener('error', onEnd)
            stream.removeListener('close', onClose)
        }

        stream.on('data', onData)
        stream.on('end', onEnd)
        stream.on('error', onEnd)
        stream.on('close', onClose)
    })
}

const aiaConfig = {
    prompt: process.env.PROMPT,
    llm_server: process.env.LLM_SERVER,
    voice: process.env.VOICE_CLONE_ID
}

const completionHandler = async (aia: string, message: string, history: string, res: any) => {
    if (!aiaConfig) {
        console.error(`AIA config not found for ${aia}`)
        streamWriteData(res, {
            from: 'assistant',
            text: `AIA config not found for ${aia}`
        })
        res.end()
        return
    }
    // console.log(`start completion: ${startTime}`)
    const prompt = aiaConfig.prompt

    const messages = []
    messages.push({
        role: 'system',
        content: prompt
    })

    messages.push({
        role: 'user',
        content: message
    })

    const reqCompletion = await fetch(`https://${aiaConfig.llm_server}/v1/chat/completions`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "Llama-3-8B-Instruct",
            messages: messages,
            stream: true
        })
    })

    if (reqCompletion.ok) {
        let stream = events(reqCompletion, null)
        const textStream = new Readable({
            async read() {
                for await (const message of stream) {
                    if (!message.data || message.data === '[DONE]')
                        break

                    const data = JSON.parse(message.data)
                    const delta = data.choices[0].delta.content
                    this.push(delta)
                    streamWriteData(res, {
                        from: 'assistant',
                        text: delta,
                        type: 'token'
                    })
                }
                this.push(null)
            }
        })

        let audioStream
        try {
            audioStream = await PlayHT.stream(textStream, {
                voiceEngine: "PlayHT2.0-turbo",
                voiceId: aiaConfig.voice,
                outputFormat: 'mp3',
                sampleRate: 44100,
                speed: 1
            })
            const buffer = await stream2buffer(audioStream)
            const base64 = buffer.toString('base64')
            streamWriteData(res, {
                from: 'assistant',
                type: 'audio',
                audio: base64
            })
        } catch (e) {
            console.error(e)
        }

        streamWriteData(res, {
            from: 'assistant',
            type: 'end'
        })
    } else {
        console.log(reqCompletion)
    }

    res.end()
}

export default completionHandler