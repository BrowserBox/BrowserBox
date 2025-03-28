import path from 'path';
import {execSync} from 'child_process';

const runPath = path.resolve(process.argv[2]);
execSync(`"${runPath}"`,{stdio:'inherit'});
