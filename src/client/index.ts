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
    
    if (!config.accessToken) {
      throw new Error('Access token is required');
    }

    // Initialize HTTP client
    this.http = new AxiosHttpClient({
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      debug: config.debug,
      accessToken: config.accessToken
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
    const url = `/v1/workspace/${this.workspace}/${contentSlug}`;
    
    const response = await this.http.post<ContentResponse>(url, filteredAttributes);
    
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

    const url = `/v1/workspace/${this.workspace}/track`;
    const payload: any = {
      conversion_type: conversionType,
      variant_id: this.currentVariantId
    };

    if (conversionValue !== undefined) {
      payload.conversion_value = conversionValue;
    }
    
    return await this.http.post<TrackingResponse>(url, payload);
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