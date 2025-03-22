# BrowserBox

Secure your web with BrowserBox—cutting-edge remote browser isolation (RBI) technology. Protect your organization from threats and empower your team with seamless, secure browsing. BrowserBox requires a **license key** for all usage—unlock advanced security and productivity today!

## Advanced Usage

### Securely View Documents without Downloading them

On Linux systems you have the option to install the Secure Document Viewier during `bbx install`. Whenever you click on a document in BrowserBox (e.g. *.doc, .xls, .pages, .pdf, .rtf etc*) the document will automatically be converted to a safe sequence of page images that you can view with the built in viewier. Unsupported formats still have the options of viewing as a binary hex format for analysis using the built-in hex viewer. Also, common archive formats (e.g. *.zip, *.gz, *.7z, *.bz etc*) will be safely expanded remotely and displayed with the built-in file and directory viewier. 

### Inspect the JavaScript and HTML of the remote page with DevTools

When viewing a page just right click (long-tap on mobile) and select "Inspect in DevTools" to open the DevTools viewier for the page. 

### Tunnel over Tor

BrowserBox supports Tor natively, both accessing the hidden web and running as an `.onion` site:

```bash
bbx tor-run 
```

### Tunnel over SSH

You can set up a private SSH tunnel between your machine and your BrowserBox machine (e.g. `user@remote_host`). Then BrowserBox ports are never exposed to the public internet.

1. **Setup your local devices**

Run `install` and enter `localhost` for the hostname when prompted. The `https://localhost` certificates will be trusted by your local machine so copy them to your remote machine for BrowserBox, and create the SSH tunnel:

```console
bbx install # enter localhost when prompted
scp ~/sslcerts/*.pem user@remote_host:~/sslcerts/
ssh -L 9997:localhost:9997 -L 9998:localhost:9998 -L 9999:localhost:9999 -L 10000:localhost:10000 -L 10001:localhost:10001 user@remote_host
```

2. **Run BrowserBox on your remote machine (e.g. user@remote_host)**

Run BrowserBox on the remote machine on the same ports you tunneled by specifying the middle port:

```console
bbx setup --hostname localhost --port 9999
bbx run
```

3. **Remote access BrowserBox from your local devices**

Open a web browser on your local device and put the **Login Link** from step 2 into the address bar.

>[!TIP]
>*Windows instructions differ slightly. Consult AI for guidance.*

