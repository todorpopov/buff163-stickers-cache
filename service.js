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

    let price = 0
    try{
        price = stickerInfo.data.goods_infos[`${stickerCode}`].steam_price_cny
    }catch(err){
        console.log(err)
        return
    }
    
    return price
}

async function stickerPrice(itemObject, stickersArray){
    const start = performance.now()

    const averagePrice = await fetchStickerPrice(itemObject.code)
    
    for(let i = 0; i < stickersArray.length; i++){
        if(stickersArray[i].name === itemObject.name){
            stickersArray[i].price = averagePrice
            console.log(`\nUpdated the price for sticker: ${stickersArray[i].name}\n Old Price: ${stickersArray[i].price} | New Price: ${averagePrice}`)
            return
        }
    }
    
    stickersArray.push({
        name: itemObject.name,
        price: averagePrice
    })
    
    const end = performance.now()
    console.log(`\n---Append---\nItem code: ${itemObject.code}\nItem name: ${itemObject.name}\nPrice: ${averagePrice}\nTime: ${(end-start).toFixed(2)} ms`)
}

function shuffleQueue(queue) {
    let currentIndex = queue.length,  randomIndex;
  
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [queue[currentIndex], queue[randomIndex]] = [
        queue[randomIndex], queue[currentIndex]];
    }
}

async function cycleQueue(queueArray, stickersArray){
    for(item of queueArray){
        await stickerPrice(item, stickersArray)
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    shuffleQueue(queueArray)
}

module.exports = {checkPrice, parseFile, fetchStickerPrice, stickerPrice, shuffleQueue, cycleQueue}