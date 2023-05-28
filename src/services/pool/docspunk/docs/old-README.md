# [:sparkling_heart: DocumentSpark](https://github.com/dosyago/documentspark)

## Simple secure document viewing server. Used by Viewfinder&trade;

Converts a document to a picture of its pages. View a document from the internet without downloading or running it on your machine, and without needing a word processor, spreadsheet app, or PDF viewer installed. This provides content disarm and reconstruction, or CDR. Also known as [p2.](#), this code is deployed commercially by Dosyago in their [ViewFinder cloud browser product](https://github.com/i5ik/ViewFinder).

## From the [comments](https://news.ycombinator.com/item?id=28705969)

> This is a very simple server in NodeJS to accept a document upload (or a URL) and convert that document (using ImageMagick, LibreOffice and GhostScript) into a series of images, one for each page of the document.
>
> The point was originally to allow people to view documents securely (such as email attachments) without needing to run nor download said document to their own devices. It was successful in doing that, but its use grew to becoming ad-hoc document hosting where people were attracted to the ability to access a page of a document, without needing to download the entire document.
>
> The code is shared as something you can build upon and adapt to your uses in the open. It's not meant as a finished solution, it's meant as a starting point, something to give you ideas for how to implement your own version, or something to plug in to your own open-source work. The project was originally called "p2." for "PDF to ...", but it works on a wide range of source documents, including DOCX and (often but not always) XLSX, and so on. It doesn't work on HTML or TXT.

## Use it

```sh
$ npm i documentspark@latest
$ cd node_modules/documentspark
$ ./setup.sh 
$ ./restart.sh
```

If you have SSL certs in `$HOME/sslcerts/` these will be used, if not the server will run on HTTP. It will run under `pm2` and default to port `443`. You can supply a custom port with `npm start <PORT>`.

Navigate to `yourserver:your_port/secretpage-canneverbefound.html` to convert a document. You can input either a file, or a URL. It may not always be possible to obtain a document from the URL.

Document view pages are not protected by any authentication, they are simply chosen pseudo-randomly. You can modify the code to give document viewing pages longer, more securely random URLs. 

By default, converted documents are cleaned out after 3 days. You can change this in `/public/uploads/clean.sh` which runs every few minutes and cleans any documents older than 4319 minutes (roughly 3 days). 

## Make it an API

There's a very simple "master key" secret parameter sent with the POST request. You can call this POST endpoint via a secure HTTPS API (using multitype/form encoding) and pass your custom `secret=` as a parameter to authorize the conversion. 

## System Requirements

You need a beefy machine. 4 cores, with 8 GB RAM for most documents. But more is better. Smaller machines will routinely run out of memory or take a long time when running the `libreoffice`, `imagemagick` and `gs` jobs.

## Improving perf

You can try recompiling ImageMagick to have multicore support. I found this significantly improves performance.

## Thanks to\*

- [ImageMagick](https://github.com/ImageMagick/ImageMagick)
- [Ghostscript](https://git.ghostscript.com/)
- [LibreOffice](https://www.libreoffice.org/)

*\*No affiliation*

## License

Licensed under AGPL-3.0.

If you'd like to deploy this in your org without going open-source or for a for-profit project where youd want to release the source under AGPL-3.0 as well, write me (cris@dosycorp.com) about a license exemption.
