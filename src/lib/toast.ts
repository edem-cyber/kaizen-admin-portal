import { toast } from "sonner";
import { AxiosError } from "axios";

/**
 * Type for error objects that might have response data
 */
type ErrorWithResponse = AxiosError | {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
};

/**
 * Extracts message from error response
 */
function getErrorMessage(error: ErrorWithResponse): string | undefined {
  if (error && typeof error === 'object') {
    if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      const data = error.response.data;
      if (data && typeof data === 'object') {
        if ('message' in data && typeof data.message === 'string') {
          return data.message;
        }
        if ('error' in data && typeof data.error === 'string') {
          return data.error;
        }
      }
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return undefined;
}

/**
 * Shows a toast notification based on API response status
 * - 2xx: Shows response message (if available) or success message
 * - 4xx: Shows response error message
 * - 5xx: Shows predefined friendly error message
 * 
 * @param error - Axios error object (for errors) or null (for success)
 * @param successMessage - Optional custom success message for 2xx responses
 */
export function showApiToast(
  error: AxiosError | ErrorWithResponse | null,
  successMessage?: string
) {
  // Handle success case (no error, typically 2xx)
  if (!error) {
    const message = successMessage || "Operation completed successfully";
    toast.success(message, {
      position: "top-center",
    });
    return;
  }

  // Handle error case
  const status = error?.response?.status;
  
  if (!status) {
    // No status code, show generic error
    const message = getErrorMessage(error) || "An unexpected error occurred";
    toast.error(message, {
      position: "top-center",
    });
    return;
  }

  const statusString = status.toString();
  const statusFirstDigit = statusString[0];

  // Handle 2xx success (shouldn't normally be an error, but handle it)
  if (statusFirstDigit === "2") {
    const message = getErrorMessage(error) || successMessage || "Operation completed successfully";
    toast.success(message, {
      position: "top-center",
    });
    return;
  }

  // Handle 4xx client errors - show the response message
  if (statusFirstDigit === "4") {
    const message = getErrorMessage(error) || "Request failed. Please check your input and try again.";
    toast.error(message, {
      position: "top-center",
    });
    return;
  }

  // Handle 5xx server errors - show predefined friendly message
  if (statusFirstDigit === "5") {
    toast.error("We're experiencing some technical difficulties. Please try again in a moment.", {
      position: "top-center",
    });
    return;
  }

  // Fallback for other status codes
  const message = getErrorMessage(error) || "An error occurred. Please try again.";
  toast.error(message, {
    position: "top-center",
  });
}

/**
 * Helper function to show success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message, {
    position: "top-center",
  });
}

/**
 * Helper function to show error toast
 */
export function showErrorToast(message: string) {
  toast.error(message, {
    position: "top-center",
  });
}

