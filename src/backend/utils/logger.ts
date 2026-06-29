export class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  static info(message: string, meta?: any): void {
    console.log(`[\x1b[32mINFO\x1b[0m] [${this.getTimestamp()}] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  static warn(message: string, meta?: any): void {
    console.warn(`[\x1b[33mWARN\x1b[0m] [${this.getTimestamp()}] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  static error(message: string, error?: any): void {
    console.error(`[\x1b[31mERROR\x1b[0m] [${this.getTimestamp()}] ${message}`, error || "");
  }

  static http(method: string, url: string, statusCode: number, durationMs: number): void {
    const color = statusCode >= 400 ? "\x1b[31m" : statusCode >= 300 ? "\x1b[33m" : "\x1b[32m";
    console.log(`[\x1b[36mHTTP\x1b[0m] [${this.getTimestamp()}] ${method} ${url} -> ${color}${statusCode}\x1b[0m (${durationMs}ms)`);
  }

  static event(eventName: string, description: string, data?: any): void {
    console.log(`[\x1b[35mEVENT\x1b[0m] [${this.getTimestamp()}] ⚡ ${eventName}: ${description}`, data ? JSON.stringify(data) : "");
  }
}
