export const BLOCKED_CODE = 200;
export const BLOCKED_BODY = Buffer.from(`
  <style>:root { font-family: Arial; }</style>
  <h1>Request blocked</h1>
  <p>This navigation prevented by BrowserBox.</p>
  <details>
    <summary>To block or not to block?</summary>
    <p>
      Send the link you clicked or the page you were on to: <a style="text-decoration: none; color: inherit;" target=_blank href=mailto:support@dosyago.com>support@dosyago.com</a> to report.
    <p>
  </details>
`).toString("base64");
export const BLOCKED_HEADERS = [
  {name: "X-Powered-By", value: "DOSAYGO-BrowserBox"},
  {name: "X-Blocked-Internally", value: "Custom ad blocking"},
  {name: "Accept-Ranges", value: "bytes"},
  {name: "Cache-Control", value: "public, max-age=0"},
  {name: "Content-Type", value: "text/html; charset=UTF-8"},
  {name: "Content-Length", value: `${BLOCKED_BODY.length}`}
];

const BLOCKED_RESPONSE = `
HTTP/1.1 ${BLOCKED_CODE} OK
X-Powered-By: DOSAYGO-BrowserBox
X-Blocked-Internally: Custom ad blocking
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Content-Type: text/html; charset=UTF-8
Content-Length: ${BLOCKED_BODY.length}

${BLOCKED_BODY}
`;

export default BLOCKED_RESPONSE;

