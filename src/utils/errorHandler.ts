import { toast } from "@/hooks/use-toast";
import { logError, logWarning } from "./errorLogger";
import { ERROR_MESSAGES } from "./constants";

/**
 * Centralized error handling utility
 * Provides user-facing error messages while logging technical details
 */

export interface ErrorHandlerOptions {
  title?: string;
  userMessage?: string;
  logMessage?: string;
  showToast?: boolean;
  variant?: "default" | "destructive";
}

/**
 * Handle errors with user-facing messages and logging
 */
export const handleError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): void => {
  const {
    title = "Error",
    userMessage,
    logMessage = "An error occurred",
    showToast = true,
    variant = "destructive",
  } = options;

  // Log the error for debugging
  logError(logMessage, error);

  // Show user-facing toast notification
  if (showToast) {
    const message = userMessage || getErrorMessage(error);
    toast({
      title,
      description: message,
      variant,
    });
  }
};

/**
 * Handle warnings with optional user notification
 */
export const handleWarning = (
  message: string,
  options: Omit<ErrorHandlerOptions, "variant"> = {}
): void => {
  const { title = "Warning", showToast = false } = options;

  logWarning(message);

  if (showToast) {
    toast({
      title,
      description: message,
      variant: "default",
    });
  }
};

/**
 * Extract user-friendly error message from error object
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("network")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes("rate limit")) {
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    }
    if (error.message.includes("auth")) {
      return ERROR_MESSAGES.AUTH_REQUIRED;
    }
    
    // Return the error message if it's user-friendly
    if (error.message.length < 100) {
      return error.message;
    }
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Handle file upload errors
 */
export const handleFileError = (
  error: unknown,
  fileName?: string
): void => {
  const fileContext = fileName ? ` (${fileName})` : "";
  
  handleError(error, {
    title: "Upload Failed",
    userMessage: ERROR_MESSAGES.UPLOAD_FAILED + fileContext,
    logMessage: `File upload error${fileContext}`,
  });
};

/**
 * Handle download errors
 */
export const handleDownloadError = (
  error: unknown,
  fileName?: string
): void => {
  const fileContext = fileName ? ` (${fileName})` : "";
  
  handleError(error, {
    title: "Download Failed",
    userMessage: ERROR_MESSAGES.DOWNLOAD_FAILED + fileContext,
    logMessage: `File download error${fileContext}`,
  });
};

/**
 * Validate file size and show error if invalid
 */
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 10
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    toast({
      title: "File Too Large",
      description: `${file.name} exceeds ${maxSizeMB}MB limit`,
      variant: "destructive",
    });
    return false;
  }
  
  return true;
};

/**
 * Validate file type and show error if invalid
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  if (!allowedTypes.includes(file.type)) {
    toast({
      title: "Invalid File Type",
      description: `${file.name} is not a supported file type`,
      variant: "destructive",
    });
    return false;
  }
  
  return true;
};
