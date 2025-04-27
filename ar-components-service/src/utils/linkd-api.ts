import axios, { AxiosError } from 'axios';
import WebSocket from 'ws';

export interface LinkdSearchOptions {
  query: string;
  filters?: Record<string, any>;
  maxResults?: number;
  includeDetails?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LinkdProfileData {
  id: string;
  name: string;
  affiliation: string;
  education: string[];
  experience: string[];
  interests: string[];
  skills: string[];
  location: string;
  contacts?: string[];
  connectionsCount?: number;
  bio?: string;
  profileUrl?: string;
  graduationYear?: number;
  major?: string;
  clubs?: string[];
  volunteerWork?: string[];
  awards?: string[];
  recommendations?: { name: string; text: string }[];
}

export interface LinkdIntroRequest {
  fromId: string;
  toId: string;
  message: string;
  context: string;
}

export interface LinkdSearchResult {
  profiles: LinkdProfileData[];
  totalCount: number;
  queryExecutionTime: number;
}

export interface LinkdErrorResponse {
  error: string;
  status: number;
  message: string;
}

// WebSocket message types
export type WebSocketMessageType = 'query' | 'result' | 'complete' | 'error';

export class LinkdAPI {
  private apiKey: string;
  private baseUrl: string = 'https://api.linkd.network';
  private timeout: number = 30000; // 30 seconds timeout for requests

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn('LinkdAPI initialized without an API key. API calls will likely fail.');
    }
  }

  /**
   * REST API for profile search
   * @param options Search options
   * @returns Promise resolving to an array of profile data
   */
  async searchProfiles(options: LinkdSearchOptions): Promise<LinkdSearchResult> {
    try {
      console.log(`Searching for profiles with query: ${options.query}`);
      const response = await axios.get(`${this.baseUrl}/api/search`, {
        params: {
          query: options.query,
          ...options.filters,
          limit: options.maxResults || 10,
          include_details: options.includeDetails || true,
          sort_by: options.sortBy,
          sort_order: options.sortOrder
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });
      
      const result: LinkdSearchResult = {
        profiles: response.data.results || [],
        totalCount: response.data.total_count || response.data.results.length,
        queryExecutionTime: response.data.execution_time || 0
      };

      console.log(`Found ${result.profiles.length} profiles (total: ${result.totalCount})`);
      return result;
    } catch (error) {
      this.handleApiError('searchProfiles', error);
      return { profiles: [], totalCount: 0, queryExecutionTime: 0 };
    }
  }

  /**
   * WebSocket API for real-time profile search
   * @param options Search options
   * @returns Promise resolving to an array of profile data
   */
  searchProfilesWebSocket(options: LinkdSearchOptions): Promise<LinkdSearchResult> {
    console.log(`Starting WebSocket search with query: ${options.query}`);
    
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.baseUrl.replace('https://', 'wss://')}/api/search/ws`;
      console.log(`Connecting to WebSocket at: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      const profiles: LinkdProfileData[] = [];
      let totalCount = 0;
      let startTime = Date.now();
      
      // Set a timeout to prevent hanging connections
      const timeoutId = setTimeout(() => {
        console.error('WebSocket search timed out after 30 seconds');
        ws.close();
        resolve({ 
          profiles, 
          totalCount: profiles.length, 
          queryExecutionTime: (Date.now() - startTime) / 1000 
        });
      }, this.timeout);
      
      ws.on('open', () => {
        console.log('WebSocket connection established');
        ws.send(JSON.stringify({
          type: 'query',
          data: {
            query: options.query,
            filters: options.filters || {},
            limit: options.maxResults || 10,
            include_details: options.includeDetails || true,
            sort_by: options.sortBy,
            sort_order: options.sortOrder
          },
          apiKey: this.apiKey
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`Received WebSocket message of type: ${message.type}`);
          
          if (message.type === 'result') {
            profiles.push(...message.data.results);
            totalCount = message.data.total_count || profiles.length;
          } else if (message.type === 'complete') {
            clearTimeout(timeoutId);
            ws.close();
            const executionTime = (Date.now() - startTime) / 1000;
            console.log(`WebSocket search completed in ${executionTime}s with ${profiles.length} results`);
            resolve({ profiles, totalCount, queryExecutionTime: executionTime });
          } else if (message.type === 'error') {
            clearTimeout(timeoutId);
            ws.close();
            console.error('WebSocket search error:', message.data.message);
            reject(new Error(message.data.message));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('WebSocket connection error:', error);
        reject(error);
      });
      
      ws.on('close', () => {
        clearTimeout(timeoutId);
        console.log('WebSocket connection closed');
      });
    });
  }

  /**
   * Find mutual connections between profiles
   * @param profileId1 First profile ID
   * @param profileId2 Second profile ID
   * @returns Promise resolving to an array of mutual connection names
   */
  async findMutualConnections(profileId1: string, profileId2: string): Promise<string[]> {
    try {
      console.log(`Finding mutual connections between ${profileId1} and ${profileId2}`);
      const response = await axios.get(`${this.baseUrl}/api/connections/mutual`, {
        params: {
          profile1: profileId1,
          profile2: profileId2
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });
      
      const connections = response.data.connections || [];
      console.log(`Found ${connections.length} mutual connections`);
      return connections;
    } catch (error) {
      this.handleApiError('findMutualConnections', error);
      return [];
    }
  }

  /**
   * Get detailed profile information for a specific profile ID
   * @param profileId Profile ID to retrieve
   * @returns Promise resolving to profile data
   */
  async getProfileDetails(profileId: string): Promise<LinkdProfileData | null> {
    try {
      console.log(`Getting details for profile: ${profileId}`);
      const response = await axios.get(`${this.baseUrl}/api/profile/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });
      
      console.log(`Successfully retrieved details for profile: ${profileId}`);
      return response.data.profile || null;
    } catch (error) {
      this.handleApiError('getProfileDetails', error);
      return null;
    }
  }

  /**
   * Request an introduction between two profiles
   * @param request Introduction request details
   * @returns Promise resolving to success status
   */
  async requestIntroduction(request: LinkdIntroRequest): Promise<boolean> {
    try {
      console.log(`Requesting introduction from ${request.fromId} to ${request.toId}`);
      const response = await axios.post(`${this.baseUrl}/api/introductions/request`, request, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });
      
      console.log('Introduction request sent successfully');
      return response.data.success || false;
    } catch (error) {
      this.handleApiError('requestIntroduction', error);
      return false;
    }
  }

  /**
   * Query for profiles based on shared attributes with another profile
   * @param profileId Profile ID to find matches for
   * @param options Search options
   * @returns Promise resolving to an array of profile data
   */
  async findProfileMatches(profileId: string, options: LinkdSearchOptions): Promise<LinkdSearchResult> {
    try {
      console.log(`Finding profile matches for ${profileId} with query: ${options.query}`);
      const response = await axios.get(`${this.baseUrl}/api/profiles/matches/${profileId}`, {
        params: {
          query: options.query,
          ...options.filters,
          limit: options.maxResults || 10,
          include_details: options.includeDetails || true
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });
      
      const result: LinkdSearchResult = {
        profiles: response.data.matches || [],
        totalCount: response.data.total_count || response.data.matches.length,
        queryExecutionTime: response.data.execution_time || 0
      };

      console.log(`Found ${result.profiles.length} profile matches for ${profileId}`);
      return result;
    } catch (error) {
      this.handleApiError('findProfileMatches', error);
      return { profiles: [], totalCount: 0, queryExecutionTime: 0 };
    }
  }

  /**
   * Handle API errors in a consistent way
   * @param methodName Name of the method where the error occurred
   * @param error The error object
   */
  private handleApiError(methodName: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<LinkdErrorResponse>;
      console.error(
        `Linkd API error in ${methodName}: ` +
        `${axiosError.response?.data?.message || axiosError.message} ` +
        `(Status: ${axiosError.response?.status || 'unknown'})`
      );
      
      if (axiosError.response?.status === 401) {
        console.error('Linkd API authentication failed. Check your API key.');
      }
    } else {
      console.error(`Unexpected error in ${methodName}:`, error);
    }
  }
}
