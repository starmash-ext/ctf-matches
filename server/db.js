import sqlite from "sqlite3";
import {DAY, DAY_IN_SECONDS, HOUR, HOUR_IN_SECONDS} from "./utils.js";
import e from "express";

let db = null
export const initDB = () => {
  db = new sqlite.Database("../../db.sqlite", (err) => {
    if (err) {
      console.error("Error opening database " + err.message);
    } else {
      console.log("Connected to the SQLite database.");
    }
  });

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS Player (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            flag TEXT,
            token TEXT          
       )`,
      (err) => {
        if (err) {
          console.error("Error creating table Player " + err.message);
        } else {
          console.log("Table Player created or already exists.");
        }
      }
    );
    db.run(
      `ALTER TABLE Player ADD COLUMN token TEXT`,
      (err) => {
        if (err) {
          console.error("Column token in table Player:" + err.message);
        } else {
          console.log("Column token created or already exists.");
        }
      }
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS FuturePlay (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gametype TEXT,
        datetime INTEGER,
        player INTEGER REFERENCES Player(id),
        ip TEXT
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table FuturePlay " + err.message);
        } else {
          console.log("Table FuturePlay created or already exists.");
        }
      }
    );
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_player_gametype_datetime ON FuturePlay (gametype, datetime, player);',
      (err) => {
        if (err) {
          console.error("Error creating index on FuturePlay " + err.message);
        } else {
          console.log("Index on FuturePlay created or already exists.");
        }
      })


    db.run(
      `CREATE TABLE IF NOT EXISTS GameHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gameid TEXT,
        server TEXT,
        datetime INTEGER,
        playing INTEGER
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table GameHistory " + err.message);
        } else {
          console.log("Table GameHistory created or already exists.");
        }
      }
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS GameHistoryHourlyPeak (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gameid TEXT,
        server TEXT,
        datetime INTEGER,
        playing INTEGER
      );`,
      (err) => {
        if (err) {
          console.error("Error creating table GameHistoryHourlyPeak " + err.message);
        } else {
          console.log("Table GameHistoryHourlyPeak created or already exists.");
        }
      }
    );
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_gameid_server_datetime ON GameHistoryHourlyPeak (gameid, server, datetime);',
      (err) => {
        if (err) {
          console.error("Error creating index on GameHistoryHourlyPeak " + err.message);
        } else {
          console.log("Index on GameHistoryHourlyPeak created or already exists.");
        }
    })
    // Add other table creation queries here as needed
  });


  return db;

}

export const storeGamesInfos = (gamesInfos) => {
  if (!db) {
    console.error("Database not initialized.");
    return;
  }
  const history = db.prepare(
    `INSERT INTO GameHistory (gameid, server, datetime, playing) VALUES (?, ?, ?, ?)`
  );
  gamesInfos.forEach((gameInfo) => {
    history.run(
      gameInfo.gameid,
      gameInfo.server,
      gameInfo.datetime,
      gameInfo.playing
    );
  });
  history.finalize();
  storePeaks(gamesInfos)
}
const storePeaks = (gamesInfos) => {
  const peak = db.prepare(`INSERT INTO GameHistoryHourlyPeak (gameid, server, datetime, playing) VALUES (?, ?, ?, ?) 
      ON CONFLICT (gameid,server,datetime) DO UPDATE SET playing = MAX(excluded.playing,playing)`,)
  gamesInfos.forEach((gameInfo) => {
    peak.run(
      gameInfo.gameid,
      gameInfo.server,
      gameInfo.datetime - (gameInfo.datetime % HOUR_IN_SECONDS),
      gameInfo.playing
    );
  })
  peak.finalize()
}

export const loadHourlyPeaks = (gameId) => {
  if (!db) {
    console.error("Database not initialized.");
    return;
  }
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT gameid, server, datetime, playing FROM GameHistoryHourlyPeak WHERE datetime > ? AND gameid = ? ORDER BY datetime DESC`,
      [Math.floor(Date.now() / 1000) - (8 * DAY_IN_SECONDS), gameId],
      (err, rows) => {
        if (err) {
          console.error("Error loading hourly peaks " + err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}
export const savePlayer = (name, flag, ip, token) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    db.run(
      `INSERT INTO Player (name, flag, token) VALUES (?, ?, ?)`,
      [name, flag, token],
      function (err) {
        if (err) {
          console.error("Error inserting player " + err.message);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  })
}

export const getPlayer = (id) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    db.get(
      `SELECT id, name, flag FROM Player WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) {
          console.error("Error loading player " + err.message);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

export const updatePlayer = (id, name, flag, ip) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    db.run(
      `UPDATE Player SET name = ?, flag = ? WHERE id = ?`,
      [name, flag, id],
      function (err) {
        if (err) {
          console.error("Error updating player " + err.message);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  })
}


export const togglePresence = (playerId, date, ip) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    db.run(
      `INSERT INTO FuturePlay (gametype, datetime, player, ip) VALUES (?, ?, ?, ?)`,
      ['ctf1', date / 1000, playerId, ip],
      function (err) {
        if (err) { //delete if already exists
          db.run(
            `DELETE FROM FuturePlay WHERE gametype = ? AND datetime = ? AND player = ?`,
            ['ctf1', date / 1000, playerId],
            function (err) {
              if (err) {
                console.error("Error deleting player " + err.message);
                reject(err);
              } else {
                resolve(this.lastID);
              }
            }
          );
        } else {
          resolve(this.lastID);
        }
      }
    );
  })
}

export const getFuturePlayTime = (date) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    db.all(
      `SELECT player, name, flag, datetime FROM FuturePlay FP 
        JOIN Player P ON FP.player = P.id
    WHERE datetime = ? and gametype = ?`,
      [date / 1000, 'ctf1'],
      (err, rows) => {
        if (err) {
          console.error("Error loading future play time " + err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

export const loadFuturePlays = (gametype) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    db.all(
      `SELECT player, name, flag, datetime FROM FuturePlay FP 
        JOIN Player P ON FP.player = P.id
    WHERE datetime > ? and gametype = ?`,
      [Math.floor(Date.now() / 1000), gametype],
      (err, rows) => {
        if (err) {
          console.error("Error loading future play time " + err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  })
}