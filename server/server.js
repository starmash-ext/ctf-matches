import express from "express";
import {dirname} from "path";
import {initDB, loadHourlyPeaks, storeGamesInfos} from "./db.js";
import axios from "axios";
import {MINUTE} from "./utils.js";

const app = express();
const port = 3000;


initDB()

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


app.use(express.static('../build'));

app.post('/register', (req, res) => {
  res.send('Welcome to my server!');
});


app.get('/listPeaks', async (req, res) => {
  res.send(await loadHourlyPeaks('ctf1'));
});

app.listen(port, (e) => {
  if (e) {
    console.error('Error starting server:', e);
    return;
  }
  console.log(`Server is running on port ${port}`);
});