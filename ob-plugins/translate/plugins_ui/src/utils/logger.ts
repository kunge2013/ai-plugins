/**
 * Logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

class Logger {
    private prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    debug(...args: unknown[]): void {
        if (LOG_LEVEL[currentLevel] <= LOG_LEVEL.debug) {
            console.debug(`[${this.prefix}]`, ...args);
        }
    }

    info(...args: unknown[]): void {
        if (LOG_LEVEL[currentLevel] <= LOG_LEVEL.info) {
            console.info(`[${this.prefix}]`, ...args);
        }
    }

    warn(...args: unknown[]): void {
        if (LOG_LEVEL[currentLevel] <= LOG_LEVEL.warn) {
            console.warn(`[${this.prefix}]`, ...args);
        }
    }

    error(...args: unknown[]): void {
        if (LOG_LEVEL[currentLevel] <= LOG_LEVEL.error) {
            console.error(`[${this.prefix}]`, ...args);
        }
    }
}

export function createLogger(prefix: string): Logger {
    return new Logger(prefix);
}
