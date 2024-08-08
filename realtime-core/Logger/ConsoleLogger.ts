import { Logger } from "./Logger";

/**
 * Implementation of the Logger that logs messages to the console.
 */
export class ConsoleLogger extends Logger {
  /**
   * Logs a message with the given label to the console.
   * @param {string} label - The label associated with the log message.
   * @param {...unknown[]} message - The message or data to log.
   */
  log(label: string, ...message: unknown[]): void {
    console.log(`[LOG] ${label}:`, ...message);
  }

  /**
   * Logs an error message with the given label to the console.
   * @param {string} label - The label associated with the error message.
   * @param {...unknown[]} message - The error message or data to log.
   */
  error(label: string, ...message: unknown[]): void {
    console.error(`[ERROR] ${label}:`, ...message);
  }

  /**
   * Logs a warning message with the given label to the console.
   * @param {string} label - The label associated with the warning message.
   * @param {...unknown[]} message - The warning message or data to log.
   */
  warn(label: string, ...message: unknown[]): void {
    console.warn(`[WARN] ${label}:`, ...message);
  }
}
