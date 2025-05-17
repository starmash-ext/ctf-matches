import {randomBytes} from "node:crypto";
import fs from 'node:fs'

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const HOUR_IN_SECONDS = 60 * MINUTE / 1000;
export const DAY = 24 * HOUR;
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;



export function tokenGenerate(length=24) {
  return Buffer.from(randomBytes(length)).toString('hex');
}

export const getJWTKey = () => {
  try {
    return fs.readFileSync('/data/jwt-key.txt', 'utf8');
  } catch (e) {
    // No jwt key found, generate a new one
    const newKey = tokenGenerate(32);
    fs.writeFileSync('/data/jwt-key.txt', newKey);
    console.log('JWT key generated:', newKey);
    return newKey;
  }
}