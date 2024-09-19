const streamWriteData = (res: any, data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export {
    streamWriteData
}