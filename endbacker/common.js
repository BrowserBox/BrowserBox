import {MASTER, STAGING} from '../common.js';

export const DEBUG = {
  dev: false,
  val: 1,
  lo: 1,
  med: 3,
  hi: 5,
};

export const MODE = MASTER ? "live" : "test";

export const ORIGIN = MASTER ? "https://browsergap.xyz" : "https://staging.browsergap.xyz";


