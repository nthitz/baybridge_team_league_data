require('dotenv').config()
const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')
const { csvParse, csvFormat } = require('d3-dsv')

const players = csvParse(fs.readFileSync('./allPlayers.csv').toString())
const playersRemaining = [...players]
const dataKey = 'Jan2020'
function nextPlayer() {
    if (playersRemaining.length === 0) {
        return end()
    }
    const player = playersRemaining.pop()
    console.log(player.Player)
    let countNeeded = 0
    if (player.IFPA_ID !== '') {
        countNeeded ++
        const ifpaUrl = `https://api.ifpapinball.com/v1/player/${player.IFPA_ID}?api_key=${process.env.IFPA_API_KEY}`
        request.get(ifpaUrl, (error, response, body) => {
            if (error) {
                console.error(error)
            }
            const data = JSON.parse(body)
            const rank = data.player_stats.current_wppr_rank
            player[`${dataKey}-IFPA_Rank`] = +rank
            gotPiece()
        })
    }
    if (player.Matchplay_ID !== '') {
         countNeeded++
         const mpUrl = `https://matchplay.events/live/ratings/mp-${player.Matchplay_ID}`
         request.get(mpUrl, (error, response, body) => {
            if (error) {
                console.error(error)
            }
            const $ = cheerio.load(body)
            const lowerbound = $('.table tbody tr:nth-child(2) td').text()
            player[`${dataKey}-MP-LB`] = +lowerbound
            gotPiece()            
         })
    }

    function gotPiece() {
        countNeeded --
        console.log(player)
        if (countNeeded !== 0) {
            // setTimeout(nextPlayer, 4000)
        }
    }
}

nextPlayer()

function end() {
    fs.writeFileSync('players_with_rankings.csv', csvFormat(players))
}
