import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser'
import puppeteer from 'puppeteer';
import latinize from 'latinize';
import cron from 'node-cron'
import { promises as fs } from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const port = 3000

var nbaToday = {}
var nflToday = {}
var cfbToday = {}
var mlbToday = {}



class SportInformation {
    constructor(statTypes, keyStats, tableLink, imageTemplateLink, specialParams){
        this.statTypes = statTypes
        this.keyStats = keyStats
        this.tableLink = tableLink
        this.imageTemplateLink = imageTemplateLink
        this.todaysData = {}
        this.specialParams = specialParams
    }
};

// *** FOR KICKERS, SOMETIMES THEIR STAT IS NULL, MAKE SURE WHEN ACTUALLY SELECTING THE STAT AND APPLYING IT TO THE OBJ THE NULL BECOMES 0

const nbaStatTypes = [[8, "Minutes Played"], [9, "Field Goals"], [12, "3-Point Field Goals"], 
[14, "3-Point Field Goal Percentage"], [15, "2-Point Field Goals"],  [21, "Free Throw Percentage"], 
[24, "Rebounds"], [25, "Assists"], [26, "Steals"], [27, "Blocks"], [30, "Points"]]

const nbaKeyStats = [[30, "Points"], [25, "Assists"], [24, "Rebounds"]]

const nflPassingStatTypes = [[9, "Passes Completed"], [11, "Pass Completion Percentage"], [12, "Yards Gained Passing"], [13, "Touchdowns"]]
const nflPassingKeyStats = [[9, "Passes Completed"], [12, "Passing Yards"], [13, "Passing Touchdowns"]]

const nflRushingStatTypes = [[8, "Rushing Attemps"], [9, "Rushing Yards"], [10, "Touchdowns"]]
const nflRushingKeyStats = [[8, "Rushing Attemps"], [9, "Rushing Yards"], [10, "Touchdowns"]]

const nflReceivingStatTypes = [[9, "Receptions"], [11, "Receiving Yards"], [13, "Touchdowns"]]
const nflReceivingKeyStats = [[9, "Receptions"], [11, "Receiving Yards"], [13, "Touchdowns"]]

const nflKickingStatTypes = [[19, "Field Goals Made"], [20, "Longest Field Goal Made"], [23, "Extra Points Made"]]
const nflKickingKeyStats = 1 //[[18, "Field Goals Attempted"], [19, "Field Goals Made"], [22, "Extra Points Attempted"], [23, "Extra Points Made"]]

const nflDefenseStatTypes = []
const nflDefenseKeyStats = 1

const nflPlayerStatOptions = [["passing", nflPassingStatTypes, nflPassingKeyStats, false], 
["rushing", nflRushingStatTypes, nflRushingKeyStats, false], 
["receiving", nflReceivingStatTypes, nflReceivingKeyStats, false], ["kicking", nflKickingStatTypes, nflKickingKeyStats, true]]


const nflRandomPlayerType = nflPlayerStatOptions[Math.floor(Math.random() * nflPlayerStatOptions.length)]
//console.log(nflRandomPlayerType)
const nflSportInformation = new SportInformation(nflRandomPlayerType[1], nflRandomPlayerType[2], 
    `https://www.pro-football-reference.com/years/2024/${nflRandomPlayerType[0]}.htm`,
    ['https://www.pro-football-reference.com/req/20230307/images/headshots/', '_2024.jpg'], 
    {
        tr : true, // if true, only tr is taken (not with the full_table class)
        noAverage : nflRandomPlayerType[3], // if true, use all players, not just the best
        urlSplice : false, // if true, the identifier is [length - 2] instead of -1
        nflUrl : true

    })
//console.log(nflSportInformation)


const cfbPassingStatTypes = []
const cfbPassingKeyStats = []

const cfbRushingStatTypes = []
const cfbRushingKeyStats = []

const cfbReceivingStatTypes = []
const cfbReceivingKeyStats = []

const cfbKickingStatTypes = []
const cfbKickingKeyStats = []

const cfbPlayerStatOptions = [["passing", cfbPassingStatTypes, cfbPassingKeyStats], 
["rushing", cfbRushingStatTypes, cfbRushingKeyStats], 
["receiving", cfbReceivingStatTypes, cfbReceivingKeyStats], 
["kicking", cfbKickingStatTypes, cfbKickingKeyStats]]

const cfbRandomPlayerType = cfbPlayerStatOptions[Math.floor(Math.random() * cfbPlayerStatOptions.length)]

const cfbOffenseStatTypes = []
const cfbOffenseKeyStats = 1

const cfbDefenseStatTypes = []
const cfbDefenseKeyStats = 1

const cfbTeamStatOptions = [["offense", cfbOffenseStatTypes, cfbOffenseKeyStats], 
["defense", cfbDefenseStatTypes, cfbDefenseKeyStats]]



const cfbRandomTeamType = cfbTeamStatOptions[Math.floor(Math.random() * cfbTeamStatOptions.length)]



const cfbPlayer = new SportInformation(cfbRandomPlayerType[1], cfbRandomPlayerType[2], 
    `https://www.sports-reference.com/cfb/years/2024-${cfbRandomPlayerType[0]}.html`, 
    ['https://www.sports-reference.com/req/202308031/cfb/images/players/', '.jpg'])

const cfbTeam = new SportInformation(cfbRandomTeamType[1], cfbRandomTeamType[2], 
    `https://www.sports-reference.com/cfb/years/2024-team-${cfbRandomTeamType[0]}.html`, 
    ['https://cdn.ssref.net/req/202408212/tlogo/ncaa/', '.png'])

const cfbOptions = [cfbPlayer, cfbTeam]

const cfbSportInformation = cfbOptions[Math.round(Math.random())]

const mlbBattingStatTypes = []
const mlbBattingKeyStats = []

const mlbPlayerStatOptions = [["batting", mlbBattingStatTypes, mlbBattingKeyStats]]

const mlbRandomPlayerType = mlbPlayerStatOptions[Math.floor(Math.random() * mlbPlayerStatOptions.length)]

const mlbSportInformation = new SportInformation(mlbRandomPlayerType[1], mlbRandomPlayerType[2], 
    `https://www.baseball-reference.com/leagues/majors/2024-standard-${mlbRandomPlayerType[0]}.shtml`,
    ['https://www.pro-football-reference.com/req/20230307/images/headshots/', '_2024.jpg'], 
    {
        tr : true, // if true, only tr is taken (not with the full_table class)
        table : true, // if true, find the player table, then the tbody
        noAverage : false, // if true, use all players, not just the best
        urlSplice : false, // if true, the identifier is [length - 2] instead of -1
        nflUrl : true


    })



var allSportOptions = {
    nba : new SportInformation(nbaStatTypes, nbaKeyStats, 
        'https://www.basketball-reference.com/leagues/NBA_2024_totals.html', 
        ['https://www.basketball-reference.com/req/202106291/images/headshots/', '.jpg'], 
        {
            tr : true, // if true, only tr is taken (not with the full_table class)
            noAverage : false, // if true, use all players, not just the best
            urlSplice : false, // if true, the identifier is [length - 2] instead of -1
            nflUrl : false
        }
    ),
    
    nfl : nflSportInformation
    //mlb : mlbSportInformation
} // ,
    //cfb : collegeFootball
//}

var date = new Date()
date = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`
var usersToday = {
    date : date,
    nba : 0,
    nfl : 0
};

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.redirect('/nfl');
});

app.get('/nba', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // sends any messages upon opening page
        // fetch values from database and send to client
        res.send(JSON.stringify(allSportOptions.nba.todaysData))
        usersToday.nba += 1

    } else {
        // sends html to client
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
})

app.get('/nfl', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // sends any messages upon opening page
        // fetch values from database and send to client
        res.send(JSON.stringify(allSportOptions.nfl.todaysData))
        usersToday.nfl += 1

    } else {
        // sends html to client
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
})

app.get('/cfb', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // sends any messages upon opening page
        // fetch values from database and send to client
        let response = {
            empty : true
        }
        res.send(JSON.stringify(response))
        //res.send(JSON.stringify(allSportOptions.cfb.todaysData))

    } else {
        // sends html to client
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
})

app.get('/mlb', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // sends any messages upon opening page
        // fetch values from database and send to client
        let response = {
            empty : true
        }
        res.send(JSON.stringify(response))
        //res.send(JSON.stringify(allSportOptions.mlb.todaysData))

    } else {
        // sends html to client
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
})

app.get('/nhl', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // sends any messages upon opening page
        // fetch values from database and send to client
        let response = {
            empty : true
        }
        res.send(JSON.stringify(response))
        //res.send(JSON.stringify(allSportOptions.mlb.todaysData))

    } else {
        // sends html to client
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
})

app.use(express.static('public'));



async function generateBestCandidates(page, rows, sportInformation) {
    console.log('rows length', rows.length)
    var candidatesIndex = []
    if (sportInformation.specialParams.noAverage){
        for (let i = 0; i < rows.length; i++){
            candidatesIndex.push(i)
        }
        return candidatesIndex
    }
    else {
        var totalKeyStatValues = 0

        var keyStatValueArray = [] // each index is a players total of those key stats
        console.log("iterating through players:")
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i]
            var individualSumKeyStats = 0
            for (let j = 0; j < sportInformation.keyStats.length; j++){
                
                let element = await row.$(`td:nth-child(${sportInformation.keyStats[j][0]})`)
                var value = 0;
                try {
                    var placeholder = parseInt(await page.evaluate(el => el.textContent, element))
                    if (Number.isNaN(placeholder)){
                        value = 0
                        console.log("NaN val, setting to 0...")
                    }
                    else {
                        value = placeholder
                    }
                }
                catch (error){
                    console.log("null val, setting to 0...")
                }
                //console.log('player, value', i, value)
                individualSumKeyStats += value
                
            }
            //console.log(individualSumKeyStats)
            keyStatValueArray.push(individualSumKeyStats)
            totalKeyStatValues += individualSumKeyStats
        }
        console.log('completed scraping process')

        const averageKeyStatValue = totalKeyStatValues / rows.length
        console.log('average: ', averageKeyStatValue)
    
        console.log('selecting good candidates')
    
        for (let i = 0; i < rows.length; i++) {
            if (keyStatValueArray[i] >= averageKeyStatValue){
                //console.log('player val', keyStatValueArray[i])
                candidatesIndex.push(i)
            }
        }

        console.log('completed candidate process')
    
        return candidatesIndex
    }
    
}

async function pickRandomFive(candidateIndicies, page, rows, sportInformation) {
    let sportData = {
        players:{
            
        }
    }
    console.log('candidates', candidateIndicies)
    console.log('sport info', sportInformation)

    let statIndex = Math.floor(Math.random() * (sportInformation.statTypes.length - 1))
    console.log('statIndex', statIndex)
    let statDataIndex = sportInformation.statTypes[statIndex][0]
    let playersIndex = []

    console.log('selecting 5 players:')
    var c = 0
    for (let i = 0; i < 5; i++){
        let playerIndex = candidateIndicies[Math.floor(Math.random() * (candidateIndicies.length - 1))]
        console.log('playerIndex', playerIndex)
        if (playersIndex.includes(playerIndex)){
            while (playersIndex.includes(playerIndex)){
                c+= 1
                if (c > 10){
                    console.log('infinite loop; breaking...')
                    break
                }
                console.log('already in')
                playerIndex = candidateIndicies[Math.floor(Math.random() * (candidateIndicies.length - 1))]
                console.log('new playerIndex', playerIndex)
            }
        }
        playersIndex.push(playerIndex)
    
    }

    console.log('stat index', statDataIndex)
    console.log('player index', playersIndex)
    
    sportData.stat = sportInformation.statTypes[statIndex][1]

    console.log('adding stats of 5 players')
    let playerStats = []
    for (let i = 0; i < playersIndex.length; i++) {
        var row = rows[playersIndex[i]]
        var nameElement = await row.$('td:nth-child(2) a')
        var name = await page.evaluate(el => el.textContent, nameElement)
        var link = await page.evaluate(el => el.href, nameElement)
        var statElement = await row.$(`td:nth-child(${statDataIndex})`)
        var stat = await page.evaluate(el => el.textContent, statElement)
        try {
            if (Number.isNaN(parseFloat(stat))){
                stat = 0
                console.log("stat is NaN, setting to 0...")
            }
            else{
                if (stat.split('.').length == 1){
                    stat = parseInt(stat)
                }
                else{
                    stat = parseFloat(stat)
                }
            }
        }
        catch (error){
            console.log("stat is null, setting to 0...")
            stat = 0
        }
        console.log('checking for repeated stats:')
        if (playerStats.includes(stat)){
            console.log("stat already in, generating new player and stat")
            while (playerStats.includes(stat)){
                let playerIndex = candidateIndicies[Math.floor(Math.random() * (candidateIndicies.length - 1))]
                if (playersIndex.includes(playerIndex)){
                    while (playersIndex.includes(playerIndex)){
                        playerIndex = candidateIndicies[Math.floor(Math.random() * (candidateIndicies.length - 1))]
                    }
                }
                playersIndex[i] = playerIndex
                console.log("new player index", playerIndex)
                console.log(playersIndex)
                
                row = rows[playersIndex[i]]
                nameElement = await row.$('td:nth-child(2) a')
                name = await page.evaluate(el => el.textContent, nameElement)
                link = await page.evaluate(el => el.href, nameElement)
                statElement = await row.$(`td:nth-child(${statDataIndex})`)
                stat = await page.evaluate(el => el.textContent, statElement)
                try {
                    if (Number.isNaN(parseFloat(stat))){
                        stat = 0
                        console.log("stat is NaN, setting to 0...")
                    }
                    else{
                        if (stat.split('.').length == 1){
                            stat = parseInt(stat)
                        }
                        else{
                            stat = parseFloat(stat)
                        }
                    }
                }
                catch (error){
                    console.log("null val, setting to 0...")
                    stat = 0
                }
                console.log("new stat", stat)
            }
            
        }
        playerStats.push(stat)

        let latinizedName = latinize(name)
        let identifierChunkOne = link.split('/')
        var identifierChunkTwo;
        var identifier;

        
        if (sportInformation.specialParams.urlSplice) {
            identifier = identifierChunkOne[identifierChunkOne.length-2]
        }
        else {
        
            identifierChunkTwo = identifierChunkOne[identifierChunkOne.length-1]
            identifier = identifierChunkTwo.split('.')[0]
        }

        identifier = sportInformation.imageTemplateLink[0] + identifier + sportInformation.imageTemplateLink[1]
            
        sportData.players[i] = {}
        sportData.players[i].name = latinizedName
        sportData.players[i].imageURL = identifier
        sportData.players[i].stat = stat
        sportData.empty = false

        console.log('player officially added')

    }

    console.log('completed picking process')

    return sportData
}



async function dailyScrape(){
    console.log('launching browser')
    const browser = await puppeteer.launch({
        headless: true,
        //executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    console.log('browser launched')

    for (const [name, sportInformation] of Object.entries(allSportOptions)){
        console.log(`start of ${name}`)
        await page.goto(sportInformation.tableLink)
        console.log('url executed')

        const tbody = await page.waitForSelector('tbody')
        console.log('selected tbody')

        // for baseball var table = await tbody.$$('table#players_standard_batting')
        var rows;
        if (sportInformation.specialParams.tr == true){
            rows = await tbody.$$('tr');
        }
        else{
            rows = await tbody.$$('tr.full_table');
        }
        
        console.log('selected table')

        var candidateIndicies = await generateBestCandidates(page, rows, sportInformation)
        sportInformation.todaysData = await pickRandomFive(candidateIndicies, page, rows, sportInformation)
        console.log(sportInformation.todaysData)
    }

    console.log('closing browser')
    await browser.close()
}

async function checkExistingSportData(){
    console.log('checking existing sport data...')
    try{
        let allTodaysData = JSON.parse(await fs.readFile('allTodaysData.json', 'utf8'))

        let date = new Date()
        date = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`

        if (date == allTodaysData.date){
            console.log('same date, retrieving data...')
            allSportOptions.nfl.todaysData = allTodaysData.nfl
            allSportOptions.nba.todaysData = allTodaysData.nba
        }
        else {
            console.log('new date, generating new data...')
            
            await dailyScrape()
            allTodaysData.date = date
            allTodaysData.nfl = allSportOptions.nfl.todaysData
            allTodaysData.nba = allSportOptions.nba.todaysData

            console.log('all sport', allSportOptions)
            console.log('all today', allTodaysData)

            console.log('storing new data in file...')

            await fs.writeFile('allTodaysData.json', JSON.stringify(allTodaysData))
        }




    }
    catch(err) {
        console.log("error checking data", err)
    }
    

    
}

async function appendUsersToday() {
    try {
        let fileContent = await fs.readFile('user_log.txt', 'utf8')
        let fileRows = fileContent.split('\n')
        console.log('file rows', fileRows)

        let date = new Date()
        date = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`

        let originalDate = true
        for (let i = 0; i < fileRows.length; i++){
            if (fileRows[i].includes(date)){
                originalDate = false
                break
            }
        }

        let totalUsers = parseInt(fileRows[0].split(' ')[1])
        let totalNBA = parseInt(fileRows[1].split(' ')[1])
        let totalNFL = parseInt(fileRows[2].split(' ')[1])

    
        totalNBA += usersToday.nba
        totalNFL += usersToday.nfl

        totalUsers = totalNBA + totalNFL

        let dailyData;
        if (originalDate){
            dailyData = [`${usersToday.date} nba: ${usersToday.nba} nfl: ${usersToday.nfl}\n`]
        }
        else {
            dailyData = []
            let latestEntry = fileRows[3].split(' ')
            let nbaToday = parseInt(latestEntry[2]) + usersToday.nba
            let nflToday = parseInt(latestEntry[4]) + usersToday.nfl
            fileRows[3] = `${usersToday.date} nba: ${nbaToday} nfl: ${nflToday}\n`
        }
        
        // this is the new entry of data

        for (let i = 3; i < fileRows.length; i++){
            try {
                dailyData.push(fileRows[i])
            }
            catch (err){
                
            }
        }


        let newFile = `totalUsers: ${totalUsers}\ntotalNBA: ${totalNBA}\ntotalNFL: ${totalNFL}\n`
        // remake the beginning of the file

        for (let i = 0; i < dailyData.length; i++){
            newFile += dailyData[i]
            // add each of the entries to the file
        }

        console.log(newFile)
        await fs.writeFile('user_log.txt', newFile)
        console.log('information successfully overwritten');

        
        usersToday = {
            date : date,
            nba : 0,
            nfl : 0
        };

        console.log('reset user data for today')
    } catch (err) {
        console.error('Error appending to file:', err);
    }
}

appendUsersToday()
checkExistingSportData()
//dailyScrape()

/*
(async () => {
    await dailyBasketball()
    console.log(todaysBasketball)
    
})()
*/

cron.schedule('0 0 * * *', () => {
    appendUsersToday()
    checkExistingSportData()
    
    console.log('running Sports generation at midnight');
});

process.on('SIGINT', () => {
    console.log('Caught interrupt signal (Ctrl+C)');
    appendUsersToday()
        .then(() => process.exit())
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    appendUsersToday()
        .then(() => process.exit(1))
});

/*
dailyBasketball()
        .then(() => console.log('NBA players generated successfully', todaysBasketball))
        .catch(error => console.error('Error in NBA generation:', error));
    console.log('running NBA generation on server start');
*/

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}/`)
    
})