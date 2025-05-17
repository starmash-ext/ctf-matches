import express from "express";
import {
  getFuturePlayTime, getPlayer,
  initDB,
  loadFuturePlays,
  loadHourlyPeaks,
  savePlayer,
  storeGamesInfos,
  togglePresence, updatePlayer
} from "./db.js";
import axios from "axios";
import cors from 'cors'
import {DAY, getJWTKey, MINUTE, tokenGenerate} from "./utils.js";
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;
app.use(cors())
app.use(express.json())

initDB()


const JWT_KEY = getJWTKey()
const fetchAndStoreGameInfo = async () => {
  const result = await axios.get('https://data.airmash.rocks/games')
  try {
    const gameServers = JSON.parse(result.data?.data)
    const now = Date.now() / 1000
    const gamesInfos = gameServers.flatMap(server =>
      server.games.map(game =>
        ({
          server: server.id,
          gameid: game.id,
          playing: (game.players || 0) - (game.bots || 0),
          datetime: now
        })
      )
    )
    storeGamesInfos(gamesInfos)
  } catch (e) {
    console.error('Error parsing game info:', e)
    return
  }
}
setInterval(fetchAndStoreGameInfo, 5 * MINUTE);
fetchAndStoreGameInfo();


app.use(express.static('/app/dist'));

const getId = req => {
  let id = null
  if (!req.body.jwt) {
    return
  }
  jwt.verify(req.body.jwt, JWT_KEY, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err);
    } else {
      id = decoded.id
    }
  });
  return id
}

app.post('/togglePresence', async(req, res) => {
  const date = new Date(req.body.date)
  if (date.getMinutes() || date.getSeconds() || date.getMilliseconds() || date.getTime() > Date.now() + (8 * DAY)) {
    res.sendStatus(401)
    return
  }

  const id = getId(req)
  let player = null

  if (!id) {
    const id = await savePlayer(req.body.name, req.body.flag, req.ip, tokenGenerate(24))
    player = {id,name: req.body.name,flag: req.body.flag}
  } else {
    player = await getPlayer(id)
  }
  await togglePresence(player.id, req.body.date, req.ip)
  const result = await getFuturePlayTime(req.body.date)

  res.send({futurePlay: result, jwt: jwt.sign(player, JWT_KEY)})
});

app.post('/updatePlayer', async(req, res) => {
  let id = getId(req)
  if (!id) {
    res.sendStatus(401);
    return;
  }
  await updatePlayer(id, req.body.name, req.body.flag, req.ip)
  res.send({jwt: jwt.sign({id,name:req.body.name,flag:req.body.flag}, JWT_KEY)})
})

app.get('/listPeaks', async (req, res) => {
  const [peaks,futures] = await Promise.all([loadHourlyPeaks('ctf1'),loadFuturePlays('ctf1')])
  res.send({peaks,futures});
});

app.listen(port, (e) => {
  if (e) {
    console.error('Error starting server:', e);
    return;
  }
  console.log(`Server is running on port ${port}`);
});