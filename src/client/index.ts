import { 
  UsertuneConfig, 
  ContentAttributes, 
  ContentResponse, 
  TrackingResponse, 
  ContentWithTracker,
  HttpClient 
} from '../types/index.js';
import { AxiosHttpClient } from '../http/index.js';

/**
 * Main Usertune client class
 */
export class Usertune {
  private http: HttpClient;
  private workspace: string;
  private currentVariantId: string | null = null;

  constructor(config: UsertuneConfig) {
    this.workspace = config.workspace;
    
    // Validate required config
    if (!config.workspace) {
      throw new Error('Workspace is required');
    }

    // Initialize HTTP client
    this.http = new AxiosHttpClient({
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      debug: config.debug,
      accessToken: config.accessToken // Pass even if undefined, HTTP client will handle it
    });
  }

  /**
   * Filter and validate attributes to only include supported types
   */
  private filterAttributes(attributes?: ContentAttributes): ContentAttributes {
    if (!attributes) return {};
    
    const filtered: ContentAttributes = {};
    
    for (const [key, value] of Object.entries(attributes)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        filtered[key] = value;
      }
      // Skip null, undefined, objects, arrays, etc.
    }
    
    return filtered;
  }

  /**
   * Retrieve personalized content
   * @param contentSlug - The content slug identifier
   * @param attributes - Optional custom attributes for personalization
   * @returns Promise resolving to content response
   */
  async content(contentSlug: string, attributes?: ContentAttributes): Promise<ContentResponse> {
    if (!contentSlug) {
      throw new Error('Content slug is required');
    }

    const filteredAttributes = this.filterAttributes(attributes);
    const url = `/v1/workspace/${this.workspace}/${contentSlug}/`;
    
    // Use GET request with query parameters for attributes
    const response = await this.http.get<ContentResponse>(url, {
      params: filteredAttributes
    });
    
    // Store variant_id for tracking
    this.currentVariantId = response.metadata.variant_id;
    
    return response;
  }

  /**
   * Track a conversion
   * @param conversionType - Type of conversion (e.g., 'purchase', 'signup')
   * @param conversionValue - Optional monetary value
   * @returns Promise resolving to tracking response
   */
  async track(conversionType: string, conversionValue?: number): Promise<TrackingResponse> {
    if (!conversionType) {
      throw new Error('Conversion type is required');
    }

    if (!this.currentVariantId) {
      throw new Error('No variant_id available. You must call content() first to get a variant_id before tracking.');
    }

    const url = `/v1/workspace/${this.workspace}/track/`;
    const params: any = {
      conversion_type: conversionType,
      variant_id: this.currentVariantId
    };

    if (conversionValue !== undefined) {
      params.conversion_value = conversionValue;
    }
    
    // Use GET request with query parameters
    return await this.http.get<TrackingResponse>(url, { params });
  }

  /**
   * Get content and return both content and a tracking function
   * @param contentSlug - The content slug identifier  
   * @param attributes - Optional custom attributes for personalization
   * @returns Promise resolving to content and track function
   */
  async contentWithTracker(contentSlug: string, attributes?: ContentAttributes): Promise<ContentWithTracker> {
    const content = await this.content(contentSlug, attributes);
    
    const track = async (conversionType: string, conversionValue?: number): Promise<TrackingResponse> => {
      return await this.track(conversionType, conversionValue);
    };

    return { content, track };
  }
}

// Backward compatibility alias
export const UsertuneClient = Usertune; 