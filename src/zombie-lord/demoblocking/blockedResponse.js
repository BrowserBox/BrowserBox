
const BLOCKED_RESPONSE = `
HTTP/1.1 200 OK
X-Powered-By: Zanj-Dosyago-Corporation
X-Blocked-Internally: Custom ad blocking
Accept-Ranges: bytes
Cache-Control: public, max-age=0
Content-Type: text/html; charset=UTF-8
Content-Length: 244

<h1>Request blocked</h1>
<p>This navigation was prevented because you're in demo mode.</p>
<h2>Need to see this site?</h2>
<p>You can sign up for unrestricted access to the whole internet
  <a id=dosy-litewait-membership href=https://stretchy.live/signup.html?>here.</a>
</p>
`;

export default BLOCKED_RESPONSE;
