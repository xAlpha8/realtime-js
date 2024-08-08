import { TLogger } from "../shared/@types";

/**
 * Abstract Logger class providing basic logging methods.
 */
export abstract class Logger implements TLogger {
  /**
   * Logs a message with the given label.
   * @param {string} label - The label associated with the log message.
   * @param {...unknown[]} message - The message or data to log.
   */
  abstract log(label: string, ...message: unknown[]): void;

  /**
   * Logs an error message with the given label.
   * @param {string} label - The label associated with the error message.
   * @param {...unknown[]} message - The error message or data to log.
   */
  abstract error(label: string, ...message: unknown[]): void;

  /**
   * Logs a warning message with the given label.
   * @param {string} label - The label associated with the warning message.
   * @param {...unknown[]} message - The warning message or data to log.
   */
  abstract warn(label: string, ...message: unknown[]): void;
}
