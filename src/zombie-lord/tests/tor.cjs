const http = require('http');
const {SocksProxyAgent} = require('socks-proxy-agent');

// Tor proxy address
const torProxy = process.env.TOR_PROXY;

// Your .onion address
const onionAddress = 'http://zqktlwiuavvvqqt4ybvgvi7tyo4hjl5xgfuvpdf6otjiycgwqbym2qad.onion';

// Configure the agent to route traffic through Tor
const agent = new SocksProxyAgent(torProxy);

const options = {
  agent,
  hostname: onionAddress,
  port: 80,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});

req.end();

