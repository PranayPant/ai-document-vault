export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface ILoggerProvider {
  log(level: LogLevel, message: string, meta?: Record<string, any>): void;
}