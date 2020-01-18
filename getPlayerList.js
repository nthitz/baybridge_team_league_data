const fs = require('fs')
const path = require('path')
const resultsFolder = './results/'
const { csvFormat } = require('d3-dsv')
const files = fs.readdirSync(resultsFolder)

console.log(files)

const players = {}

files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(resultsFolder, file)))
    data.players.forEach(player => {
        const { name, ifpa_id, matchplay_user_id} = player
        if (!players[name]) {
            players[name] = {
                name,
            }
        }
        if (ifpa_id) {
            players[name].ifpa_id = ifpa_id
        }
        if (matchplay_user_id) {
            players[name].matchplay_user_id = matchplay_user_id
        }
    })

})

const allPlayers = Object.keys(players).map(name => players[name])

allPlayers.sort((a, b) => {
    if (a.name > b.name) {
        return 1
    }
    return -1
})

console.log(allPlayers)

fs.writeFileSync('./players.csv', csvFormat(allPlayers))
