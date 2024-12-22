interface RetryOptions {
  retries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error: any) => {
      // Retry on connection errors or 503 Service Unavailable
      return (
        error.message?.includes('connect error') ||
        error.message?.includes('Service Unavailable') ||
        error.status === 503 ||
        error.code === 'ECONNREFUSED'
      );
    }
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[DEBUG] Retry attempt ${attempt}/${retries} after ${delay}ms`);
      }
      return await fn();
    } catch (error) {
      lastError = error;
      
      console.error('[DEBUG] Operation failed:', {
        attempt,
        error,
        message: error instanceof Error ? error.message : String(error)
      });

      if (attempt === retries || !shouldRetry(error)) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, maxDelay);
    }
  }

  throw lastError;
} 