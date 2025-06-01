/**
 * Configuration options for the Usertune client
 */
export interface UsertuneConfig {
  /** The workspace identifier */
  workspace: string;
  /** Access token for authentication */
  accessToken: string;
  /** Base URL for the API (optional, defaults to https://api.usertune.io) */
  baseUrl?: string;
  /** Request timeout in milliseconds (optional, defaults to 10000) */
  timeout?: number;
  /** Enable debug logging (optional, defaults to false) */
  debug?: boolean;
}

/**
 * Custom attributes that can be passed when retrieving content
 * Values can be strings, numbers, or booleans
 */
export interface ContentAttributes {
  [key: string]: string | number | boolean;
}

/**
 * Response structure for content retrieval
 */
export interface ContentResponse {
  /** The actual content data */
  data: {
    /** Content title */
    title?: string;
    /** Content body/text */
    content?: string;
    /** Image URL */
    image_url?: string;
    /** Call-to-action text */
    cta_text?: string;
    /** Call-to-action URL */
    cta_url?: string;
    /** Additional content properties */
    [key: string]: any;
  };
  /** Metadata about the response */
  metadata: {
    /** Unique identifier for the variant (null if no personalization) */
    variant_id: string | null;
    /** Timestamp when content was generated */
    timestamp: string;
    /** Additional metadata */
    [key: string]: any;
  };
}

/**
 * Options for tracking conversions
 */
export interface TrackingOptions {
  /** Type of conversion (e.g., 'purchase', 'signup', 'click') */
  conversionType: string;
  /** Monetary value of the conversion (optional) */
  conversionValue?: number;
}

/**
 * Response structure for tracking operations
 */
export interface TrackingResponse {
  /** Whether the tracking was successful */
  success: boolean;
  /** Response message */
  message?: string;
  /** Additional response data */
  [key: string]: any;
}

/**
 * Return type for contentWithTracker method
 */
export interface ContentWithTracker {
  /** The content response */
  content: ContentResponse;
  /** Function to track conversions for this content */
  track: (conversionType: string, conversionValue?: number) => Promise<TrackingResponse>;
}

/**
 * HTTP client interface for dependency injection
 */
export interface HttpClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
}

/**
 * Error response structure from the API
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: any;
} 