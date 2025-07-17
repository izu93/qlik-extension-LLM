import {
  useElement,
  useLayout,
  useEffect,
  useApp,
  useModel,
} from "@nebula.js/stardust";
import objectProperties from "./object-properties";
import extensionDefinition from "./ext";
import dataConfiguration from "./data";

export default function supernova() {
  return {
    qae: {
      properties: objectProperties,
      data: dataConfiguration,
    },
    ext: extensionDefinition,
    component() {
      const element = useElement();
      const layout = useLayout();
      const app = useApp();
      const model = useModel();

      useEffect(() => {
        // Check completion status
        const isConnectionConfigured = !!(layout?.props?.connectionName?.trim());
        const dimensionCount = layout?.qHyperCube?.qDimensionInfo?.length || 0;
        const measureCount = layout?.qHyperCube?.qMeasureInfo?.length || 0;
        const hasDimensionsOrMeasures = dimensionCount > 0 || measureCount > 0;
        const isSelectionValidationConfigured = !!(layout?.props?.enableSelectionValidation && layout?.props?.customValidationExpression?.trim());
        const arePromptsConfigured = !!(layout?.props?.promptsConfigured || (layout?.props?.systemPrompt?.trim() && layout?.props?.userPrompt?.trim()));

        // Get available dimensions and measures
        const dimensions = layout?.qHyperCube?.qDimensionInfo || [];
        const measures = layout?.qHyperCube?.qMeasureInfo || [];

        // Function to show prompts modal
        const showPromptsModal = () => {
          const modal = document.createElement('div');
          modal.id = 'prompts-modal';
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
          `;

          modal.innerHTML = `
            <div style="
              background: white;
              border-radius: 8px;
              width: 90%;
              max-width: 1200px;
              height: 80%;
              max-height: 600px;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            ">
              <!-- Header -->
              <div style="
                padding: 20px 24px;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <h2 style="
                  margin: 0;
                  color: #333;
                  font-size: 18px;
                  font-weight: 600;
                ">Prompts & Field Mapping</h2>
                <button id="close-modal" style="
                  background: none;
                  border: none;
                  font-size: 20px;
                  cursor: pointer;
                  color: #666;
                  padding: 4px;
                ">&times;</button>
              </div>

              <!-- Main Content -->
              <div style="
                flex: 1;
                display: flex;
                overflow: hidden;
              ">
                <!-- Left Column: Available Data Fields -->
                <div style="
                  width: 20%;
                  border-right: 1px solid #f0f0f0;
                  padding: 20px;
                  overflow-y: auto;
                ">
                  <h3 style="
                    margin: 0 0 16px 0;
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  ">Available Data Fields</h3>
                  
                  ${dimensions.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                      <h4 style="
                        margin: 0 0 8px 0;
                        color: #666;
                        font-size: 12px;
                        font-weight: 500;
                      ">Dimensions (${dimensions.length})</h4>
                      ${dimensions.map(dim => `
                        <div style="
                          padding: 8px 12px;
                          margin: 4px 0;
                          background: #f8f9fa;
                          border: 1px solid #e9ecef;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 13px;
                          color: #495057;
                          transition: all 0.2s ease;
                        " 
                        onmouseover="this.style.background='#e9ecef'"
                        onmouseout="this.style.background='#f8f9fa'"
                        onclick="addToMapping('${dim.qFallbackTitle}', 'dimension')">
                          📊 ${dim.qFallbackTitle}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  ${measures.length > 0 ? `
                    <div>
                      <h4 style="
                        margin: 0 0 8px 0;
                        color: #666;
                        font-size: 12px;
                        font-weight: 500;
                      ">Measures (${measures.length})</h4>
                      ${measures.map(measure => `
                        <div style="
                          padding: 8px 12px;
                          margin: 4px 0;
                          background: #f8f9fa;
                          border: 1px solid #e9ecef;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 13px;
                          color: #495057;
                          transition: all 0.2s ease;
                        "
                        onmouseover="this.style.background='#e9ecef'"
                        onmouseout="this.style.background='#f8f9fa'"
                        onclick="addToMapping('${measure.qFallbackTitle}', 'measure')">
                          📈 ${measure.qFallbackTitle}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  ${dimensions.length === 0 && measures.length === 0 ? `
                    <div style="
                      text-align: center;
                      color: #8c8c8c;
                      font-style: italic;
                      margin-top: 40px;
                    ">
                      No data fields available.<br/>
                      Add dimensions and measures first.
                    </div>
                  ` : ''}
                </div>

                <!-- Middle Column: Prompts -->
                <div style="
                  width: 50%;
                  border-right: 1px solid #f0f0f0;
                  padding: 20px;
                  overflow-y: auto;
                ">
                  <h3 style="
                    margin: 0 0 16px 0;
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  ">AI Prompts</h3>
                  
                  <!-- System Prompt -->
                  <div style="margin-bottom: 24px;">
                    <label style="
                      display: block;
                      margin-bottom: 8px;
                      color: #333;
                      font-size: 13px;
                      font-weight: 500;
                    ">System Prompt</label>
                    <p style="
                      margin: 0 0 8px 0;
                      color: #666;
                      font-size: 11px;
                      font-style: italic;
                    ">Defines the AI's role, behavior, and response style</p>
                    <textarea 
                      id="system-prompt"
                      placeholder="Enter system prompt..."
                      style="
                        width: 100%;
                        height: 120px;
                        padding: 12px;
                        border: 1px solid #d9d9d9;
                        border-radius: 4px;
                        font-size: 13px;
                        font-family: 'Source Sans Pro', sans-serif;
                        resize: vertical;
                        box-sizing: border-box;
                      ">${layout?.props?.systemPrompt || 'You are a helpful and professional analytical assistant inside a Qlik Cloud Analytics application. Use the structured data provided in the user prompt along with any additional context they provide to generate your response. Always respond in exactly three bullets. Do not explain your methodology or how you arrived at your answers. Maintain a friendly and respectful tone.'}</textarea>
                  </div>
                  
                  <!-- User Prompt -->
                  <div>
                    <label style="
                      display: block;
                      margin-bottom: 8px;
                      color: #333;
                      font-size: 13px;
                      font-weight: 500;
                    ">User Prompt</label>
                    <p style="
                      margin: 0 0 8px 0;
                      color: #666;
                      font-size: 11px;
                      font-style: italic;
                    ">Conveys the user's intent or query for analysis</p>
                    <textarea 
                      id="user-prompt"
                      placeholder="Enter user prompt..."
                      style="
                        width: 100%;
                        height: 120px;
                        padding: 12px;
                        border: 1px solid #d9d9d9;
                        border-radius: 4px;
                        font-size: 13px;
                        font-family: 'Source Sans Pro', sans-serif;
                        resize: vertical;
                        box-sizing: border-box;
                      ">${layout?.props?.userPrompt || ''}</textarea>
                  </div>
                </div>

                <!-- Right Column: Active Mappings -->
                <div style="
                  width: 30%;
                  padding: 20px;
                  overflow-y: auto;
                ">
                  <h3 style="
                    margin: 0 0 16px 0;
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  ">Active Mappings</h3>
                  
                  <div id="active-mappings" style="
                    min-height: 200px;
                  ">
                    <div style="
                      text-align: center;
                      color: #8c8c8c;
                      font-style: italic;
                      margin-top: 40px;
                    ">
                      Click on data fields to add mappings
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Actions -->
              <div style="
                padding: 16px 24px;
                border-top: 1px solid #f0f0f0;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
              ">
                <button id="cancel-btn" style="
                  padding: 8px 16px;
                  border: 1px solid #d9d9d9;
                  background: white;
                  color: #666;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 13px;
                ">Cancel</button>
                <button id="save-btn" style="
                  padding: 8px 16px;
                  border: 1px solid #1890ff;
                  background: #1890ff;
                  color: white;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 13px;
                ">Save Mappings</button>
              </div>
            </div>
          `;

          document.body.appendChild(modal);

          // Add event listeners
          document.getElementById('close-modal').onclick = () => {
            document.body.removeChild(modal);
          };
          
          document.getElementById('cancel-btn').onclick = () => {
            document.body.removeChild(modal);
          };
          
          document.getElementById('save-btn').onclick = () => {
            // TODO: Implement save functionality
            console.log('Saving prompts and mappings...');
            document.body.removeChild(modal);
          };

          // Global functions for field mapping
          window.addToMapping = (fieldName, fieldType) => {
            const mappingsContainer = document.getElementById('active-mappings');
            const existingMappings = mappingsContainer.querySelectorAll('.mapping-item');
            
            // Check if already mapped
            for (let mapping of existingMappings) {
              if (mapping.dataset.fieldName === fieldName) {
                return; // Already mapped
              }
            }
            
            // Clear placeholder text if this is first mapping
            if (existingMappings.length === 0) {
              mappingsContainer.innerHTML = '';
            }
            
            const mappingItem = document.createElement('div');
            mappingItem.className = 'mapping-item';
            mappingItem.dataset.fieldName = fieldName;
            mappingItem.dataset.fieldType = fieldType;
            mappingItem.style.cssText = `
              padding: 8px 12px;
              margin: 4px 0;
              background: #e6f7ff;
              border: 1px solid #91d5ff;
              border-radius: 4px;
              font-size: 13px;
              color: #003a8c;
              display: flex;
              justify-content: space-between;
              align-items: center;
            `;
            
            mappingItem.innerHTML = `
              <span>${fieldType === 'dimension' ? '📊' : '📈'} ${fieldName}</span>
              <button onclick="removeMapping(this)" style="
                background: none;
                border: none;
                color: #ff4d4f;
                cursor: pointer;
                font-size: 14px;
                padding: 0;
                width: 16px;
                height: 16px;
              ">&times;</button>
            `;
            
            mappingsContainer.appendChild(mappingItem);
          };

          window.removeMapping = (button) => {
            const mappingItem = button.closest('.mapping-item');
            const mappingsContainer = document.getElementById('active-mappings');
            mappingsContainer.removeChild(mappingItem);
            
            // Show placeholder if no mappings left
            if (mappingsContainer.children.length === 0) {
              mappingsContainer.innerHTML = `
                <div style="
                  text-align: center;
                  color: #8c8c8c;
                  font-style: italic;
                  margin-top: 40px;
                ">
                  Click on data fields to add mappings
                </div>
              `;
            }
          };

          // Close modal when clicking outside
          modal.onclick = (e) => {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          };
        };

        // Clear and setup the exact UI design
        element.innerHTML = `
          <div style="
            padding: 20px 20px; 
            font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #ffffff;
            min-height: 400px;
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="
                color: #595959; 
                font-size: 22px; 
                font-weight: 800;
                letter-spacing: -0.5px;
              ">Welcome to Dynamic LLM Extension</h1>
              <p style="
                color: #8c8c8c; 
                margin: 0; 
                font-size: 16px;
                font-weight: 400;
              ">Follow these steps to get started with AI-powered data analysis</p>
            </div>

            <!-- Steps Container -->
            <div style="
              width: 100%; 
              max-width: 500px; 
              display: flex; 
              flex-direction: column; 
              gap: 16px;
            ">
              
              <!-- Step 1: Configure Claude Connection -->
              <div style="
                background: ${isConnectionConfigured ? '#f6ffed' : '#fff7e6'};
                border: 1px solid ${isConnectionConfigured ? '#b7eb8f' : '#ffd591'};
                border-radius: 6px;
                padding: 10px 10px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.3s ease;
              ">
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${isConnectionConfigured ? '#52c41a' : '#fa8c16'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: 16px;
                  flex-shrink: 0;
                ">
                  ${isConnectionConfigured ? '✓' : '1'}
                </div>
                <div style="flex: 1;">
                  <h3 style="
                    margin: 0 0 4px 0;
                    color: ${isConnectionConfigured ? '#52c41a' : '#fa8c16'};
                    font-size: 16px;
                    font-weight: 600;
                  ">${isConnectionConfigured ? 'Connection Configured ✓' : 'Configure Claude Connection'}</h3>
                  <p style="
                    margin: 0;
                    color: #8c8c8c;
                    font-size: 14px;
                    font-weight: 400;
                  ">${isConnectionConfigured ? 'Ready to connect to Claude AI' : 'Set connection name in LLM Configuration panel'}</p>
                </div>
              </div>

              <!-- Step 2: Add Dimensions & Measures -->
              <div style="
                background: ${hasDimensionsOrMeasures ? '#f6ffed' : '#fff7e6'};
                border: 1px solid ${hasDimensionsOrMeasures ? '#b7eb8f' : '#ffd591'};
                border-radius: 6px;
                padding: 10px 10px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.3s ease;
              ">
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${hasDimensionsOrMeasures ? '#52c41a' : '#fa8c16'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: 16px;
                  flex-shrink: 0;
                ">
                  ${hasDimensionsOrMeasures ? '✓' : '2'}
                </div>
                <div style="flex: 1;">
                  <h3 style="
                    margin: 0 0 4px 0;
                    color: ${hasDimensionsOrMeasures ? '#52c41a' : '#fa8c16'};
                    font-size: 16px;
                    font-weight: 600;
                  ">${hasDimensionsOrMeasures ? 'Data Fields Added ✓' : 'Add Dimensions & Measures'}</h3>
                  <p style="
                    margin: 0;
                    color: #8c8c8c;
                    font-size: 14px;
                    font-weight: 400;
                  ">${hasDimensionsOrMeasures ? 
                    `${dimensionCount} dimension${dimensionCount !== 1 ? 's' : ''} and ${measureCount} measure${measureCount !== 1 ? 's' : ''} configured` : 
                    'Add data fields in the Data panel'
                  }</p>
                </div>
              </div>

              <!-- Step 3: Setup Selection Validation -->
              <div style="
                background: ${isSelectionValidationConfigured ? '#f6ffed' : '#fff7e6'};
                border: 1px solid ${isSelectionValidationConfigured ? '#b7eb8f' : '#ffd591'};
                border-radius: 6px;
                padding: 10px 10px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.3s ease;
              ">
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${isSelectionValidationConfigured ? '#52c41a' : '#fa8c16'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: 16px;
                  flex-shrink: 0;
                ">
                  ${isSelectionValidationConfigured ? '✓' : '3'}
                </div>
                <div style="flex: 1;">
                  <h3 style="
                    margin: 0 0 4px 0;
                    color: ${isSelectionValidationConfigured ? '#52c41a' : '#fa8c16'};
                    font-size: 16px;
                    font-weight: 600;
                  ">${isSelectionValidationConfigured ? 'Selection Validation Configured ✓' : 'Setup Selection Validation'}</h3>
                  <p style="
                    margin: 0;
                    color: #8c8c8c;
                    font-size: 14px;
                    font-weight: 400;
                  ">${isSelectionValidationConfigured ? 
                    'Custom validation expression configured' : 
                    'Enable validation in Selection Validation panel'
                  }</p>
                </div>
              </div>

              <!-- Step 4: Add AI Prompts -->
              <div style="
                background: ${arePromptsConfigured ? '#f6ffed' : '#fff7e6'};
                border: 1px solid ${arePromptsConfigured ? '#b7eb8f' : '#ffd591'};
                border-radius: 6px;
                padding: 10px 10px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.3s ease;
              ">
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${arePromptsConfigured ? '#52c41a' : '#fa8c16'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: 16px;
                  flex-shrink: 0;
                ">
                  ${arePromptsConfigured ? '✓' : '4'}
                </div>
                <div style="flex: 1;">
                  <h3 style="
                    margin: 0 0 4px 0;
                    color: ${arePromptsConfigured ? '#52c41a' : '#fa8c16'};
                    font-size: 16px;
                    font-weight: 600;
                  ">${arePromptsConfigured ? 'Prompts Configured ✓' : 'Add Prompts'}</h3>
                  <p style="
                    margin: 0;
                    color: #8c8c8c;
                    font-size: 14px;
                    font-weight: 400;
                  ">${arePromptsConfigured ? 
                    'System and user prompts configured' : 
                    'Click Prompts & Field Mapping to add prompts'
                  }</p>
                </div>
              </div>

            </div>

          </div>
        `;

        // Add click handler for prompts button from ext.js
        window.showPromptsModal = showPromptsModal;
      }, [layout]);

      return () => {
        // Cleanup if needed
      };
    },
  };
}
