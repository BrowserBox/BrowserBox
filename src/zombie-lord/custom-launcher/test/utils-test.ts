/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import * as assert from 'assert';
import {toWinDirFormat, getLocalAppDataPath} from '../src/utils';

describe('WSL path format to Windows', () => {
  it('transforms basic path', () => {
    const wsl = '/mnt/c/Users/user1/AppData/';
    const windows = 'C:\\Users\\user1\\AppData\\';
    assert.equal(toWinDirFormat(wsl), windows);
  });

  it('transforms if drive letter is different than c', () => {
    const wsl = '/mnt/d/Users/user1/AppData';
    const windows = 'D:\\Users\\user1\\AppData';
    assert.equal(toWinDirFormat(wsl), windows);
  });

  it('getLocalAppDataPath returns a correct path', () => {
    const path = '/mnt/c/Users/user1/.bin:/mnt/c/Users/user1:/mnt/c/Users/user1/AppData/';
    const appDataPath = '/mnt/c/Users/user1/AppData/Local';
    assert.equal(getLocalAppDataPath(path), appDataPath);
  });
});
