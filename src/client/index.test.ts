import { Usertune } from './index.js';
import { HttpClient, ContentResponse, TrackingResponse } from '../types/index.js';

// Mock HTTP client for testing
class MockHttpClient implements HttpClient {
  public requests: Array<{ method: string; url: string; data?: any; config?: any }> = [];
  private responses: Map<string, any> = new Map();

  setResponse(key: string, response: any) {
    this.responses.set(key, response);
  }

  async get<T = any>(url: string, config?: any): Promise<T> {
    this.requests.push({ method: 'GET', url, config });
    const response = this.responses.get(`GET:${url}`);
    if (!response) {
      throw new Error(`No mock response for GET:${url}`);
    }
    return response;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    this.requests.push({ method: 'POST', url, data, config });
    const response = this.responses.get(`POST:${url}`);
    if (!response) {
      throw new Error(`No mock response for POST:${url}`);
    }
    return response;
  }

  clear() {
    this.requests = [];
    this.responses.clear();
  }
}

describe('Usertune', () => {
  let client: Usertune;
  let mockHttp: MockHttpClient;

  beforeEach(() => {
    mockHttp = new MockHttpClient();
    client = new Usertune({
      workspace: 'test-workspace',
      accessToken: 'test-token'
    });
    // Replace the HTTP client with our mock
    (client as any).http = mockHttp;
  });

  describe('constructor', () => {
    it('should throw error if workspace is missing', () => {
      expect(() => new Usertune({ workspace: '' }))
        .toThrow('Workspace is required');
    });

    it('should create client with valid config (with accessToken)', () => {
      const client = new Usertune({
        workspace: 'test-workspace',
        accessToken: 'test-token'
      });
      expect(client).toBeInstanceOf(Usertune);
    });

    it('should create client without accessToken for public content', () => {
      const client = new Usertune({
        workspace: 'test-workspace'
      });
      expect(client).toBeInstanceOf(Usertune);
    });
  });

  describe('content()', () => {
    const mockContentResponse: ContentResponse = {
      data: {
        title: 'Test Content',
        content: 'This is test content',
        cta_text: 'Click here'
      },
      metadata: {
        variant_id: 'variant-123',
        timestamp: '2023-01-01T00:00:00Z'
      }
    };

    beforeEach(() => {
      mockHttp.setResponse('GET:/v1/workspace/test-workspace/test-slug/', mockContentResponse);
    });

    it('should retrieve content without attributes', async () => {
      const result = await client.content('test-slug');

      expect(result).toEqual(mockContentResponse);
      expect(mockHttp.requests).toHaveLength(1);
      expect(mockHttp.requests[0]).toEqual({
        method: 'GET',
        url: '/v1/workspace/test-workspace/test-slug/',
        config: { params: {} }
      });
    });

    it('should retrieve content with attributes', async () => {
      const attributes = {
        user_id: 'user123',
        location: 'san-francisco',
        premium: true,
        age: 25
      };

      const result = await client.content('test-slug', attributes);

      expect(result).toEqual(mockContentResponse);
      expect(mockHttp.requests[0].config.params).toEqual(attributes);
    });

    it('should filter out unsupported attribute types', async () => {
      const attributes: any = {
        valid_string: 'test',
        valid_number: 42,
        valid_boolean: true,
        invalid_null: null,
        invalid_undefined: undefined,
        invalid_object: { nested: 'value' },
        invalid_array: [1, 2, 3]
      };

      await client.content('test-slug', attributes);

      expect(mockHttp.requests[0].config.params).toEqual({
        valid_string: 'test',
        valid_number: 42,
        valid_boolean: true
      });
    });

    it('should store variant_id internally', async () => {
      await client.content('test-slug');
      expect((client as any).currentVariantId).toBe('variant-123');
    });

    it('should throw error for empty content slug', async () => {
      await expect(client.content('')).rejects.toThrow('Content slug is required');
    });

    it('should work without accessToken for public content', async () => {
      // Create a client without accessToken
      const publicClient = new Usertune({
        workspace: 'test-workspace'
      });
      
      // Replace with mock HTTP client
      const publicMockHttp = new MockHttpClient();
      (publicClient as any).http = publicMockHttp;
      
      // Set up mock response
      const publicContentResponse: ContentResponse = {
        data: {
          title: 'Public Content',
          content: 'This is publicly accessible content'
        },
        metadata: {
          variant_id: null, // Public content typically has no variant
          timestamp: '2023-01-01T00:00:00Z'
        }
      };
      
      publicMockHttp.setResponse('GET:/v1/workspace/test-workspace/public-slug/', publicContentResponse);
      
      const result = await publicClient.content('public-slug');
      
      expect(result).toEqual(publicContentResponse);
      expect(publicMockHttp.requests).toHaveLength(1);
      expect(publicMockHttp.requests[0]).toEqual({
        method: 'GET',
        url: '/v1/workspace/test-workspace/public-slug/',
        config: { params: {} }
      });
    });
  });

  describe('track()', () => {
    const mockTrackingResponse: TrackingResponse = {
      success: true,
      message: 'Conversion tracked successfully'
    };

    beforeEach(() => {
      mockHttp.setResponse('GET:/v1/workspace/test-workspace/track/', mockTrackingResponse);
      // Set up variant_id by calling content first
      (client as any).currentVariantId = 'variant-123';
    });

    it('should track conversion with type only', async () => {
      const result = await client.track('purchase');

      expect(result).toEqual(mockTrackingResponse);
      expect(mockHttp.requests).toHaveLength(1);
      expect(mockHttp.requests[0]).toEqual({
        method: 'GET',
        url: '/v1/workspace/test-workspace/track/',
        config: {
          params: {
            conversion_type: 'purchase',
            variant_id: 'variant-123'
          }
        }
      });
    });

    it('should track conversion with type and value', async () => {
      const result = await client.track('purchase', 99.99);

      expect(result).toEqual(mockTrackingResponse);
      expect(mockHttp.requests[0].config.params).toEqual({
        conversion_type: 'purchase',
        conversion_value: 99.99,
        variant_id: 'variant-123'
      });
    });

    it('should throw error if no variant_id available', async () => {
      (client as any).currentVariantId = null;
      
      await expect(client.track('purchase')).rejects.toThrow(
        'No variant_id available. You must call content() first to get a variant_id before tracking.'
      );
    });

    it('should throw error for empty conversion type', async () => {
      await expect(client.track('')).rejects.toThrow('Conversion type is required');
    });
  });

  describe('contentWithTracker()', () => {
    const mockContentResponse: ContentResponse = {
      data: { title: 'Test Content' },
      metadata: { variant_id: 'variant-123', timestamp: '2023-01-01T00:00:00Z' }
    };

    const mockTrackingResponse: TrackingResponse = {
      success: true,
      message: 'Conversion tracked successfully'
    };

    beforeEach(() => {
      mockHttp.setResponse('GET:/v1/workspace/test-workspace/test-slug/', mockContentResponse);
      mockHttp.setResponse('GET:/v1/workspace/test-workspace/track/', mockTrackingResponse);
    });

    it('should return content and track function', async () => {
      const result = await client.contentWithTracker('test-slug');

      expect(result.content).toEqual(mockContentResponse);
      expect(typeof result.track).toBe('function');
    });

    it('should allow tracking via returned function', async () => {
      const { track } = await client.contentWithTracker('test-slug');
      
      const trackResult = await track('click');
      
      expect(trackResult).toEqual(mockTrackingResponse);
      expect(mockHttp.requests).toHaveLength(2); // content + track
      expect(mockHttp.requests[1].config.params).toEqual({
        conversion_type: 'click',
        variant_id: 'variant-123'
      });
    });

    it('should work with attributes and conversion value', async () => {
      const { track } = await client.contentWithTracker('test-slug', { user_id: 'test' });
      
      await track('purchase', 150.00);
      
      expect(mockHttp.requests[0].config.params).toEqual({ user_id: 'test' });
      expect(mockHttp.requests[1].config.params).toEqual({
        conversion_type: 'purchase',
        conversion_value: 150.00,
        variant_id: 'variant-123'
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete flow: content -> track', async () => {
      const contentResponse: ContentResponse = {
        data: { title: 'Test' },
        metadata: { variant_id: 'variant-123', timestamp: '2023-01-01T00:00:00Z' }
      };
      
      const trackingResponse: TrackingResponse = {
        success: true
      };

      mockHttp.setResponse('GET:/v1/workspace/test-workspace/banner/', contentResponse);
      mockHttp.setResponse('GET:/v1/workspace/test-workspace/track/', trackingResponse);

      // Get content
      const content = await client.content('banner', { user_tier: 'premium' });
      expect(content).toEqual(contentResponse);

      // Track conversion
      const trackResult = await client.track('signup', 50);
      expect(trackResult).toEqual(trackingResponse);

      // Verify requests
      expect(mockHttp.requests).toHaveLength(2);
      expect(mockHttp.requests[0].config.params).toEqual({ user_tier: 'premium' });
      expect(mockHttp.requests[1].config.params).toEqual({
        conversion_type: 'signup',
        conversion_value: 50,
        variant_id: 'variant-123'
      });
    });

    it('should handle content with null variant_id', async () => {
      const contentResponse: ContentResponse = {
        data: { title: 'Static Content' },
        metadata: { variant_id: null, timestamp: '2023-01-01T00:00:00Z' }
      };

      mockHttp.setResponse('GET:/v1/workspace/test-workspace/static/', contentResponse);

      const content = await client.content('static');
      expect(content.metadata.variant_id).toBeNull();

      // Should not be able to track
      await expect(client.track('view')).rejects.toThrow(
        'No variant_id available. You must call content() first to get a variant_id before tracking.'
      );
    });
  });
}); 