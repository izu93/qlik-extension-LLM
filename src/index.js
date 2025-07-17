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
                        ">${layout?.props?.systemPrompt || 'You are a helpful and professional analytical assistant inside a Qlik Cloud Analytics application. Use the structured data provided in the user prompt along with any additional context they provide to generate your response. Always respond in exactly three bullets. Do not explain your methodology or how you arrived at your answers. Maintain a friendly and respectful tone.'}</textarea>
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
                        ">${layout?.props?.userPrompt || ''}</textarea>
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
                    display: flex;
                    gap: 8px;
                    align-items: flex-end;
                  ">
                    <textarea 
                      id="chat-input"
                      placeholder="Ask for prompt suggestions..."
                      style="
                        flex: 1;
                        height: 60px;
                        padding: 8px 12px;
                        border: 1px solid #d9d9d9;
                        border-radius: 4px;
                        font-size: 12px;
                        font-family: 'Source Sans Pro', sans-serif;
                        resize: none;
                        box-sizing: border-box;
                      "
                    ></textarea>
                    <button 
                      id="send-chat"
                      style="
                        width: 36px;
                        height: 36px;
                        border: 1px solid #1890ff;
                        background: #1890ff;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        margin-bottom: 2px;
                      "
                      title="Send message">📤</button>
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
                      ">🤖 Suggest system prompt</button>
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

          // Initialize field highlighting for existing content and add event listeners
          setTimeout(() => {
            const systemPrompt = document.getElementById('system-prompt');
            const userPrompt = document.getElementById('user-prompt');
            
            // Apply initial highlighting
            applyFieldHighlighting('system-prompt');
            applyFieldHighlighting('user-prompt');
            
            // Add real-time update listeners
            if (systemPrompt) {
              systemPrompt.addEventListener('input', () => applyFieldHighlighting('system-prompt'));
              systemPrompt.addEventListener('paste', () => setTimeout(() => applyFieldHighlighting('system-prompt'), 10));
            }
            if (userPrompt) {
              userPrompt.addEventListener('input', () => applyFieldHighlighting('user-prompt'));
              userPrompt.addEventListener('paste', () => setTimeout(() => applyFieldHighlighting('user-prompt'), 10));
            }
          }, 50);

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
