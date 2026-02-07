export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  factor: number;
};

export const retry = async <T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> => {
  let attempt = 0;
  let lastError: Error | undefined;
  while (attempt <= options.retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= options.retries) {
        break;
      }
      const delay = options.baseDelayMs * Math.pow(options.factor, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    attempt += 1;
  }
  throw lastError ?? new Error("Retry failed");
};
