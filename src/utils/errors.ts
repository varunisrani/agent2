/**
 * Type guard to check if an unknown error is an Error object
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Get a safe error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
} 