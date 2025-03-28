export declare function darwin(): string[];
/**
 * Look for linux executables in 3 ways
 * 1. Look into CHROME_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for google-chrome-stable & google-chrome executables by using the which command
 */
export declare function linux(): string[];
export declare function wsl(): string[];
export declare function win32(): string[];
