export const BLOCKED_CODE = 200;
export const BLOCKED_BODY = Buffer.from(`
  <style>:root { font-family: system-ui, monospace; }</style>
  <h1>Request blocked</h1>
  <p>This navigation was prevented by the BrowserBox ad blocker.</p>
  <details>
    <summary>Not an ad?</summary>
    <p>
      Tweet the link you clicked or the page you were on <a target=_blank href=https://twitter.com/@browsergap>@browsergap</a> for service.
    <p>
  </details>
`).toString("base64");
export const BLOCKED_HEADERS = [
  {name: "X-Powered-By", value: "Zanj-Dosyago-Corporation"},
  {name: "X-Blocked-Internally", value: "Custom ad blocking"},
  {name: "Accept-Ranges", value: "bytes"},
  {name: "Cache-Control", value: "public, max-age=0"},
  {name: "Content-Type", value: "text/html; charset=UTF-8"},
  {name: "Content-Length", value: `${BLOCKED_BODY.length}`}
];

const BLOCKED_RESPONSE = `
HTTP/1.1 ${BLOCKED_CODE} OK
X-Powered-By: Zanj-Dosyago-Corporation
X-Blocked-Internally: Custom ad blocking
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Content-Type: text/html; charset=UTF-8
Content-Length: ${BLOCKED_BODY.length}

${BLOCKED_BODY}
`;

export default BLOCKED_RESPONSE;

