/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  AI_RESPONSE: 1000,
  WEBHOOK_RESPONSE: 2000,
  INITIAL_DELAY: 500,
  MAX_RETRIES: 30,
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  REGENERATE_RESPONSE: 45000,
  STREAM_CHUNK: 10000,
  DEBOUNCE_INPUT: 300,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
} as const;

// Storage buckets
export const STORAGE_BUCKETS = {
  CHAT_IMAGES: 'chat-images',
  CHAT_FILES: 'chat-files',
  GENERATED_IMAGES: 'generated-images',
  ASSETS: 'assets',
} as const;

// Message limits
export const MESSAGE_LIMITS = {
  FREE_TIER: 10,
  PRO_TIER: 500,
  ULTRA_PRO_TIER: 2000,
} as const;

// Rate limits
export const RATE_LIMITS = {
  WEBHOOK_CALLS_PER_MINUTE: 30,
  API_CALLS_PER_MINUTE: 60,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 300,
  SCROLL_DEBOUNCE: 100,
} as const;

// Model identifiers
export const AI_MODELS = {
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  CLAUDE_SONNET: 'claude-3-5-sonnet-20241022',
  GEMINI_FLASH: 'gemini-2.0-flash-exp',
  DEEPSEEK_CHAT: 'deepseek-chat',
  GROK_BETA: 'grok-beta',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported format',
  UPLOAD_FAILED: 'Failed to upload file. Please try again',
  DOWNLOAD_FAILED: 'Failed to download image. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  AUTH_REQUIRED: 'Please sign in to continue',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment',
  GENERIC_ERROR: 'Something went wrong. Please try again',
} as const;
