function checkPrice(stickersArray, name){
    let result = 0
    stickersArray.forEach(item => {
        if(item.name === name){
            result = item.price
        }
    })
    return result
}

function parseFile(filename){
    const path = require('path')
    const fs = require('fs')
    const filePath = path.join(process.cwd(), filename)

    const fileContent = []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const splitLines = data.split('\n')
        for(let i = 0; i < splitLines.length; i++) {
            const splitLine = splitLines[i].split(';')
            fileContent.push(splitLine[0])
        }
    } catch (err) {
        console.error(err);
    }
    return fileContent
}

async function fetchStickerObject(stickerCode){
    const url = `https://buff.163.com/api/market/goods/sell_order?game=csgo&goods_id=${stickerCode}`
    const options = {
        method: 'GET',
        headers: {Accept: '*/*'}
    }

    const stickerInfo = await fetch(url, options).then(res => res.text()).catch(err => console.error(err))

    let infoJSON = {}
    let stickerName = ""
    let stickerPrice = 0
    try{
        infoJSON = JSON.parse(stickerInfo)

        const stickerGoodsInfo = infoJSON.data.goods_infos[`${stickerCode}`]
        stickerName = stickerGoodsInfo.name
        stickerPrice = stickerGoodsInfo.steam_price_cny
    }catch(error){
        console.log(stickerCode + ': ' + error)
        return
    }
    
    return { code: stickerCode, name: stickerName, price: stickerPrice }
}

async function stickerPrice(stickerCode, stickersArray){
    const start = performance.now()

    const stickerObject = await fetchStickerObject(stickerCode)

    for(let i = 0; i < stickersArray.length; i++){
        if(stickersArray[i].code === stickerObject.code){
            if(stickersArray[i].price !== stickerObject.price || stickersArray[i].name !== stickerObject.name){
                stickersArray[i].price = stickerObject.price
                stickersArray[i].name = stickerObject.name
                console.log(`\nUpdated the price or name for code: ${stickersArray[i].code}`)
                return
            }
        }
    }
    
    stickersArray.push(stickerObject)
    
    const end = performance.now()
    console.log(`\n---Append---\nItem code: ${stickerCode}\nItem name: ${stickerObject.name}\nPrice: ${stickerObject.price}\nTime: ${(end-start).toFixed(2)} ms`)
}

function shuffleQueue(queue) {
    let currentIndex = queue.length,  randomIndex;
  
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--
  
        [queue[currentIndex], queue[randomIndex]] = [queue[randomIndex], queue[currentIndex]]
    }
}

async function cycleQueue(queueArray, stickersArray){
    for(itemCode of queueArray){
        await stickerPrice(itemCode, stickersArray)
        await new Promise(resolve => setTimeout(resolve, 5000))
    }
    shuffleQueue(queueArray)
}

module.exports = {checkPrice, parseFile, fetchStickerObject, stickerPrice, shuffleQueue, cycleQueue}