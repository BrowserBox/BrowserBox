import {CONFIG} from '../../common.js';
export const WL_BLOCKED_CODE = 302;
// can add custom reason
export const WL_BLOCKED_BODY = Buffer.from(`
  <!DOCTYPE html>
  <meta name=viewport content=width=device-width,initial-scale=1>
  <style>:root { font-family: Arial; }</style>
  <h1>Request blocked in free session</h1>
  <p>Redirecting...</p>
`).toString("base64");
export const WL_BLOCKED_HEADERS = [
  {name: "Location", value: CONFIG.blockedRedirectLocation},
  {name: "X-Powered-By", value: "DOSAYGO-BrowserBox"},
  {name: "X-Blocked-Internally", value: "Custom ad blocking"},
  {name: "Accept-Ranges", value: "bytes"},
  {name: "Cache-Control", value: "public, max-age=0"},
  {name: "Content-Type", value: "text/html; charset=UTF-8"},
  {name: "Content-Length", value: `${WL_BLOCKED_BODY.length}`}
];

const WL_BLOCKED_RESPONSE = `
HTTP/1.1 ${WL_BLOCKED_CODE} Found
Location: ${CONFIG.blockedRedirectLocation}
X-Powered-By: DOSAYGO-BrowserBox
X-Blocked-Internally: Custom blocking
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Content-Type: text/html; charset=UTF-8
Content-Length: ${WL_BLOCKED_BODY.length}

${WL_BLOCKED_BODY}
`;

export default WL_BLOCKED_RESPONSE;

