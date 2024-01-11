/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FLAGS = [
    // Disable built-in Google Translate service
    '--disable-features=TranslateUI',
    // Disable all chrome extensions
    '--disable-extensions',
    // Disable some extensions that aren't affected by --disable-extensions
    '--disable-component-extensions-with-background-pages',
    // Disable various background network services, including extension updating,
    //   safe browsing service, upgrade detector, translate, UMA
    '--disable-background-networking',
    // Disable syncing to a Google account
    '--disable-sync',
    // Disable reporting to UMA, but allows for collection
    '--metrics-recording-only',
    // Disable installation of default apps on first run
    '--disable-default-apps',
    // Mute any audio
    '--mute-audio',
    // Disable the default browser check, do not prompt to set it as such
    '--no-default-browser-check',
    // Skip first run wizards
    '--no-first-run',
    // Disable backgrounding renders for occluded windows
    '--disable-backgrounding-occluded-windows',
    // Disable renderer process backgrounding
    '--disable-renderer-backgrounding',
    // Disable task throttling of timer tasks from background pages.
    '--disable-background-timer-throttling',
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZmxhZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUNILFlBQVksQ0FBQzs7QUFFQSxRQUFBLGFBQWEsR0FBMEI7SUFDbEQsNENBQTRDO0lBQzVDLGdDQUFnQztJQUNoQyxnQ0FBZ0M7SUFDaEMsc0JBQXNCO0lBQ3RCLHVFQUF1RTtJQUN2RSxzREFBc0Q7SUFDdEQsNkVBQTZFO0lBQzdFLDREQUE0RDtJQUM1RCxpQ0FBaUM7SUFDakMsc0NBQXNDO0lBQ3RDLGdCQUFnQjtJQUNoQixzREFBc0Q7SUFDdEQsMEJBQTBCO0lBQzFCLG9EQUFvRDtJQUNwRCx3QkFBd0I7SUFDeEIsaUJBQWlCO0lBQ2pCLGNBQWM7SUFDZCxxRUFBcUU7SUFDckUsNEJBQTRCO0lBQzVCLHlCQUF5QjtJQUN6QixnQkFBZ0I7SUFDaEIscURBQXFEO0lBQ3JELDBDQUEwQztJQUMxQyx5Q0FBeUM7SUFDekMsa0NBQWtDO0lBQ2xDLGdFQUFnRTtJQUNoRSx1Q0FBdUM7Q0FDeEMsQ0FBQyJ9