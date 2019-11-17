import path from 'path';
import fs from 'fs';

import {landing} from './landing';

fs.writeFileSync(path.join(__dirname, 'index.html'), landing({refresh:true}));
