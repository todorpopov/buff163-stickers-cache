const express = require('express')
const service = require('./service')
const cron = require('node-cron')
const app = express()
const port = 3000


let stickers = []
const file = service.parseFile('./stickerids.txt') 

app.get("/", async(req, res) => {
    res.send({msg: "A dedicated Express API that scrapes, stores, and updates sticker prices"})
})

app.get("/start_queue", (req, res) => {
    service.cycleQueue(file, stickers)
    res.send({msg: "Queue has been started"})
})

app.get("/api/:stickerName", (req, res) => {
    const name = req.params.stickerName
    const price = service.checkPrice(stickers, name)
    res.send({name: name, price: price})
})

app.get("/api/fetch/:itemCode", async (req, res) => {
    const itemCode = req.params.itemCode
    const stickerPrice = await service.fetchStickerPrice(itemCode)
    res.send({code: itemCode, price: stickerPrice})
})

app.get("/array", (req, res) => {
    res.send(stickers)
})

app.listen(port, () => {
    console.log(`Started on port: ${port} | Date: ${new Date()}`)
})

cron.schedule('0 0 * * *', () => {
    service.cycleQueue(file, stickers)
})