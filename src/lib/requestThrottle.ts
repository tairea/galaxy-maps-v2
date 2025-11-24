/**
 * Simple request throttling utility to prevent overwhelming the browser/Firebase
 * with too many concurrent requests.
 */

type ThrottledRequest<T> = () => Promise<T>;

class RequestThrottle {
  private queue: Array<{
    request: ThrottledRequest<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private running = 0;
  private maxConcurrent: number;
  private delayBetweenBatches: number;

  constructor(maxConcurrent = 3, delayBetweenBatches = 200) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenBatches = delayBetweenBatches;
  }

  /**
   * Add a request to the queue and execute it when a slot is available
   */
  async throttle<T>(request: ThrottledRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.running++;

    try {
      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.running--;
      // Add a small delay before processing next request to avoid overwhelming
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.delayBetweenBatches);
      } else {
        this.processQueue();
      }
    }
  }
}

// Create a singleton instance for student activity requests
export const studentActivityThrottle = new RequestThrottle(3, 200);

// Create a singleton instance for person fetch requests (more concurrent since they're lightweight)
export const personFetchThrottle = new RequestThrottle(5, 100);

// Create a singleton instance for course-related requests (reduced concurrency to avoid overwhelming Firebase)
// Reduced to 1 concurrent with 500ms delay to prevent OPTIONS request rate limiting
export const courseFetchThrottle = new RequestThrottle(1, 500);

/**
 * Helper function to throttle a request with a delay based on student ID
 * This ensures requests are staggered even if they're queued simultaneously
 */
export function getStaggeredDelay(studentId: string, maxDelay = 2000): number {
  // Create a simple hash from the student ID to get a consistent delay
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash << 5) - hash + studentId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Return a delay between 0 and maxDelay based on hash
  return Math.abs(hash % maxDelay);
}
