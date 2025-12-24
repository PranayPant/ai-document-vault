import { ILoggerProvider, LogLevel } from '../types';

export class ConsoleProvider implements ILoggerProvider {
  log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const metaString = meta ? JSON.stringify(meta) : '';
    
    const formattedMsg = `[${timestamp}] [${LogLevel[level]}] ${message} ${metaString}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMsg);
        break;
      case LogLevel.WARN:
        console.warn(formattedMsg);
        break;
      case LogLevel.INFO:
        console.info(formattedMsg);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMsg);
        break;
    }
  }
}