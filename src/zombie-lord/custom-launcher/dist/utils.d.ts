export declare const enum LaunchErrorCodes {
    ERR_LAUNCHER_PATH_NOT_SET = "ERR_LAUNCHER_PATH_NOT_SET",
    ERR_LAUNCHER_INVALID_USER_DATA_DIRECTORY = "ERR_LAUNCHER_INVALID_USER_DATA_DIRECTORY",
    ERR_LAUNCHER_UNSUPPORTED_PLATFORM = "ERR_LAUNCHER_UNSUPPORTED_PLATFORM",
    ERR_LAUNCHER_NOT_INSTALLED = "ERR_LAUNCHER_NOT_INSTALLED"
}
export declare function defaults<T>(val: T | undefined, def: T): T;
export declare function delay(time: number): Promise<{}>;
export declare class LauncherError extends Error {
    message: string;
    code?: string | undefined;
    constructor(message?: string, code?: string | undefined);
}
export declare class ChromePathNotSetError extends LauncherError {
    message: string;
    code: LaunchErrorCodes;
}
export declare class InvalidUserDataDirectoryError extends LauncherError {
    message: string;
    code: LaunchErrorCodes;
}
export declare class UnsupportedPlatformError extends LauncherError {
    message: string;
    code: LaunchErrorCodes;
}
export declare class ChromeNotInstalledError extends LauncherError {
    message: string;
    code: LaunchErrorCodes;
}
export declare function getPlatform(): "wsl" | "aix" | "android" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32" | "cygwin" | "netbsd";
export declare function makeTmpDir(): string;
export declare function toWinDirFormat(dir?: string): string;
export declare function getLocalAppDataPath(path: string): string;
