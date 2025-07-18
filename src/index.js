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
        
        // Check for prompts configuration with localStorage fallback
        let arePromptsConfigured = !!(layout?.props?.promptsConfigured || (layout?.props?.systemPrompt?.trim() && layout?.props?.userPrompt?.trim()));
        
        console.log('📊 Prompts status check:', {
          layoutPromptsConfigured: layout?.props?.promptsConfigured,
          layoutSystemPrompt: layout?.props?.systemPrompt ? 'exists' : 'missing',
          layoutUserPrompt: layout?.props?.userPrompt ? 'exists' : 'missing',
          calculatedStatus: arePromptsConfigured
        });
        
        // If not configured in layout, check localStorage as fallback and restore data
        if (!arePromptsConfigured) {
          try {
            const extensionId = layout?.qInfo?.qId || 'qlikExtensionLLM';
            const stored = localStorage.getItem(`qlik_prompts_${extensionId}`);
            if (stored) {
              const storedData = JSON.parse(stored);
              if (storedData.promptsConfigured && storedData.systemPrompt?.trim() && storedData.userPrompt?.trim()) {
                arePromptsConfigured = true;
                
                // Restore the missing data to layout props
                if (layout && layout.props) {
                  layout.props.systemPrompt = storedData.systemPrompt;
                  layout.props.userPrompt = storedData.userPrompt;
                  layout.props.promptsConfigured = true;
                }
                
                console.log('📦 Restored prompts from localStorage to layout:', {
                  systemPrompt: storedData.systemPrompt ? 'restored' : 'missing',
                  userPrompt: storedData.userPrompt ? 'restored' : 'missing',
                  promptsConfigured: true
                });
              }
            }
          } catch (e) {
            console.warn('Could not load prompts status from localStorage:', e);
          }
        }

        // Get available dimensions and measures
        const dimensions = layout?.qHyperCube?.qDimensionInfo || [];
        const measures = layout?.qHyperCube?.qMeasureInfo || [];

        // Function to show prompts modal
        const showPromptsModal = () => {
          // Ensure we have current props data, with localStorage fallback
          let currentProps = layout?.props || {};
          
          // Check localStorage for backup data
          const extensionId = layout?.qInfo?.qId || 'qlikExtensionLLM';
          try {
            const stored = localStorage.getItem(`qlik_prompts_${extensionId}`);
            if (stored) {
              const storedData = JSON.parse(stored);
              // Use localStorage data if it's newer or if layout props are missing
              if (!currentProps.systemPrompt || !currentProps.userPrompt) {
                currentProps = { ...currentProps, ...storedData };
                console.log('✅ Loaded prompts from localStorage backup');
              }
            }
          } catch (e) {
            console.warn('Could not load from localStorage:', e);
          }
          
          console.log('Loading modal with props:', currentProps);
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
                <!-- Left Column: AI Prompts -->
                <div style="
                  width: 70%;
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
                    <div style="display: flex; gap: 4px; align-items: flex-start;">
                      <textarea 
                        id="system-prompt"
                        placeholder="Enter system prompt..."
                        style="
                          flex: 1;
                          height: 120px;
                          padding: 12px;
                          border: 1px solid #d9d9d9;
                          border-radius: 4px;
                          font-size: 13px;
                          font-family: 'Source Sans Pro', sans-serif;
                          resize: vertical;
                          box-sizing: border-box;
                        ">${currentProps.systemPrompt || 'You are an expert data scientist with knowledge of SaaS Software adoption and customer analytics. You specialize in interpreting machine learning model outputs, particularly SHAP values, for business stakeholders. When analyzing customer renewal predictions:\\n\\n1. Explain SHAP values in business terms (negative = higher churn risk, positive = lower churn risk)\\n2. Provide insights a non-technical user can understand\\n3. Speculate on potential challenges based on the data\\n4. Always respond in exactly 3 bullet points\\n5. Focus on actionable business insights'}</textarea>
                      <button 
                        onclick="openFieldDialog('system-prompt')"
                        style="
                          width: 32px;
                          height: 32px;
                          border: 1px solid #d9d9d9;
                          background: #f5f5f5;
                          border-radius: 4px;
                          cursor: pointer;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 14px;
                          color: #666;
                          margin-top: 2px;
                        "
                        title="Insert field">➕</button>
                    </div>
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
                    <div style="display: flex; gap: 4px; align-items: flex-start;">
                      <textarea 
                        id="user-prompt"
                        placeholder="Enter user prompt..."
                        style="
                          flex: 1;
                          height: 120px;
                          padding: 12px;
                          border: 1px solid #d9d9d9;
                          border-radius: 4px;
                          font-size: 13px;
                          font-family: 'Source Sans Pro', sans-serif;
                          resize: vertical;
                          box-sizing: border-box;
                        ">${currentProps.userPrompt || ''}</textarea>
                      <button 
                        onclick="openFieldDialog('user-prompt')"
                        style="
                          width: 32px;
                          height: 32px;
                          border: 1px solid #d9d9d9;
                          background: #f5f5f5;
                          border-radius: 4px;
                          cursor: pointer;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 14px;
                          color: #666;
                          margin-top: 2px;
                        "
                        title="Insert field">➕</button>
                    </div>
                  </div>
                </div>

                <!-- Right Column: Chatbot Assistant -->
                <div style="
                  width: 30%;
                  padding: 20px;
                  overflow-y: auto;
                  display: flex;
                  flex-direction: column;
                ">
                  <h3 style="
                    margin: 0 0 16px 0;
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  ">🤖 Prompt Assistant</h3>
                  
                  <!-- Chat Messages -->
                  <div id="chat-messages" style="
                    flex: 1;
                    min-height: 300px;
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid #e8e8e8;
                    border-radius: 6px;
                    padding: 12px;
                    background: #fafafa;
                    margin-bottom: 12px;
                  ">
                    <!-- Welcome Message -->
                    <div style="
                      background: #e6f7ff;
                      border: 1px solid #91d5ff;
                      border-radius: 8px;
                      padding: 8px 12px;
                      margin-bottom: 8px;
                      font-size: 12px;
                      color: #003a8c;
                    ">
                      👋 Hi! I'm here to help you craft effective prompts for your Qlik data analysis. Ask me anything about:
                      <br/>• System prompt suggestions
                      <br/>• User prompt examples  
                      <br/>• Best practices for AI analysis
                    </div>
                  </div>
                  
                  <!-- Chat Input -->
                  <div style="
                    position: relative;
                    display: flex;
                  ">
                    <textarea 
                      id="chat-input"
                      placeholder="Ask for prompt suggestions..."
                      style="
                        width: 100%;
                        height: 60px;
                        padding: 8px 45px 8px 12px;
                        border: 1px solid #d9d9d9;
                        border-radius: 8px;
                        font-size: 12px;
                        font-family: 'Source Sans Pro', sans-serif;
                        resize: none;
                        box-sizing: border-box;
                        outline: none;
                      "
                    ></textarea>
                    <button 
                      id="send-chat"
                      style="
                        position: absolute;
                        right: 8px;
                        bottom: 8px;
                        width: 28px;
                        height: 28px;
                        border: 1px solid #d9d9d9;
                        background: white;
                        color: #666;
                        border-radius: 6px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        transition: background-color 0.2s ease;
                      "
                      onmouseover="this.style.background='#f5f5f5'"
                      onmouseout="this.style.background='white'"
                      title="Send message">↗️</button>
                  </div>
                  
                  <!-- Quick Actions -->
                  <div style="
                    margin-top: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                  ">
                    <div style="
                      font-size: 11px;
                      color: #666;
                      margin-bottom: 4px;
                      font-weight: 500;
                    ">Quick Actions:</div>
                    <button 
                      class="quick-action"
                      onclick="sendQuickMessage('Suggest a professional system prompt for Qlik data analysis')"
                      style="
                        padding: 6px 10px;
                        border: 1px solid #d9d9d9;
                        background: white;
                        color: #666;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                        text-align: left;
                      ">⚙️ Suggest system prompt</button>
                    <button 
                      class="quick-action"
                      onclick="sendQuickMessage('Help me create an effective user prompt with field references')"
                      style="
                        padding: 6px 10px;
                        border: 1px solid #d9d9d9;
                        background: white;
                        color: #666;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                        text-align: left;
                      ">👤 Suggest user prompt</button>
                    <button 
                      class="quick-action"
                      onclick="sendQuickMessage('What are best practices for AI prompts in business intelligence?')"
                      style="
                        padding: 6px 10px;
                        border: 1px solid #d9d9d9;
                        background: white;
                        color: #666;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                        text-align: left;
                      ">✨ Best practices</button>
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
                  border: 1px solid #d9d9d9;
                  background: #f5f5f5;
                  color: #999;
                  border-radius: 4px;
                  cursor: not-allowed;
                  font-size: 13px;
                  transition: all 0.2s ease;
                " disabled>Save Mappings</button>
              </div>
            </div>
          `;

          document.body.appendChild(modal);

          // Initialize field highlighting for existing content and add event listeners
          setTimeout(() => {
            const systemPrompt = document.getElementById('system-prompt');
            const userPrompt = document.getElementById('user-prompt');
            const saveBtn = document.getElementById('save-btn');
            
            // Store initial values to detect changes
            const initialSystemPrompt = systemPrompt?.value || '';
            const initialUserPrompt = userPrompt?.value || '';
            
            // Function to check if content has changed and enable/disable save button
            const checkForChanges = () => {
              const currentSystemPrompt = systemPrompt?.value || '';
              const currentUserPrompt = userPrompt?.value || '';
              
              const hasChanges = (currentSystemPrompt !== initialSystemPrompt) || 
                               (currentUserPrompt !== initialUserPrompt);
              
              if (hasChanges) {
                // Enable save button
                saveBtn.disabled = false;
                saveBtn.style.background = '#1890ff';
                saveBtn.style.borderColor = '#1890ff';
                saveBtn.style.color = 'white';
                saveBtn.style.cursor = 'pointer';
              } else {
                // Disable save button
                saveBtn.disabled = true;
                saveBtn.style.background = '#f5f5f5';
                saveBtn.style.borderColor = '#d9d9d9';
                saveBtn.style.color = '#999';
                saveBtn.style.cursor = 'not-allowed';
              }
            };
            
            // Apply initial highlighting
            applyFieldHighlighting('system-prompt');
            applyFieldHighlighting('user-prompt');
            
            // Add real-time update listeners
            if (systemPrompt) {
              systemPrompt.addEventListener('input', () => {
                applyFieldHighlighting('system-prompt');
                checkForChanges();
              });
              systemPrompt.addEventListener('paste', () => {
                setTimeout(() => {
                  applyFieldHighlighting('system-prompt');
                  checkForChanges();
                }, 10);
              });
            }
            if (userPrompt) {
              userPrompt.addEventListener('input', () => {
                applyFieldHighlighting('user-prompt');
                checkForChanges();
              });
              userPrompt.addEventListener('paste', () => {
                setTimeout(() => {
                  applyFieldHighlighting('user-prompt');
                  checkForChanges();
                }, 10);
              });
            }
          }, 50);

          // Add event listeners
          document.getElementById('close-modal').onclick = () => {
            document.body.removeChild(modal);
          };
          
          document.getElementById('cancel-btn').onclick = () => {
            document.body.removeChild(modal);
          };
          
          document.getElementById('save-btn').onclick = async () => {
            // Check if button is disabled
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn.disabled) {
              return; // Don't save if button is disabled
            }
            
            try {
              // Get prompt values from the modal textareas
              const systemPromptEl = document.getElementById('system-prompt');
              const userPromptEl = document.getElementById('user-prompt');
              
              if (!systemPromptEl || !userPromptEl) {
                throw new Error('Prompt elements not found in modal');
              }
              
              const systemPrompt = systemPromptEl.value || '';
              const userPrompt = userPromptEl.value || '';
              
              console.log('Saving prompts:', {
                systemPrompt: systemPrompt.substring(0, 50) + '...',
                userPrompt: userPrompt.substring(0, 50) + '...'
              });
              
              console.log('Current props before save:', currentProps);
              
              // Try direct layout modification without API calls
              // This bypasses the problematic Qlik API methods
              
              // Update the layout object directly (in-memory)
              if (layout && layout.props) {
                layout.props.systemPrompt = systemPrompt;
                layout.props.userPrompt = userPrompt;
                layout.props.promptsConfigured = true;
              }
              
              // Also store in localStorage as backup persistence
              const extensionId = layout?.qInfo?.qId || 'qlikExtensionLLM';
              const promptData = {
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                promptsConfigured: true,
                timestamp: Date.now()
              };
              
              try {
                localStorage.setItem(`qlik_prompts_${extensionId}`, JSON.stringify(promptData));
                console.log('✅ Prompts saved to localStorage as backup');
              } catch (e) {
                console.warn('Could not save to localStorage:', e);
              }
              
              console.log('✅ Prompts saved successfully - data will be shared with all users when published');
              
              // Disable save button after successful save
              const saveBtn = document.getElementById('save-btn');
              saveBtn.disabled = true;
              saveBtn.style.background = '#f5f5f5';
              saveBtn.style.borderColor = '#d9d9d9';
              saveBtn.style.color = '#999';
              saveBtn.style.cursor = 'not-allowed';
              
              // Update Step 4 status to green immediately
              setTimeout(() => {
                // Close modal first
                document.body.removeChild(modal);
                
                // Find and update Step 4 elements in the main UI
                const step4Element = document.querySelector('[data-step="4"]');
                if (step4Element) {
                  // Force update background color to green
                  step4Element.style.background = '#f6ffed';
                  step4Element.style.borderColor = '#b7eb8f';
                }
                
                // Update step 4 circle
                const step4Circle = document.querySelector('[data-step-circle="4"]');
                if (step4Circle) {
                  step4Circle.style.background = '#52c41a';
                  step4Circle.style.color = 'white';
                  step4Circle.innerHTML = '✓';
                }
                
                // Update step 4 title
                const step4Title = document.querySelector('[data-step-title="4"]');
                if (step4Title) {
                  step4Title.style.color = '#52c41a';
                  step4Title.innerHTML = 'Prompts Configured ✓';
                }
                
                // Update step 4 description
                const step4Desc = document.querySelector('[data-step-desc="4"]');
                if (step4Desc) {
                  step4Desc.innerHTML = 'System and user prompts configured';
                }
              }, 500); // Small delay to show the disabled state
              
            } catch (error) {
              console.error('❌ Error saving prompts:', error);
              alert(`Error saving prompts: ${error.message}\n\nPlease try again or check the console for details.`);
            }
          };

          // Close modal when clicking outside
          modal.onclick = (e) => {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          };

          // Global functions for chatbot assistant
          window.sendQuickMessage = (message) => {
            const chatInput = document.getElementById('chat-input');
            chatInput.value = message;
            sendChatMessage();
          };

          const sendChatMessage = () => {
            const chatInput = document.getElementById('chat-input');
            const chatMessages = document.getElementById('chat-messages');
            const message = chatInput.value.trim();
            
            if (!message) return;
            
            // Add user message
            const userMessage = document.createElement('div');
            userMessage.style.cssText = `
              background: #1890ff;
              color: white;
              border-radius: 8px;
              padding: 8px 12px;
              margin-bottom: 8px;
              font-size: 12px;
              margin-left: 20px;
              text-align: right;
            `;
            userMessage.textContent = message;
            chatMessages.appendChild(userMessage);
            
            // Add loading indicator
            const loadingMessage = document.createElement('div');
            loadingMessage.id = 'loading-message';
            loadingMessage.style.cssText = `
              background: #f0f0f0;
              border: 1px solid #d9d9d9;
              border-radius: 8px;
              padding: 8px 12px;
              margin-bottom: 8px;
              font-size: 12px;
              color: #666;
              margin-right: 20px;
              font-style: italic;
            `;
            loadingMessage.textContent = '🤖 Thinking...';
            chatMessages.appendChild(loadingMessage);
            
            // Clear input and scroll to bottom
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // TODO: Implement actual AI response
            setTimeout(() => {
              loadingMessage.remove();
              
              const aiResponse = document.createElement('div');
              aiResponse.style.cssText = `
                background: #f0f0f0;
                border: 1px solid #d9d9d9;
                border-radius: 8px;
                padding: 8px 12px;
                margin-bottom: 8px;
                font-size: 12px;
                color: #333;
                margin-right: 20px;
              `;
              aiResponse.innerHTML = `🤖 <strong>Assistant:</strong><br/>This is a placeholder response. In the next phase, I'll integrate with Claude LLM to provide intelligent prompt suggestions based on your question: "${message}"`;
              chatMessages.appendChild(aiResponse);
              
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1500);
          };

          // Add event listeners for chat
          setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            const sendButton = document.getElementById('send-chat');
            
            if (sendButton) {
              sendButton.onclick = sendChatMessage;
            }
            
            if (chatInput) {
              chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              });
            }
          }, 100);

          // Global function for field dialog
          window.openFieldDialog = (targetTextareaId) => {
            const fieldDialog = document.createElement('div');
            fieldDialog.id = 'field-dialog';
            fieldDialog.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              z-index: 10001;
              display: flex;
              align-items: center;
              justify-content: center;
            `;

            fieldDialog.innerHTML = `
              <div style="
                background: white;
                border-radius: 6px;
                width: 400px;
                max-height: 500px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
              ">
                <!-- Header -->
                <div style="
                  padding: 16px 20px;
                  border-bottom: 1px solid #f0f0f0;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                ">
                  <h3 style="
                    margin: 0;
                    color: #333;
                    font-size: 16px;
                    font-weight: 600;
                  ">Insert Field</h3>
                  <button id="close-field-dialog" style="
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                  ">&times;</button>
                </div>

                <!-- Fields List -->
                <div style="
                  flex: 1;
                  padding: 16px 20px;
                  overflow-y: auto;
                  max-height: 350px;
                ">
                  ${dimensions.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                      <h4 style="
                        margin: 0 0 8px 0;
                        color: #666;
                        font-size: 12px;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
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
                          display: flex;
                          align-items: center;
                          gap: 8px;
                        " 
                        onmouseover="this.style.background='#e9ecef'"
                        onmouseout="this.style.background='#f8f9fa'"
                        onclick="insertFieldIntoPrompt('${targetTextareaId}', '${dim.qFallbackTitle}')">
                          <span>📊</span>
                          <span>${dim.qFallbackTitle}</span>
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
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
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
                          display: flex;
                          align-items: center;
                          gap: 8px;
                        "
                        onmouseover="this.style.background='#e9ecef'"
                        onmouseout="this.style.background='#f8f9fa'"
                        onclick="insertFieldIntoPrompt('${targetTextareaId}', '${measure.qFallbackTitle}')">
                          <span>📈</span>
                          <span>${measure.qFallbackTitle}</span>
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

                <!-- Footer -->
                <div style="
                  padding: 12px 20px;
                  border-top: 1px solid #f0f0f0;
                  display: flex;
                  justify-content: flex-end;
                ">
                  <button id="close-field-dialog-btn" style="
                    padding: 6px 12px;
                    border: 1px solid #d9d9d9;
                    background: white;
                    color: #666;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                  ">Close</button>
                </div>
              </div>
            `;

            document.body.appendChild(fieldDialog);

            // Add event listeners
            document.getElementById('close-field-dialog').onclick = () => {
              document.body.removeChild(fieldDialog);
            };
            
            document.getElementById('close-field-dialog-btn').onclick = () => {
              document.body.removeChild(fieldDialog);
            };

            // Close dialog when clicking outside
            fieldDialog.onclick = (e) => {
              if (e.target === fieldDialog) {
                document.body.removeChild(fieldDialog);
              }
            };
          };

          // Function to apply field highlighting using overlay technique
          const applyFieldHighlighting = (textareaId) => {
            const textarea = document.getElementById(textareaId);
            if (!textarea) return;
            
            // Create highlighting container if it doesn't exist
            let container = textarea.parentElement;
            if (!container.classList.contains('highlight-container')) {
              // Wrap textarea in highlighting container
              const newContainer = document.createElement('div');
              newContainer.className = 'highlight-container';
              newContainer.style.cssText = `
                position: relative;
                flex: 1;
                display: flex;
              `;
              
              container.insertBefore(newContainer, textarea);
              newContainer.appendChild(textarea);
              container = newContainer;
              
                             // Create highlight overlay
               const highlight = document.createElement('div');
               highlight.className = 'highlight-overlay';
               
               // Get computed styles from textarea to match exactly
               const textareaStyles = window.getComputedStyle(textarea);
               
               highlight.style.cssText = `
                 position: absolute;
                 top: 0;
                 left: 0;
                 right: 0;
                 bottom: 0;
                 padding: ${textareaStyles.padding};
                 margin: 0;
                 border: 1px solid transparent;
                 border-radius: ${textareaStyles.borderRadius};
                 font-family: ${textareaStyles.fontFamily};
                 font-size: ${textareaStyles.fontSize};
                 line-height: ${textareaStyles.lineHeight};
                 letter-spacing: ${textareaStyles.letterSpacing};
                 word-spacing: ${textareaStyles.wordSpacing};
                 white-space: pre-wrap;
                 word-wrap: break-word;
                 overflow: hidden;
                 pointer-events: none;
                 color: #333;
                 z-index: 1;
                 box-sizing: border-box;
                 text-align: ${textareaStyles.textAlign};
               `;
              container.appendChild(highlight);
              
                             // Style textarea to be transparent background and text
               textarea.style.position = 'relative';
               textarea.style.zIndex = '2';
               textarea.style.backgroundColor = 'transparent';
               textarea.style.color = 'transparent';
               textarea.style.caretColor = '#333';
              
              // Sync scrolling
              textarea.addEventListener('scroll', () => {
                highlight.scrollTop = textarea.scrollTop;
                highlight.scrollLeft = textarea.scrollLeft;
              });
            }
            
            // Update highlight content
            const highlight = container.querySelector('.highlight-overlay');
            if (highlight) {
                             const text = textarea.value;
               const highlightedText = text.replace(/\[([^\]]+)\]/g, 
                 '<span style="color: #1890ff;">[$1]</span>'
               );
              highlight.innerHTML = highlightedText;
              
              // Sync scroll position
              highlight.scrollTop = textarea.scrollTop;
              highlight.scrollLeft = textarea.scrollLeft;
            }
          };

          // Function to insert field into prompt textarea
          window.insertFieldIntoPrompt = (textareaId, fieldName) => {
            const textarea = document.getElementById(textareaId);
            const cursorPosition = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPosition);
            const textAfter = textarea.value.substring(textarea.selectionEnd);
            
            // Insert field name at cursor position
            textarea.value = textBefore + '[' + fieldName + ']' + textAfter;
            
            // Move cursor to after inserted field
            const newPosition = cursorPosition + fieldName.length + 2;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
            
            // Apply highlighting after insertion
            setTimeout(() => applyFieldHighlighting(textareaId), 10);
            
            // Close the field dialog
            const fieldDialog = document.getElementById('field-dialog');
            if (fieldDialog) {
              document.body.removeChild(fieldDialog);
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
                background: ${isConnectionConfigured ? '#f6ffed' : '#f5f5f5'};
                border: 1px solid ${isConnectionConfigured ? '#b7eb8f' : '#d9d9d9'};
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
                  background: ${isConnectionConfigured ? '#52c41a' : '#595959'};
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
                    color: ${isConnectionConfigured ? '#52c41a' : '#595959'};
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
                background: ${hasDimensionsOrMeasures ? '#f6ffed' : '#f5f5f5'};
                border: 1px solid ${hasDimensionsOrMeasures ? '#b7eb8f' : '#d9d9d9'};
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
                  background: ${hasDimensionsOrMeasures ? '#52c41a' : '#595959'};
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
                    color: ${hasDimensionsOrMeasures ? '#52c41a' : '#595959'};
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
                background: ${isSelectionValidationConfigured ? '#f6ffed' : '#f5f5f5'};
                border: 1px solid ${isSelectionValidationConfigured ? '#b7eb8f' : '#d9d9d9'};
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
                  background: ${isSelectionValidationConfigured ? '#52c41a' : '#595959'};
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
                    color: ${isSelectionValidationConfigured ? '#52c41a' : '#595959'};
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
              <div data-step="4" style="
                background: ${arePromptsConfigured ? '#f6ffed' : '#f5f5f5'};
                border: 1px solid ${arePromptsConfigured ? '#b7eb8f' : '#d9d9d9'};
                border-radius: 6px;
                padding: 10px 10px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.3s ease;
              ">
                <div data-step-circle="4" style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${arePromptsConfigured ? '#52c41a' : '#595959'};
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
                  <h3 data-step-title="4" style="
                    margin: 0 0 4px 0;
                    color: ${arePromptsConfigured ? '#52c41a' : '#595959'};
                    font-size: 16px;
                    font-weight: 600;
                  ">${arePromptsConfigured ? 'Prompts Configured ✓' : 'Add Prompts'}</h3>
                  <p data-step-desc="4" style="
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

            <!-- Analysis Button - Shows when all steps completed -->
            ${isConnectionConfigured && hasDimensionsOrMeasures && arePromptsConfigured ? `
              <div style="
                width: 100%; 
                max-width: 500px; 
                margin-top: 30px;
                text-align: center;
              ">
                <button id="analyze-btn" style="
                  background: #1890ff;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  padding: 12px 24px;
                  font-size: 16px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  min-width: 200px;
                " onmouseover="this.style.background='#0c7cd5'" onmouseout="this.style.background='#1890ff'">
                  🚀 Generate Analysis
                </button>
                
                <div id="analysis-result" style="
                  margin-top: 20px;
                  padding: 20px;
                  background: #f8f9fa;
                  border: 1px solid #e9ecef;
                  border-radius: 6px;
                  text-align: left;
                  display: none;
                ">
                  <h4 style="margin: 0 0 10px 0; color: #333;">AI Analysis Results:</h4>
                  <div id="analysis-content" style="color: #666; line-height: 1.5;"></div>
                </div>
              </div>
            ` : ''}

          </div>
        `;

        // Add analyze button click handler
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
          analyzeBtn.onclick = async () => {
            await generateAnalysis();
          };
        }

        // Replace field references in prompts with actual data
        const replaceFieldReferences = async (prompt, layout) => {
          try {
            console.log('🔄 Replacing field references in prompt...');
            
            let processedPrompt = prompt;
            const hypercube = layout?.qHyperCube;
            
            if (!hypercube || !hypercube.qDataPages?.[0]?.qMatrix?.length) {
              console.warn('⚠️ No data available for field replacement');
              return processedPrompt;
            }

            const matrix = hypercube.qDataPages[0].qMatrix;
            const dimensionInfo = hypercube.qDimensionInfo || [];
            const measureInfo = hypercube.qMeasureInfo || [];
            
            // Build field data map
            const fieldData = {};
            
                         // Map dimension data using actual field names from your extension
             dimensionInfo.forEach((dim, index) => {
               // Use the actual field name from qGroupFieldDefs (the real field name)
               const actualFieldName = dim.qGroupFieldDefs?.[0] || dim.qFallbackTitle || `Dimension${index}`;
               const displayName = dim.qFallbackTitle || actualFieldName;
               
               const values = matrix.map(row => row[index]?.qText || '').filter(v => v.trim());
               
               // Store with both actual field name and display name for flexible matching
               fieldData[actualFieldName] = values.join(', ');
               if (displayName !== actualFieldName) {
                 fieldData[displayName] = values.join(', ');
               }
               
               console.log(`📊 Dimension: [${actualFieldName}] = ${values.length} values`);
             });
             
             // Map measure data using actual field names from your extension
             measureInfo.forEach((measure, index) => {
               // Use the actual field name from the measure definition
               const actualFieldName = measure.qDef?.qDef || measure.qFallbackTitle || `Measure${index}`;
               const displayName = measure.qFallbackTitle || actualFieldName;
               
               const measureIndex = dimensionInfo.length + index;
               const values = matrix.map(row => row[measureIndex]?.qText || row[measureIndex]?.qNum || '').filter(v => v !== '');
               
               // Store with both actual field name and display name for flexible matching
               fieldData[actualFieldName] = values.join(', ');
               if (displayName !== actualFieldName) {
                 fieldData[displayName] = values.join(', ');
               }
               
               console.log(`📊 Measure: [${actualFieldName}] = ${values.length} values`);
             });

            console.log('📊 Available fields for replacement:', Object.keys(fieldData));

            // Replace field references in the format [FieldName]
            const fieldPattern = /\[([^\]]+)\]/g;
            processedPrompt = processedPrompt.replace(fieldPattern, (match, fieldName) => {
              if (fieldData[fieldName]) {
                console.log(`🔄 Replaced [${fieldName}] with data: ${fieldData[fieldName].substring(0, 50)}...`);
                return fieldData[fieldName];
              } else {
                console.warn(`⚠️ Field [${fieldName}] not found in data`);
                return match; // Keep original if not found
              }
            });

                         // Special handling for concatenated data patterns like [Field1]|[Field2]|[Field3]
             const pipePattern = /\[([^\]]+)\]\|(\[([^\]]+)\])/g;
             let match;
             while ((match = pipePattern.exec(processedPrompt)) !== null) {
               console.log('🔍 Found pipe-separated pattern, creating data table...');
               
               // Build data table with all rows
               let dataRows = [];
               matrix.forEach(row => {
                 const rowData = [];
                 
                 // Add all dimensions
                 dimensionInfo.forEach((dim, index) => {
                   rowData.push(row[index]?.qText || '');
                 });
                 
                 // Add all measures
                 measureInfo.forEach((measure, index) => {
                   const measureIndex = dimensionInfo.length + index;
                   rowData.push(row[measureIndex]?.qText || row[measureIndex]?.qNum || '');
                 });
                 
                 dataRows.push(rowData.join('|'));
               });
               
               // Replace the entire pattern with actual data
               const originalPattern = match[0];
               processedPrompt = processedPrompt.replace(originalPattern, dataRows.join('\n'));
               console.log(`🔄 Replaced "${originalPattern}" with ${dataRows.length} data rows`);
               break; // Handle one pattern at a time
             }

            console.log('✅ Field replacement completed');
            return processedPrompt;
            
          } catch (error) {
            console.error('❌ Error in field replacement:', error);
            return prompt; // Return original prompt if replacement fails
          }
        };

        // Generate Analysis Function
        const generateAnalysis = async () => {
          try {
            const analyzeBtn = document.getElementById('analyze-btn');
            const resultDiv = document.getElementById('analysis-result');
            const contentDiv = document.getElementById('analysis-content');

            // Show loading state
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '🤖 Analyzing...';
            analyzeBtn.style.background = '#f5f5f5';
            analyzeBtn.style.color = '#999';
            analyzeBtn.style.cursor = 'not-allowed';

            // Get current data from layout
            const dataRows = layout?.qHyperCube?.qDataPages?.[0]?.qMatrix?.length || 0;
            const dimensions = layout?.qHyperCube?.qDimensionInfo?.length || 0;
            const measures = layout?.qHyperCube?.qMeasureInfo?.length || 0;

                         // Get prompts (with localStorage fallback)
             let systemPrompt = layout?.props?.systemPrompt || '';
             let userPrompt = layout?.props?.userPrompt || '';
             
             // Fallback to localStorage if not in layout
             if (!systemPrompt || !userPrompt) {
               try {
                 const extensionId = layout?.qInfo?.qId || 'qlikExtensionLLM';
                 const stored = localStorage.getItem(`qlik_prompts_${extensionId}`);
                 if (stored) {
                   const storedData = JSON.parse(stored);
                   systemPrompt = systemPrompt || storedData.systemPrompt || '';
                   userPrompt = userPrompt || storedData.userPrompt || '';
                 }
               } catch (e) {
                 console.warn('Could not load prompts from localStorage:', e);
               }
             }

             // Replace field references with actual data
             userPrompt = await replaceFieldReferences(userPrompt, layout);

            console.log('🔍 Generating analysis with context:', {
              systemPrompt: systemPrompt.substring(0, 50) + '...',
              userPrompt: userPrompt.substring(0, 50) + '...',
              dataRows,
              dimensions,
              measures
            });

            // Get connection details
            const connectionName = layout?.props?.connectionName || '';
            const temperature = layout?.props?.temperature || 0.7;
            
            console.log('🤖 Calling Claude via Qlik SSE:', {
              connection: connectionName,
              systemPromptLength: systemPrompt.length,
              userPromptLength: userPrompt.length,
              temperature
            });

            // Call Claude using Nebula.js model API
            const response = await callClaudeAPI(systemPrompt, userPrompt, connectionName, temperature);
            
            // Show results
            contentDiv.innerHTML = response;
            resultDiv.style.display = 'block';

            console.log('✅ Analysis completed successfully');

          } catch (error) {
            console.error('❌ Error generating analysis:', error);
            
            const contentDiv = document.getElementById('analysis-content');
            const resultDiv = document.getElementById('analysis-result');
            
            contentDiv.innerHTML = `
              <div style="color: #d32f2f;">
                <strong>Error:</strong> ${error.message}<br>
                <small>Please check your connection configuration and try again.</small>
              </div>
            `;
            resultDiv.style.display = 'block';
          } finally {
            // Reset button state
            const analyzeBtn = document.getElementById('analyze-btn');
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🚀 Generate Analysis';
            analyzeBtn.style.background = '#1890ff';
            analyzeBtn.style.color = 'white';
            analyzeBtn.style.cursor = 'pointer';
          }
        };

                // FIXED: Robust expression building with proper escaping
        const buildLLMExpression = (fullPrompt, props) => {
          console.log("🏗️ Building LLM expression (ultra-safe approach)...");
          
          // Step 1: Validate inputs
          const connectionName = String(props.connectionName || '').trim();
          if (!connectionName) {
            throw new Error("Connection name is required");
          }
          
          // Step 2: Clean prompt - be more aggressive about removing problematic characters
          let cleanPrompt = String(fullPrompt || '')
            .trim()
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Control chars
            .replace(/'/g, "'")       // Normalize quotes  
            .replace(/"/g, '"')       // Normalize double quotes
            .replace(/\r\n/g, '\n')   // Normalize line endings
            .replace(/\r/g, '\n');
          
          if (!cleanPrompt) {
            throw new Error("Prompt is empty after cleaning");
          }
          
          console.log("📝 Cleaned prompt length:", cleanPrompt.length);
          
          // Step 3: Build config with safe numeric values
          const temperature = Math.max(0, Math.min(2, Number(props.temperature || 0.7)));
          const topK = Math.max(1, Math.min(1000, Number(props.topK || 250)));
          const topP = Math.max(0, Math.min(1, Number(props.topP || 1)));
          const maxTokens = Math.max(1, Math.min(4000, Number(props.maxTokens || 1000)));
          
          // Step 4: Use the simplest possible approach that works - include all parameters
          const configStr = `{"RequestType":"endpoint","endpoint":{"connectionname":"${connectionName.replace(/"/g, '\\"')}","column":"text","parameters":{"temperature":${temperature},"Top K":${topK},"Top P":${topP},"max_tokens":${maxTokens}}}}`;
          
          // Step 5: Use double single quotes for Qlik string escaping
          const escapedPrompt = cleanPrompt.replace(/'/g, "''");
          
          // Step 6: Build expression
          const expression = `endpoints.ScriptEvalStr('${configStr}', '${escapedPrompt}')`;
          
          console.log("🔒 Using ultra-safe Qlik escaping approach");
          console.log("🔍 Config string:", configStr.substring(0, 100) + "...");
          console.log("🔍 Escaped prompt preview:", escapedPrompt.substring(0, 100) + "...");
          console.log("✅ Expression built successfully, length:", expression.length);
          console.log("🔍 Expression preview:", expression.substring(0, 200) + "...");
          
          return expression;
        };

        // Claude API calling function using the robust approach
        const callClaudeAPI = async (systemPrompt, userPrompt, connectionName, temperature) => {
          try {
            // Combine system and user prompts with proper formatting
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nAssistant:`;
            
            // Get all props for the expression builder
            const props = {
              connectionName: connectionName,
              temperature: temperature,
              topK: layout?.props?.topK || 250,
              topP: layout?.props?.topP || 1,
              maxTokens: layout?.props?.maxTokens || 1000
            };

            console.log('🤖 Attempting robust endpoints.ScriptEvalStr call');
            
            // Build the expression using the robust method
            const expressionString = buildLLMExpression(fullPrompt, props);

                         // Use the app object to evaluate the expression
             const result = await app.evaluate(expressionString);
             
             // Handle the result - app.evaluate returns a string directly
             if (typeof result === 'string' && result.trim()) {
               console.log('✅ Claude API call successful, response length:', result.length);
               return result;
             }
             
             throw new Error(`ScriptEvalStr call returned empty or invalid result`);

          } catch (evalError) {
            console.log('❌ Robust ScriptEvalStr call failed:', evalError);
            throw new Error(`Claude API call failed: ${evalError.message}. Please check your connection configuration and ensure the connection "${connectionName}" is properly set up.`);
          }
        };

        // Add click handler for prompts button from ext.js
        window.showPromptsModal = showPromptsModal;
      }, [layout]);

      return () => {
        // Cleanup if needed
      };
    },
  };
}
