var todaysSportData;
var localStorageData = {};
var sportIdentifier;
var selectedPlayer = "";
var selectedBox = "";
var correctGuessOrder = [];

var gameData = {
    'gameOver' : false,
    'currentRound' : 0,
    'submittedData' : {}
};
var userStats = {
    "gamesPlayed" : 0,
    "gamesWon" : 0,
    "streak" : 0,
    "wins" : {
        "1": 0,
        "2": 0,
        "3": 0
    }
}

//localStorage.clear()

var date = new Date()
date = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`


async function buildDomContent() {
    sportIdentifier = window.location.href.split('/')
    sportIdentifier = sportIdentifier[sportIdentifier.length - 1]
    let navContent = document.getElementsByClassName('navContent')
    let sportOptions = ['nfl', 'nba', 'mlb', 'nhl', 'cfb']
    let sportIndex = sportOptions.indexOf(sportIdentifier)
    navContent[sportIndex].style.color = 'rgb(76, 173, 232)'
    navContent[sportIndex].style.textDecoration = "underline"

    var guessRows = document.getElementById('guessRows');
    for (let i = 0; i <3; i++){
        var guessRowContainer = document.createElement("div")
        guessRowContainer.className = "guessRowContainer"

        var guessRow = document.createElement("div")
        guessRow.className = "guessRow centerHorizontal"

        var guessRowData = document.createElement("label")
        guessRowData.className = "guessRowData"

        var guessRowIndicatorContainer = document.createElement("div")
        guessRowIndicatorContainer.className = "guessRowIndicatorContainer"

        var guessRowHighIndicator = document.createElement("label")
        guessRowHighIndicator.className = "guessRowHighIndicator"

        var guessRowLowIndicator = document.createElement("label")
        guessRowLowIndicator.className = "guessRowLowIndicator"

        
        for (let i = 0; i<5; i++){
            var guessButton = document.createElement("input")
            var guessContainer = document.createElement("div")

            guessButton.type = "button"
            guessButton.className = "guessButton"

            

            let guessOverlay = document.createElement("div")
            guessOverlay.className = "guessOverlay"
            guessOverlay.addEventListener("pointerdown", chooseBox);

            guessContainer.className = "guessContainer"
            guessContainer.dataset.index = i.toString()
            guessContainer.appendChild(guessButton)
            guessContainer.appendChild(guessOverlay)

            guessRow.appendChild(guessContainer)
            
        }

        guessRowHighIndicator.textContent = "HIGH"
        guessRowIndicatorContainer.appendChild(guessRowHighIndicator)
        guessRowLowIndicator.textContent = "LOW"
        guessRowIndicatorContainer.appendChild(guessRowLowIndicator)

        guessRowContainer.appendChild(guessRow)
        guessRowContainer.appendChild(guessRowData)
        guessRowContainer.appendChild(guessRowIndicatorContainer)
        guessRows.appendChild(guessRowContainer)
        if (i != 0){
            guessRowContainer.style.visibility = "hidden"
        }
    }
    //await setData()
    
}

async function fetchSportData() {
    try {
        const response = await fetch(`http://localhost:3000/${sportIdentifier}`, {
            method: "GET",
            headers: {
                'Accept': 'application/json'
            }
        })
        //console.log(response)
        const data = response.json()
        
        return data
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function setData(){
    todaysSportData = await fetchSportData(sportIdentifier)
    
    console.log("todays sports values", todaysSportData)

    if (todaysSportData.empty){
        var statText = document.getElementById('statText')
        statText.textContent = 'COMING SOON'
    }
    else {

        let tempOrderArray = []
        for (let i = 0; i < 5; i++){
            let stat = todaysSportData.players[i.toString()].stat
            tempOrderArray.push(stat)
        }
        
        var statText = document.getElementById('statText')
        statText.textContent = `${todaysSportData.stat.toUpperCase()} THIS SEASON`

        let playerChoiceContainer = document.getElementById('playerChoiceContainer')

        let imagePromises = []; 
        for (let i = 0; i < 5; i++){
            let playerContainer = document.createElement("div")
            
            let fullName = todaysSportData.players[i.toString()].name
            let imageURL = todaysSportData.players[i.toString()].imageURL

            let playerImage = document.createElement("img")
            
            let imagePromise = new Promise((resolve, reject) => {
                playerImage.src = imageURL;

                playerImage.onerror = function () {
                    this.onerror = function () {
                        this.onerror = function () {
                            // third fallback image
                            this.onerror = null // prevent infinite loop
                            imageURL = 'https://w7.pngwing.com/pngs/434/127/png-transparent-mystery-mysterious-man-s-woman-silhouette-thriller-thumbnail.png'
                            this.src = imageURL
                            todaysSportData.players[i.toString()].imageURL = imageURL;
                        }
                        // Second fallback image
                        imageURL = imageURL.slice(0, imageURL.length - 5) + '2.jpg';
                        this.src = imageURL;
                        todaysSportData.players[i.toString()].imageURL = imageURL;
                        
                    };
                    imageURL = imageURL.slice(0, imageURL.length - 5) + '3.jpg';
                    this.src = imageURL;
                    todaysSportData.players[i.toString()].imageURL = imageURL;
                    
                };

                playerImage.onload = function () {
                    resolve(); // Resolve if image loads successfully
                };
            });

            // Add each image loading promise to the array
            imagePromises.push(imagePromise);
            
            playerImage.className = "playerImage"

            let playerLabel = document.createElement("label")

            var splitName = fullName.split(' ')
            var firstName;
            var lastName;

            if (splitName.length == 2){
                firstName = splitName[0]
                lastName = splitName[1]
            }
            else {
                firstName = splitName[0]
                lastName = splitName[1] + " " + splitName[2]
            }

            let formattedName = lastName + ", " + firstName
            playerLabel.textContent = formattedName
            playerLabel.className = "playerLabel"

            let playerOverlay = document.createElement("div")
            playerOverlay.className = "playerOverlay"
            playerOverlay.addEventListener("pointerdown", choosePlayer)

            playerContainer.appendChild(playerImage)
            playerContainer.appendChild(playerLabel)
            playerContainer.appendChild(playerOverlay)
            playerContainer.className = "playerContainer"
            playerContainer.dataset.index = i.toString()

            playerChoiceContainer.appendChild(playerContainer)
        }

        await Promise.all(imagePromises);

        if (correctGuessOrder.length == 0){
            for (let i = 0; i < 5; i++){
                var maxIndex = tempOrderArray.indexOf(Math.max(...tempOrderArray))
                tempOrderArray[maxIndex] = -1
                    
                correctGuessOrder.push(JSON.stringify(todaysSportData.players[maxIndex.toString()]))
                
            }
            //console.log("correct guess order", correctGuessOrder)
        }
        //loadLocalStorage()
    }
}

function chooseBox(event) {
    var round = gameData.currentRound
    var guessOverlay = event.target
    var guessContainer = guessOverlay.parentElement
    var guessButton = guessContainer.getElementsByClassName('guessButton')[0]
    var guessRow = document.getElementsByClassName("guessRow")[round]
    
    if (selectedPlayer == "" ){
        console.log("clicked box with NO player selected")
        if (guessContainer.dataset.playerData){
            console.log("box has player data", JSON.parse(guessContainer.dataset.playerData))
            selectedPlayer = JSON.parse(guessContainer.dataset.playerData)
            console.log(selectedPlayer)
            for (let j = 0; j < 5; j++){
                let tempGuessContainer = guessRow.getElementsByClassName("guessContainer")[j]
                let tempGuessOverlay = tempGuessContainer.getElementsByClassName("guessOverlay")[0]
                tempGuessOverlay.style.opacity = "0";
            }
            let guessOverlay = guessContainer.getElementsByClassName("guessOverlay")[0]
            guessOverlay.style.opacity = "0.3";
            selectedBox = guessContainer.dataset.index
        }
        
    }
    // enters a player into a box
    else {
        console.log("clicked box with a player selected", selectedPlayer)
        if (selectedBox){
            console.log("coming from another box", selectedBox)
            let oldGuessContainer = guessRow.getElementsByClassName("guessContainer")[parseInt(selectedBox)]
            let oldGuessButton = oldGuessContainer.getElementsByClassName("guessButton")[0]
            if (guessContainer.dataset.playerData){
                oldGuessContainer.dataset.playerData = guessContainer.dataset.playerData
                let imageURL = JSON.parse(guessContainer.dataset.playerData).imageURL
                oldGuessButton.style.backgroundImage = `url(${imageURL})`
            }
            else{
                oldGuessContainer.dataset.playerData = ""
                oldGuessButton.style.backgroundImage = "none"
            }
            
            selectedBox = ""
        }
        var uniquePlayer = true
        var indexUsed;
        for (let k = 0; k < 5; k++){
            console.log(guessRow)
            let tempGuessContainer = guessRow.getElementsByClassName("guessContainer")[k]
            
            if (tempGuessContainer.dataset.playerData){
                if (tempGuessContainer.dataset.playerData == JSON.stringify(selectedPlayer)){
                    uniquePlayer = false
                    indexUsed = k
                }
                console.log(JSON.parse(tempGuessContainer.dataset.playerData), selectedPlayer)
                
            }
        }

        if (uniquePlayer){
            let imageURL = selectedPlayer.imageURL

            guessButton.style.backgroundImage = `url(${imageURL})`

            guessContainer.dataset.playerData = JSON.stringify(selectedPlayer)
            
        }
        else {
            console.log("player already in box", indexUsed)
        }

        selectedPlayer = ""
        for (let j = 0; j < 5; j++){
            let tempPlayerContainer = document.getElementsByClassName("playerContainer")[j]
            let tempPlayerOverlay = tempPlayerContainer.getElementsByClassName("playerOverlay")[0]
            tempPlayerOverlay.style.opacity = "0";
            let tempGuessContainer = guessRow.getElementsByClassName("guessContainer")[j]
            let tempGuessOverlay = tempGuessContainer.getElementsByClassName("guessOverlay")[0]
            tempGuessOverlay.style.opacity = "0";
        }
    }
    
}

function choosePlayer(event) {
    const playerOverlay = event.target
    const playerContainer = playerOverlay.parentElement
    console.log("clicked player")
    for (let j = 0; j < 5; j++){
        let tempPlayerContainer = document.getElementsByClassName("playerContainer")[j]
        let tempPlayerOverlay = tempPlayerContainer.getElementsByClassName("playerOverlay")[0]
        tempPlayerOverlay.style.opacity = "0";
    }
    playerOverlay.style.opacity = "0.3";
    selectedPlayer = todaysSportData.players[playerContainer.dataset.index]
        


}




function submitGuess(localCurrentRound) {
    
    var guessRows = document.getElementById('guessRows');
    var currentRound;
    if (localCurrentRound == null){
        currentRound = gameData.currentRound
    }
    else {
        currentRound = localCurrentRound
    }
    console.log('current round', currentRound)

    var guessRowContainer = guessRows.getElementsByClassName('guessRowContainer')[currentRound];

    var guessRow = guessRowContainer.getElementsByClassName('guessRow')[0];

    var fullBoxes = true;
    for (let i = 0; i < 5; i++){
        let guessContainer = guessRow.getElementsByClassName('guessContainer')[i]
        if (!guessContainer.dataset.playerData){
            fullBoxes = false
        }
    }
    if (fullBoxes){
        console.log('submitted')
        
        let userGuessOrder = []
        for (let i = 0; i < 5; i++){
            let guessContainer = guessRow.getElementsByClassName('guessContainer')[i]
            userGuessOrder.push(guessContainer.dataset.playerData)
        }
        let correctCounter = 0
        if (localCurrentRound == null){
            for (let i = 0; i < 5; i++){
                if (correctGuessOrder[i] == userGuessOrder[i]){
                    correctCounter++
                }
            }
        }
        else {
            correctCounter = gameData.submittedData[currentRound.toString()][1]
        }
         
        

        let guessRowData = guessRowContainer.getElementsByClassName('guessRowData')[0]
        guessRowData.textContent = correctCounter.toString() + "/5"
        
        let guessRowIndicatorContainer = guessRowContainer.getElementsByClassName('guessRowIndicatorContainer')[0]
        guessRowIndicatorContainer.remove()

        console.log('correct counter', correctCounter)

        
        let gameEnded = false
        if (correctCounter == 5 || currentRound == 2){
            gameData.gameOver = true
            gameEnded = true
            
        }

        let gameOver;
        if (localCurrentRound == null){
            gameData.submittedData[gameData.currentRound.toString()] = [userGuessOrder, correctCounter, gameEnded]
            currentRound++
            gameData.currentRound++

            localStorageData.gameData = gameData
            localStorage.setItem(sportIdentifier, JSON.stringify(localStorageData))
            gameOver = gameData.gameOver
        }
        else {
            gameOver = gameData.submittedData[currentRound.toString()][2]
            currentRound++

            
        }

        for (let i = 0; i < 5; i++){
            let guessContainer = guessRow.getElementsByClassName('guessContainer')[i]

            let guessButton = guessContainer.getElementsByClassName('guessButton')[0]
            guessButton.disabled = true
            let guessOverlay = guessContainer.getElementsByClassName('guessOverlay')[0]
            guessOverlay.style.opacity = 0.5
            
            guessOverlay.removeEventListener("pointerdown", chooseBox)
            guessOverlay.style.pointerEvents = "none"
            if (gameOver && correctCounter == 5){
                guessOverlay.style.backgroundColor = "lightblue"
            }
            else{
                guessOverlay.style.backgroundColor = "lightgray"
            }
            
        }
        
        userGuessOrder = []
        

        if (gameOver){

            console.log("game over")
            console.log(gameData.submittedData)
            let submitButton = document.getElementById("submitButton")

            
            if (correctCounter == 5){
                submitButton.textContent = "Nice Job!"
                if (localCurrentRound == null){
                    userStats.gamesWon++
                    userStats.streak++
                    userStats.wins[currentRound.toString()]++
                }
            }
            else {
                submitButton.textContent = "Next time..."
                if (localCurrentRound == null){
                    userStats.streak = 0
                }
            }
            if (localCurrentRound == null){
                userStats.gamesPlayed++
                localStorageData.userStats = userStats
                localStorage.setItem(sportIdentifier, JSON.stringify(localStorageData))
            }

            console.log('correctGuessOrder', correctGuessOrder)
            let playerChoiceContainer = document.getElementById("playerChoiceContainer")
            for (let i = 0; i < 5; i++){
                
                console.log(correctGuessOrder[i])

                let fullName = JSON.parse(correctGuessOrder[i]).name
                
                let imageURL = JSON.parse(correctGuessOrder[i]).imageURL
                console.log(correctGuessOrder, correctGuessOrder[i])
                let stat = JSON.parse(correctGuessOrder[i]).stat
                let playerContainer = playerChoiceContainer.getElementsByClassName("playerContainer")[i]
                let playerImage = playerContainer.getElementsByClassName("playerImage")[0]
                let playerLabel = playerContainer.getElementsByClassName("playerLabel")[0]
                playerImage.src = imageURL

                var splitName = fullName.split(' ')
                var firstName;
                var lastName;

                if (splitName.length == 2){
                    firstName = splitName[0]
                    lastName = splitName[1]
                }
                else {
                    firstName = splitName[0]
                    lastName = splitName[1] + " " + splitName[2]
                }

                let formattedName = lastName + ", " + firstName
                playerLabel.textContent = formattedName
                playerLabel.innerHTML += `<br>${stat}`

                let playerOverlay = playerContainer.getElementsByClassName("playerOverlay")[0]
                playerOverlay.style.pointerEvents = "none"
                playerOverlay.removeEventListener("pointerdown", choosePlayer)

                wait(showStats, 3)

            }
            let correctText = document.createElement("label")
            correctText.className = "correctText"
            correctText.textContent = "Correct Ranking Below"

            let submitContainer = document.getElementById("submitContainer")
            submitContainer.appendChild(correctText)
            submitButton.disabled = true
            submitButton.style.pointerEvents = "none"
            
        }
        else {
            
            var guessRows = document.getElementById('guessRows');
            var guessRowContainer;
            if (localCurrentRound == null){
                guessRowContainer = guessRows.getElementsByClassName('guessRowContainer')[gameData.currentRound]
            }
            else {
                guessRowContainer = guessRows.getElementsByClassName('guessRowContainer')[currentRound]
            }
            guessRowContainer.style.visibility = "visible"

        }


    }
    else {
        setWarning()
    }
    

}

function setWarning(){
    let submitButton = document.getElementById("submitButton")
    submitButton.textContent = "MUST RANK ALL PLAYERS"
    submitButton.style.color = "white"
    submitButton.style.backgroundColor = "rgb(80, 120, 145)"
    submitButton.style.pointerEvents = "none"
    console.log("must rank all players")
    wait(removeWarning, 2)
}

function removeWarning(){
    submitButton.textContent = "SUBMIT"
    submitButton.style.color = "black"
    submitButton.style.pointerEvents = "all"
    submitButton.style.backgroundColor = "rgb(135, 206, 250)"
}

function loadLocalStorage() {
    let storedDate;
    if (localStorage.getItem('date')){
        storedDate = localStorage.getItem('date')
    }
    else {
        localStorage.setItem('date', date)
    }
    if (localStorage.getItem(sportIdentifier)){
        localStorageData = JSON.parse(localStorage.getItem(sportIdentifier))
        
        if (storedDate == date){
            if (localStorageData.gameData){
                gameData = localStorageData.gameData
            }
        }
        else {
            localStorage.setItem('date', date)
            localStorageData.gameData = gameData
            localStorage.setItem(sportIdentifier, JSON.stringify(localStorageData))
        }

        if (localStorageData.userStats){
            userStats = localStorageData.userStats
        }
    }
    
    
    
    console.log('game data', localStorageData.gameData)

    //applyLocalStorage()
    
}

function applyLocalStorage(){
    let guessRows = document.getElementById("guessRows")
    console.log(guessRows)
    for (let i = 0; i < gameData.currentRound; i++){
        
        let localSubmittedRowData = gameData.submittedData[i.toString()]
        let guessRowContainer = guessRows.getElementsByClassName("guessRowContainer")[i]
        guessRowContainer.style.visibility = "visible"
        let guessRow = guessRowContainer.getElementsByClassName("guessRow")[0]
        for (let j = 0; j < 5; j++){
            let guessContainer = guessRow.getElementsByClassName("guessContainer")[j]
            let playerObj = JSON.parse(localSubmittedRowData[0][j.toString()])
            guessContainer.dataset.playerData = JSON.stringify(playerObj)
            let guessButton = guessContainer.getElementsByClassName("guessButton")[0]
            
            let imageURL = playerObj.imageURL

            guessButton.style.backgroundImage = `url(${imageURL})`
        }
        submitGuess(i)
    }
}

function showStats(){
    let statContainer = document.getElementById("userStatContainer")

    let userDataContainer = document.getElementById("userDataContainer")

    let userDataRow = userDataContainer.getElementsByClassName('boxRow')[0]

    let userNumCell = userDataRow.getElementsByClassName('boxCell')
    
    userNumCell[0].textContent = userStats.gamesPlayed
    if (userStats.gamesPlayed == 0){
        userNumCell[1].textContent = 0
    }
    else {
        userNumCell[1].textContent = Math.floor((userStats.gamesWon / userStats.gamesPlayed) * 100)
    }
    userNumCell[2].textContent = userStats.streak

    let userDisplayContainer = document.getElementById("userDisplayContainer")

    let wins = []

    for (let i = 0; i < 3; i++){
        wins.push(userStats.wins[(i+1).toString()])
        //console.log(wins)
    }

    let maxWin = Math.max(...wins)
    //console.log(maxWin)

    let allGuessBarContainers = userDisplayContainer.getElementsByClassName('guessBarContainer')
    for (let i = 0; i < allGuessBarContainers.length; i++){
        let guessBarContainer = allGuessBarContainers[i]
        let guessBar = guessBarContainer.getElementsByClassName('guessBar')[0]
        let winVal = userStats.wins[(i+1).toString()]
        guessBar.textContent = winVal
        if (winVal != 0){
            guessBar.style.width = `${(winVal / maxWin) * 90}%`

        }
    }

    if (gameData.gameOver){
        document.getElementById('shareScoreButton').style.visibility = "visible"
    }


    statContainer.style.visibility = "visible"
}

function showIntructions(){
    document.getElementById("instructionContainer").style.visibility = "visible"
}

function hideInfo(){
    let popups = document.getElementsByClassName('infoContainer')
    for (let i = 0; i < popups.length; i++){
        popups[i].style.visibility = "hidden"
    }
    document.getElementById('shareScoreButton').style.visibility = "hidden"

}

function copyShareText() {

    var shareMessage = `BlindFive ${date}\n`
    for (let i = 0; i < gameData.currentRound; i++){
        shareMessage += `${(gameData.submittedData[i.toString()][1])}/5\n`
    }
    shareMessage += 'http://blindfivesports.com'
    console.log(shareMessage)
    navigator.clipboard.writeText(shareMessage);
}


async function wait(func, seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    func();
}


async function main() {
    //localStorage.clear()
    
    
    
    document.addEventListener("DOMContentLoaded", buildDomContent)
}

document.addEventListener("DOMContentLoaded", () => {
    buildDomContent()
        .then(() => setData())
        .then(() => loadLocalStorage())
        .then(() => applyLocalStorage())
})

//main()

// GAMEPLAN :::: 

// once that is done, put it under an /nba and put it online
// advertise with tiktok
// partner with companies who rent adspace
// put all earnings on red in the casino
