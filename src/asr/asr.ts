import {OpenAI} from "openai"
import fs from "fs";
import {streamWriteData} from "../utils/handler_utils";

let openAi: any = null

function InitOpenAi() {
    openAi = new OpenAI()
}

async function Asr(path: string, res: any) {
    let transcription
    try {
        transcription = await openAi.audio.transcriptions.create({
            file: fs.createReadStream(`${path}`),
            model: "whisper-1",
            response_format: "verbose_json",
            prompt: `The audio provided may be empty or very short, do not make up words to fill in extended times of silence.`,
        })

        // @ts-ignore
        console.log(`the language is ${transcription.language}`)
        console.log(`The transcription is:`)
        console.log(transcription.text)

        streamWriteData(res, {
            from: 'user',
            text: transcription.text,
            // @ts-ignore
            language: transcription.language
        })

        return transcription
    } catch (e) {
        return null
    }
}

export {
    InitOpenAi, Asr
}