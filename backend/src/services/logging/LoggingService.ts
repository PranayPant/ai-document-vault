import { ILoggerProvider, LogLevel } from './types';
import { ConsoleProvider } from './providers/ConsoleProvider';

class LoggingService {
  private providers: ILoggerProvider[] = [];
  private minLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Default strategy: Use Console
    this.addProvider(new ConsoleProvider());
  }

  public addProvider(provider: ILoggerProvider): void {
    this.providers.push(provider);
  }

  public clearProviders(): void {
    this.providers = [];
  }

  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private broadcast(level: LogLevel, message: string, meta?: Record<string, any>) {
    if (level < this.minLevel) return;

    this.providers.forEach(provider => {
      try {
        provider.log(level, message, meta);
      } catch (error) {
        // Prevent a logging failure from crashing the app
        console.error("Failed to log to a provider", error);
      }
    });
  }

  public info(message: string, meta?: Record<string, any>) {
    this.broadcast(LogLevel.INFO, message, meta);
  }

  public warn(message: string, meta?: Record<string, any>) {
    this.broadcast(LogLevel.WARN, message, meta);
  }

  public error(message: string, meta?: Record<string, any>) {
    this.broadcast(LogLevel.ERROR, message, meta);
  }

  public debug(message: string, meta?: Record<string, any>) {
    this.broadcast(LogLevel.DEBUG, message, meta);
  }
}

// Exporting the instance makes it a Singleton
export const logger = new LoggingService();