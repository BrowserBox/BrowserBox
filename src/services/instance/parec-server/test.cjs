const path = require('path');
const child_process = require('child_process');
	  encoder = child_process.spawn(path.resolve('.', 'scripts', 'fmedia', 'fmedia.exe'), [
			`--record`,
			  `--out=@stdout.wav`,
			  `--dev-loopback=1`
		  ], {stdio: 'pipe'});
encoder.stderr.on('data', d => console.error(d.toString()));
encoder.stdout.on('data', d => console.info(d));

