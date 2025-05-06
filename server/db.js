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
            jwt TEXT          
       )`,
      (err) => {
        if (err) {
          console.error("Error creating table FuturePlay " + err.message);
        } else {
          console.log("Table FuturePlay created or already exists.");
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
  const peak = db.prepare(`INSERT INTO GameHistoryHourlyPeak (gameid, server, datetime, playing) VALUES (?, ?, ?, ?) 
      ON CONFLICT (gameid,server,datetime) DO UPDATE SET playing = excluded.playing`,)
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