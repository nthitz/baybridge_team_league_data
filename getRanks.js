require('dotenv').config()
const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')
const moment = require('moment')
const { csvParse, csvFormat } = require('d3-dsv')

const players = csvParse(fs.readFileSync('./allPlayers.csv').toString())
// players.length = 4
const playersRemaining = [...players]
const dataKey = 'Jan2020'

function loadMPRatings() {
    const now = moment().subtract(8, 'days')
    const date = now.format('YYYY-MM-DD')
    // const date = '2020-01-12' //hmmm
    const playerIds = players.filter(d => d.IFPA_ID !=='').map(d => d.IFPA_ID)
    const url = `https://matchplay.events/data/ifpa/ratings/${date}/${playerIds}`
    console.log(url)
    request.get(url, (error, response, body) => {
        if (error) {
            console.error(error)
        }
        const data = JSON.parse(body)
        Object.keys(data).forEach(ifpa_id => {
            const p = players.find(d => d.IFPA_ID === ifpa_id)
            p[`${dataKey}-MP-LB`] = data[ifpa_id].lower_bound
        })
        nextPlayer()
    })
}

loadMPRatings()

function nextPlayer() {
    if (playersRemaining.length === 0) {
        return end()
    }
    const player = playersRemaining.pop()
    console.log(player.Player, playersRemaining.length)
    let countNeeded = 0
    if (player.IFPA_ID !== '') {
        countNeeded ++
        const ifpaUrl = `https://api.ifpapinball.com/v1/player/${player.IFPA_ID}?api_key=${process.env.IFPA_API_KEY}`
        console.log(ifpaUrl)
        request.get(ifpaUrl, (error, response, body) => {
            if (error) {
                console.error(error)
            }
            const data = JSON.parse(body)
            const rank = +data.player_stats.current_wppr_rank
            if (rank !== 0) {
                player[`${dataKey}-IFPA_Rank`] = rank
            }
            gotPiece()
        })
    }
    // if (player.Matchplay_ID !== '') {
    //      countNeeded++
    //      const mpUrl = `https://matchplay.events/live/ratings/mp-${player.Matchplay_ID}`
    //      request.get(mpUrl, (error, response, body) => {
    //         if (error) {
    //             console.error(error)
    //         }
    //         const $ = cheerio.load(body)
    //         const lowerbound = $('.table tbody tr:nth-child(2) td').text()
    //         player[`${dataKey}-MP-LB`] = +lowerbound
    //         gotPiece()            
    //      })
    // }
    if (countNeeded === 0) {
        countNeeded ++
        gotPiece()
    }

    function gotPiece() {
        countNeeded --
        // console.log(player)
        if (countNeeded === 0) {
            setTimeout(nextPlayer, 4000)
        }
    }
}


function end() {
    fs.writeFileSync('players_with_rankings.csv', csvFormat(players))
}
