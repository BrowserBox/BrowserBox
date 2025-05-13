import { fetch, CustomResponse, CustomHeaders } from './better-fetch.js';

// Patch global fetch and Response
globalThis.fetch = fetch;
globalThis.Response = CustomResponse;
globalThis.Headers = CustomHeaders;
global.fetch = fetch;
global.Response = CustomResponse;
global.Headers = CustomHeaders;

export {};
