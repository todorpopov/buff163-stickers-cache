const express = require('express')
const app = express()
const port = 3000

const path = require('path')
const fs = require('fs')

let stickers = []

app.get("/", async(req, res) => {
    res.send({msg: "A dedicated Express API that scrapes, stores, and updates sticker prices"})
})

app.get("/start_queue", (req, res) => {
    cycleQueue()
    res.send({msg: "Queue has been started"})
})

app.get("/api/:stickerName", (req, res) => {
    const name = req.params.stickerName
    const price = checkPrice(name)
    res.send({name: name, price: price})
})

app.get("/api/fetch/:itemCode", async (req, res) => {
    const itemCode = req.params.itemCode
    const stickerPrice = await fetchStickerPrice(itemCode)
    res.send({code: itemCode, price: stickerPrice})
})

app.get("/array", (req, res) => {
    res.send([...stickers])
})

app.get("/length", (req, res) => {
    res.send(String(stickers.length))
})

app.listen(port, () => {
    console.log(`Started on port: ${port} | Date: ${new Date()}`)
})



function checkPrice(name){
    let result = 0
    stickers.forEach(item => {
        if(item.name === name){
            result = item.price
        }
    })
    return result
}

function parseFile(){
    const filePath = path.join(process.cwd(), './stickerids.txt')

    const fileContent = []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const splitLines = data.split('\n')
        for(let i = 0; i < splitLines.length; i++) {
            const splitLine = splitLines[i].split(';')
            fileContent.push({
                code: splitLine[0],
                name: splitLine[1]
            })
        }
    } catch (err) {
        console.error(err);
    }
    return fileContent
}


async function fetchStickerPrice(stickerCode){
    const url = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${stickerCode}&page_num=1`

    let stickerInfo = await fetch(url, {method: 'GET'}).then(res => res.text()).catch(err => console.error('\n\nerror: ' + err)) || {}
    if(stickerInfo[0] === "<"){
        console.log(stickerInfo)
        return
    }else{
        stickerInfo = JSON.parse(stickerInfo)
    }

    if(stickerInfo.code !== "OK"){ 
        console.log(`\n\nReturned status code: ${stickerInfo.code}`)
        return 
    }

    const price = stickerInfo.data.goods_infos[`${stickerCode}`].steam_price_cny
    return price
}

async function stickerPrice(itemObject){
    const start = performance.now()

    const averagePrice = await fetchStickerPrice(itemObject.code)
    
    for(let i = 0; i < stickers.length; i++){
        if(stickers[i].name === itemObject.name){
            stickers[i].price = averagePrice
            console.log(`\nUpdated the price for an existing sticker!\nName: ${stickers[i].price} | New Price: ${averagePrice}`)
            return
        }
    }
    
    stickers.push({
        name: itemObject.name,
        price: averagePrice
    })
    
    const end = performance.now()
    console.log(`\n---Append---\nItem code: ${itemObject.code}\nItem name: ${itemObject.name}\nPrice: ${averagePrice}\nTime: ${(end-start).toFixed(2)} ms`)
}


function shuffleQueue() {
    let currentIndex = file.length,  randomIndex;
  
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [file[currentIndex], file[randomIndex]] = [
        file[randomIndex], file[currentIndex]];
    }
}

const file = parseFile() 

async function cycleQueue(){
    for(const item of file){
        await stickerPrice(item)
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    shuffleQueue()
}