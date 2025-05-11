import {randomBytes} from "node:crypto";

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const HOUR_IN_SECONDS = 60 * MINUTE / 1000;
export const DAY = 24 * HOUR;
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;



export function tokenGenerate(length=24) {
  return Buffer.from(randomBytes(length)).toString('hex');
}