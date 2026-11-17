export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export interface LogFields {
  request_id?: string;
  stage?: string;
  patient_id?: string;
  duration_ms?: number;
  version?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
}

export type LogSink = (line: string) => void;

const SECRET_PATTERN = /(key|secret|token|password|authorization)/i;

function redact(fields: LogFields): LogFields {
  const output: LogFields = {};
  for (const [name, value] of Object.entries(fields)) {
    output[name] = SECRET_PATTERN.test(name) ? "[REDACTED]" : value;
  }
  return output;
}

export function createLogger(
  sink: LogSink = (line) => {
    process.stdout.write(`${line}\n`);
  },
  minLevel: LogLevel = "info",
): Logger {
  const order = LOG_LEVELS.indexOf(minLevel);

  function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
    if (LOG_LEVELS.indexOf(level) < order) {
      return;
    }
    const record = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...redact(fields),
    };
    sink(JSON.stringify(record));
  }

  return {
    debug: (message, fields) => emit("debug", message, fields),
    info: (message, fields) => emit("info", message, fields),
    warn: (message, fields) => emit("warn", message, fields),
    error: (message, fields) => emit("error", message, fields),
  };
}

export const logger: Logger = createLogger();
