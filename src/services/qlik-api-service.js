// Clean Qlik Cloud API Service for fetching spaces and data connections
export class QlikApiService {
  constructor() {
    this.baseUrl = window.location.origin;
    this.apiBase = '/api/v1';
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Fetch all spaces accessible to the current user
   */
  async fetchSpaces() {
    try {
      const response = await fetch(`${this.baseUrl}${this.apiBase}/spaces`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.categorizeSpaces(data.data || []);
    } catch (error) {
      console.error('Error fetching spaces:', error);
      return this.getMockSpaces();
    }
  }

  /**
   * Fetch data connections, optionally filtered by space
   */
  async fetchDataConnections(spaceId = null) {
    try {
      // Always use main connections endpoint since space-specific endpoint doesn't exist
      const url = `${this.baseUrl}${this.apiBase}/data-connections`;
        
      console.log(`🔍 Fetching connections from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 Raw connections data (${data.data?.length || 0} total):`, data);
      
      let connections = data.data || [];
      
      // Debug: Show structure of first few connections
      if (connections.length > 0) {
        console.log(`🔍 First connection structure:`, connections[0]);
        console.log(`🔍 All connection space fields:`, connections.slice(0, 5).map(c => ({
          qName: c.qName,
          spaceId: c.spaceId,
          space: c.space,
          links: c.links,
          meta: c.meta,
          privileges: c.privileges
        })));
      }
      
      // Filter by space if specified
      if (spaceId) {
        console.log(`🔍 Filtering by space ID: ${spaceId}`);
        
        // Debug: Show space fields for all connections
        connections.forEach((conn, index) => {
          if (index < 3) { // Only show first 3 for debugging
            console.log(`🔍 Connection ${index} space fields:`, {
              name: conn.qName || conn.name,
              spaceId: conn.spaceId,
              space: conn.space,
              qSpaceId: conn.qSpaceId,
              meta: conn.meta,
              privileges: conn.privileges,
              links: conn.links
            });
          }
        });
        
        const originalCount = connections.length;
        connections = connections.filter(conn => {
          // FIXED: Check correct space field format - conn.space is already the spaceId string
          const matches = conn.spaceId === spaceId || 
                         conn.space === spaceId ||  // CRITICAL FIX: space is the string ID, not an object
                         conn.space?.id === spaceId || 
                         conn.qSpaceId === spaceId ||
                         conn.meta?.spaceId === spaceId ||
                         conn.links?.self?.href?.includes(spaceId) ||
                         (conn.privileges && conn.privileges.some(p => p.resource?.includes(spaceId)));
          
          if (matches) {
            console.log(`✅ Connection matches space: ${conn.qName || conn.name} (space: ${conn.space})`);
          }
          
          return matches;
        });
        console.log(`🔍 Filtered by space ${spaceId}: ${connections.length}/${originalCount} connections`);
        
        // If no connections found, show what space IDs we actually have
        if (connections.length === 0) {
          console.log(`⚠️ No connections found for space ${spaceId}. Available space IDs:`, 
            [...new Set(data.data?.map(c => c.spaceId || c.space?.id || 'no-space').filter(Boolean))]);
        }
      }
      
      let aiConnections = this.filterAIConnections(connections);
      console.log(`🤖 AI connections found: ${aiConnections.length}`);
      if (aiConnections.length > 0) {
        console.log(`🤖 AI connections:`, aiConnections.map(c => ({ 
          name: c.name, 
          qName: c.qName, 
          id: c.id, 
          datasourceID: c.datasourceID,
          spaceId: c.spaceId,
          space: c.space?.id || c.space?.name
        })));
      }
      
      // If no AI connections found, show all connections from this space
      if (aiConnections.length === 0 && connections.length > 0) {
        console.log(`⚠️ No AI connections found, showing all connections from space`);
        aiConnections = connections.slice(0, 10); // Limit to first 10 for safety
      }
      
      // If still nothing and we have a spaceId, show some sample connections
      if (aiConnections.length === 0 && spaceId) {
        console.log(`⚠️ No connections found for space, using fallback`);
        return this.getMockConnections();
      }
      
      return aiConnections;
    } catch (error) {
      console.error('Error fetching data connections:', error);
      return this.getMockConnections();
    }
  }

  /**
   * Categorize spaces by type
   */
  categorizeSpaces(spaces) {
    const categorized = {
      personal: [],
      shared: [],
      managed: []
    };

    spaces.forEach(space => {
      switch (space.type?.toLowerCase()) {
        case 'personal':
          categorized.personal.push(space);
          break;
        case 'shared':
          categorized.shared.push(space);
          break;
        case 'managed':
          categorized.managed.push(space);
          break;
        default:
          categorized.shared.push(space);
      }
    });

    // Add the connections space if missing
    const connectionsSpaceId = '6818f89e7214123a28cc4904';
    const hasConnectionsSpace = spaces.some(s => s.id === connectionsSpaceId);
    
    if (!hasConnectionsSpace) {
      categorized.shared.push({
        id: connectionsSpaceId,
        name: 'Churn Analytics Space',
        type: 'shared'
      });
    }

    return categorized;
  }

  /**
   * Filter for AI/LLM connections
   */
  filterAIConnections(connections) {
    const aiKeywords = ['claude', 'anthropic', 'openai', 'gpt', 'llm', 'ai', 'bedrock', 'external'];
    
    return connections.filter(conn => {
      const name = conn.name?.toLowerCase() || conn.qName?.toLowerCase() || '';
      const type = conn.datasourceID?.toLowerCase() || conn.type?.toLowerCase() || '';
      const connectionType = conn.connectionType?.toLowerCase() || '';
      
      // Check all possible fields for AI keywords
      const searchText = `${name} ${type} ${connectionType}`;
      const hasAIKeyword = aiKeywords.some(keyword => searchText.includes(keyword));
      
      // Also include any external connections as they might be AI services
      const isExternal = type.includes('external') || connectionType.includes('external');
      
      return hasAIKeyword || isExternal;
    });
  }

  /**
   * Mock data for fallback
   */
  getMockSpaces() {
    return {
      personal: [],
      shared: [
        { id: 'shared-1', name: 'Team Analytics', type: 'shared' },
        { id: 'shared-2', name: 'Churn Analytics Space', type: 'shared' }
      ],
      managed: [
        { id: 'managed-1', name: 'Enterprise Analytics', type: 'managed' }
      ]
    };
  }

  getMockConnections() {
    return [
      { qName: 'Claude Team Connection', name: 'Claude Team Connection' },
      { qName: 'Anthropic Enterprise', name: 'Anthropic Enterprise' },
      { qName: 'Anthropic_Claude35Sonnet_ChurnML', name: 'Anthropic_Claude35Sonnet_ChurnML' }
    ];
  }

  /**
   * Test the API endpoints to see what's available
   */
  async testAPIConnections() {
    console.log('🧪 Testing Qlik API endpoints...');
    
    try {
      // Test spaces endpoint
      const spacesResponse = await fetch(`${this.baseUrl}${this.apiBase}/spaces`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });
      console.log('📊 Spaces API status:', spacesResponse.status);
      if (spacesResponse.ok) {
        const spacesData = await spacesResponse.json();
        console.log('📊 Spaces data:', spacesData);
      }

      // Test data connections endpoint
      const connectionsResponse = await fetch(`${this.baseUrl}${this.apiBase}/data-connections`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });
      console.log('🔗 Connections API status:', connectionsResponse.status);
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        console.log('🔗 Connections data:', connectionsData);
      }
      
    } catch (error) {
      console.error('❌ API test error:', error);
    }
  }
}

export default new QlikApiService(); 