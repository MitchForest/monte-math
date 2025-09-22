const logLevels = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
} as const;

type LogLevel = keyof typeof logLevels;

class Logger {
	private level: LogLevel = "info";

	setLevel(level: LogLevel) {
		this.level = level;
	}

	private shouldLog(level: LogLevel): boolean {
		return logLevels[level] >= logLevels[this.level];
	}

	debug(message: string, data?: unknown) {
		if (this.shouldLog("debug")) {
			console.debug(`[DEBUG] ${message}`, data);
		}
	}

	info(message: string, data?: unknown) {
		if (this.shouldLog("info")) {
			console.info(`[INFO] ${message}`, data);
		}
	}

	warn(message: string, data?: unknown) {
		if (this.shouldLog("warn")) {
			console.warn(`[WARN] ${message}`, data);
		}
	}

	error(message: string, data?: unknown) {
		if (this.shouldLog("error")) {
			console.error(`[ERROR] ${message}`, data);
		}
	}
}

export const logger = new Logger();
