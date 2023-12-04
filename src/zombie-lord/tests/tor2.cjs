const url = require('url');
const http = require('http');
const https = require('https');
const {SocksProxyAgent} = require('socks-proxy-agent');

// Use the SOCKS_PROXY env var if using a custom bind address or port for your TOR proxy:
const proxy = process.env.SOCKS_PROXY || 'socks5h://127.0.0.1:9050';
console.log('Using proxy server %j', proxy);
// The default HTTP endpoint here is DuckDuckGo's v3 onion address:
const endpoint = process.argv[2] || 'https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion';
console.log('Attempting to GET %j', endpoint);
// Prepare options for the http/s module by parsing the endpoint URL:
let options = url.parse(endpoint);
const agent = new SocksProxyAgent(proxy);
// Here we pass the socks proxy agent to the http/s module:
options.agent = agent;
// Depending on the endpoint's protocol, we use http or https module:
const httpOrHttps = options.protocol === 'https:' ? https : http;
// Make an HTTP GET request:
httpOrHttps.get(options, res => {
    // Print headers on response:
    console.log('Response received', res.headers);
    // Pipe response body to output stream:
    res.pipe(process.stdout);
});
