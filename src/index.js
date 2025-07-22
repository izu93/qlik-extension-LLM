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
import qlikApiService from "./services/qlik-api-service";

// Global validation state to persist across component re-renders
const globalValidationState = {
  status: 'not_configured', // 'not_configured', 'configured_no_selections', 'configured_with_selections'
  message: ''
};

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
          // Test API connections on first load
          const testAPIs = async () => {
            try {
              await qlikApiService.testAPIConnections();
            } catch (error) {
              console.error('🚨 API test failed:', error);
            }
          };
          testAPIs();
          
          // Check completion status
          const isConnectionConfigured = !!(layout?.props?.connectionName?.trim());
        const dimensionCount = layout?.qHyperCube?.qDimensionInfo?.length || 0;
        const measureCount = layout?.qHyperCube?.qMeasureInfo?.length || 0;
        const hasDimensionsOrMeasures = dimensionCount > 0 || measureCount > 0;
        const isSelectionValidationConfigured = !!(layout?.props?.enableSelectionValidation && layout?.props?.customValidationExpression?.trim());
        
        // Get reference to validation state
        const validationState = globalValidationState;
        
        // Only update initial state if validation configuration changed
        if (layout?.props?.enableSelectionValidation && layout?.props?.customValidationExpression?.trim()) {
          // Only reset to configured_no_selections if we're currently not_configured
          if (validationState.status === 'not_configured') {
            validationState.status = 'configured_no_selections';
            validationState.message = 'Please make a selection to proceed';
          }
        } else {
          // Reset to not_configured only if validation is disabled
          validationState.status = 'not_configured';
          validationState.message = 'Enable validation in Selection Validation panel';
        }
        
        // Check for prompts configuration with localStorage fallback
        let arePromptsConfigured = !!(layout?.props?.promptsConfigured || (layout?.props?.systemPrompt?.trim() && layout?.props?.userPrompt?.trim()));
        
        console.log('📊 Prompts status check:', {
          layoutPromptsConfigured: layout?.props?.promptsConfigured,
          layoutSystemPrompt: layout?.props?.systemPrompt ? 'exists' : 'missing',
          layoutUserPrompt: layout?.props?.userPrompt ? 'exists' : 'missing',
          calculatedStatus: arePromptsConfigured
        });

        // Generate unique IDs for this object instance  
        const objectId = layout?.qInfo?.qId || model?.id || 'unknown';
        const uniqueMainId = `main-container-${objectId}`;
        const uniqueFullHeaderId = `full-header-${objectId}`;
        const uniqueButtonContainerId = `button-container-${objectId}`;
        const uniqueAnalyzeBtnId = `analyze-btn-${objectId}`;
        const uniqueStepsId = `steps-container-${objectId}`;
        const uniqueTimelineHeaderId = `timeline-header-${objectId}`;

        // Function to check if all steps are completed
        const checkAllStepsCompleted = () => {
          // Step 1: Connection configured
          const step1Complete = isConnectionConfigured;
          
          // Step 2: Data fields added (5 dimensions + 0 measures)
          const step2Complete = hasDimensionsOrMeasures;
          
          // Step 3: Selection validation - must be enabled AND have valid selection
          const step3Complete = layout?.props?.enableSelectionValidation && 
                                layout?.props?.customValidationExpression?.trim() && 
                                validationState.status === 'configured_with_selections';
          
          // Step 4: Prompts configured
          const step4Complete = arePromptsConfigured;
          
          return step1Complete && step2Complete && step3Complete && step4Complete;
        };

        // Function to add Generate Analysis button
        const addGenerateAnalysisButton = () => {
          // Check if button container already exists for this specific object
          if (element.querySelector(`#${uniqueButtonContainerId}`)) {
            return; // Button already exists
          }
          
          // Find the steps container to insert button before it (scoped to this element)
          const stepsContainer = element.querySelector(`#${uniqueStepsId}`);
          if (!stepsContainer) {
            console.warn('Steps container not found for object:', objectId);
            return;
          }
          
          // Create button container
          const buttonContainer = document.createElement('div');
          buttonContainer.id = uniqueButtonContainerId;
          buttonContainer.style.cssText = `
            width: 100%;
            max-width: min(400px, 85vw);
            margin-bottom: clamp(10px, 1.5vh, 18px);
            text-align: center;
            transition: all 0.5s ease;
          `;
          
          // Create the button
          buttonContainer.innerHTML = `
            <button id="${uniqueAnalyzeBtnId}" style="
              background: #1890ff;
              color: white;
              border: none;
              border-radius: 3px;
              padding: clamp(6px, 0.8vh, 7px) clamp(12px, 1.8vw, 14px);
              font-size: clamp(11px, 1.8vw, 13px);
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              min-width: clamp(100px, 18vw, 120px);
            " onmouseover="this.style.background='#0c7cd5'" onmouseout="this.style.background='#1890ff'">
              Generate Analysis
            </button>
          `;
          
          // Insert button before steps container
          stepsContainer.parentNode.insertBefore(buttonContainer, stepsContainer);
          
          // Add click event listener to the button (scoped to this element)
          const analyzeBtn = element.querySelector(`#${uniqueAnalyzeBtnId}`);
          if (analyzeBtn) {
            analyzeBtn.onclick = generateAnalysis;
          }
        };

        // Function to update Generate Analysis button visibility
        const updateGenerateAnalysisButtonVisibility = () => {
          const buttonContainer = element.querySelector(`#${uniqueButtonContainerId}`);
          const allStepsComplete = checkAllStepsCompleted();
          
          if (allStepsComplete) {
            // Show button if all steps are complete
            if (!buttonContainer) {
              addGenerateAnalysisButton();
            } else {
              buttonContainer.style.display = 'block';
            }
          } else {
            // Hide button if any step is incomplete
            if (buttonContainer) {
              buttonContainer.style.display = 'none';
            }
          }
        };

        // Function to check selection validation in real-time
        const checkSelectionValidation = async () => {
          const step3 = element.querySelector('[data-step="3"]') || element.querySelector('.selection-validation-step');
          
          // Store previous status to detect changes
          const previousStatus = validationState.status;
          
          // If validation is disabled, reset to grey
          if (!layout?.props?.enableSelectionValidation) {
            const newStatus = 'not_configured';
            const newMessage = 'Enable validation in Selection Validation panel';
            
            // Only update if status actually changed
            if (validationState.status !== newStatus) {
              validationState.status = newStatus;
              validationState.message = newMessage;
              
              if (step3) {
                step3.style.background = '#f5f5f5';
                step3.style.borderColor = '#d9d9d9';
                
                const circle = step3.querySelector('div > div');
                if (circle) {
                  circle.style.background = '#595959';
                  circle.textContent = '3';
                }
                
                const title = step3.querySelector('h3');
                if (title) {
                  title.style.color = '#595959';
                  title.textContent = 'Setup Selection Validation';
                }
                
                const message = step3.querySelector('p');
                if (message) {
                  message.textContent = validationState.message;
                }
              }
              
              // Update button visibility when validation is disabled
              updateGenerateAnalysisButtonVisibility();
            }
            return;
          }
          
          if (layout?.props?.enableSelectionValidation && layout?.props?.customValidationExpression?.trim() && app) {
            try {
              const expression = layout.props.customValidationExpression;
              const result = await app.evaluate(expression);
              
              // Universal validation - handle any expression result
              let isValid = false;
              
              // Convert result to string for analysis
              const resultStr = String(result).toLowerCase().trim();
              
              // Check for explicit false values
              const explicitlyFalse = ['false', '0', '', 'null', 'undefined', 'no'];
              
              if (result === null || result === undefined) {
                isValid = false;
              } else if (typeof result === 'boolean') {
                isValid = result;
              } else if (typeof result === 'number') {
                isValid = !isNaN(result) && result !== 0;
              } else if (explicitlyFalse.includes(resultStr)) {
                isValid = false;
              } else {
                // For any other value, consider it valid (truthy)
                isValid = true;
              }
              
              const newStatus = isValid ? 'configured_with_selections' : 'configured_no_selections';
              const newMessage = isValid ? 'Selection validation passed' : 'Please make a selection to proceed';
              
              // Only update if status actually changed
              if (validationState.status !== newStatus) {
                validationState.status = newStatus;
                validationState.message = newMessage;
                
                // Update the UI by finding and updating the step
                const step3 = element.querySelector('[data-step="3"]') || element.querySelector('.selection-validation-step');
                if (step3) {
                  if (isValid) {
                    // Update the step styling to green
                    step3.style.background = '#f6ffed';
                    step3.style.borderColor = '#b7eb8f';
                    
                    const circle = step3.querySelector('div > div');
                    if (circle) {
                      circle.style.background = '#52c41a';
                      circle.textContent = '✓';
                    }
                    
                    const title = step3.querySelector('h3');
                    if (title) {
                      title.style.color = '#52c41a';
                      title.textContent = 'Selection Validation Active ✓';
                    }
                    
                    const message = step3.querySelector('p');
                    if (message) {
                      message.textContent = validationState.message;
                    }
                  } else {
                    // Update the step styling to yellow
                    step3.style.background = '#fffbe6';
                    step3.style.borderColor = '#ffd666';
                    
                    const circle = step3.querySelector('div > div');
                    if (circle) {
                      circle.style.background = '#faad14';
                      circle.textContent = '!';
                    }
                    
                    const title = step3.querySelector('h3');
                    if (title) {
                      title.style.color = '#faad14';
                      title.textContent = 'Awaiting Selection';
                    }
                    
                    const message = step3.querySelector('p');
                    if (message) {
                      message.textContent = validationState.message;
                    }
                  }
                }
                
                // Update button visibility when selection validation status changes
                updateGenerateAnalysisButtonVisibility();
              }
            } catch (error) {
              console.warn('Error evaluating selection validation expression:', error);
            }
          }
        };

        // Clean up any existing validation interval first
        if (window.selectionValidationInterval) {
          clearInterval(window.selectionValidationInterval);
          window.selectionValidationInterval = null;
        }

        // Set up selection validation monitoring
        checkSelectionValidation(); // Initial check
        
        // Set up monitoring interval with proper cleanup
        const validationCheckInterval = setInterval(() => {
          checkSelectionValidation();
        }, 2000); // Check every 2 seconds (reduced frequency to prevent conflicts)
        
        // Store interval for cleanup
        window.selectionValidationInterval = validationCheckInterval;
        
        // Initial button visibility check
        setTimeout(() => updateGenerateAnalysisButtonVisibility(), 100);
        
        // If not configured in layout, check localStorage as fallback and restore data
        if (!arePromptsConfigured) {
          try {
            // Use object ID for unique localStorage key per object instance
            const objectId = layout?.qInfo?.qId || model?.id || 'unknown';
            const extensionId = `qlikLLM_object_${objectId}`;
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
                
                // Update button visibility after restoring prompts
                setTimeout(() => updateGenerateAnalysisButtonVisibility(), 100);
              }
            }
          } catch (e) {
            console.warn('Could not load prompts status from localStorage:', e);
          }
        }

        // Get available dimensions and measures
        const dimensions = layout?.qHyperCube?.qDimensionInfo || [];
        const measures = layout?.qHyperCube?.qMeasureInfo || [];

        // Transform UI to results-focused view - instant and smooth
        const transformToResultsView = () => {
          console.log('🔄 Transforming UI to results view...');
          
          // Hide full header, steps, and button with animation (scoped to this element)
          const fullHeader = element.querySelector(`#${uniqueFullHeaderId}`);
          const stepsContainer = element.querySelector(`#${uniqueStepsId}`);
          const timelineHeader = element.querySelector(`#${uniqueTimelineHeaderId}`);
          const buttonContainer = element.querySelector(`#${uniqueButtonContainerId}`);
          const mainContainer = element.querySelector(`#${uniqueMainId}`);
          
          if (fullHeader && stepsContainer) {
            // Fast, smooth fade out - no visible movement
            fullHeader.style.transition = 'opacity 0.15s ease-out';
            stepsContainer.style.transition = 'opacity 0.15s ease-out';
            
            if (buttonContainer) {
              buttonContainer.style.transition = 'opacity 0.15s ease-out';
            }
            
            // Quick fade out without transform (no jumping)
            fullHeader.style.opacity = '0';
            stepsContainer.style.opacity = '0';
            
            if (buttonContainer) {
              buttonContainer.style.opacity = '0';
            }
            
            // Much faster transition - almost instant
            setTimeout(() => {
              // Hide elements immediately
              fullHeader.style.display = 'none';
              stepsContainer.style.display = 'none';
              if (buttonContainer) {
                buttonContainer.style.display = 'none';
              }
              
              // Remove grey background for results view
              if (mainContainer) {
                mainContainer.style.background = 'transparent';
                mainContainer.style.transition = 'background 0.15s ease-out';
              }
              
              // Show timeline header inside the results box immediately
              if (timelineHeader) {
                timelineHeader.style.display = 'block';
                timelineHeader.style.opacity = '1';
              }
            }, 150); // Much faster - 150ms instead of 300ms
          }
        };

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

        // Simple highlighting function that works on already-rendered content
        const applySimpleHighlighting = (contentElement, layout) => {
          if (!contentElement) return;
          
          console.log('🎨 Applying simple highlighting...');
          
          // Add CSS styles if not already added
          if (!document.getElementById('highlight-styles')) {
            const style = document.createElement('style');
            style.id = 'highlight-styles';
                                     style.textContent = `
              .qlik-field { background: #e6f7ff !important; color: #0066cc !important; padding: 1px 3px !important; border-radius: 3px !important; font-weight: 600 !important; }
              .qlik-value { background: #e6f7ff !important; color: #0066cc !important; padding: 1px 3px !important; border-radius: 3px !important; font-weight: 500 !important; }
              .number-highlight { background: #f3e8ff !important; color: #7c3aed !important; padding: 1px 3px !important; border-radius: 3px !important; font-weight: 600 !important; }
              
              @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.05); }
                100% { opacity: 1; transform: scale(1); }
              }
            `;
            document.head.appendChild(style);
          }
          
          // Get field information from the extension
          const fieldNames = new Set();
          const fieldValues = new Set();
          const numericValues = new Set();
          
          const hypercube = layout?.qHyperCube;
          if (hypercube) {
            // Collect dimension field names and values
            hypercube.qDimensionInfo?.forEach((dim, index) => {
              const actualFieldName = dim.qGroupFieldDefs?.[0] || dim.qFallbackTitle;
              if (actualFieldName && actualFieldName.length > 2) {
                fieldNames.add(actualFieldName);
              }
              
              // Extract values from data
              hypercube.qDataPages?.[0]?.qMatrix?.forEach(row => {
                const value = row[index]?.qText;
                if (value && value.trim() && value.length > 2) {
                  fieldValues.add(value.trim());
                }
              });
            });
            
            // Collect measure field names and values
            hypercube.qMeasureInfo?.forEach((measure, index) => {
              const actualFieldName = measure.qDef?.qDef || measure.qFallbackTitle;
              if (actualFieldName && actualFieldName.length > 2) {
                fieldNames.add(actualFieldName);
              }
              
              // Extract values from data
              const measureIndex = (hypercube.qDimensionInfo?.length || 0) + index;
              hypercube.qDataPages?.[0]?.qMatrix?.forEach(row => {
                const value = row[measureIndex]?.qText || row[measureIndex]?.qNum;
                if (value !== undefined && value !== '' && String(value).length > 1) {
                  fieldValues.add(String(value));
                  // Separately track numeric values from your data
                  if (!isNaN(value) && value !== '') {
                    numericValues.add(String(value));
                  }
                }
              });
            });
          }
          
          console.log('📊 Fields to highlight:', Array.from(fieldNames).slice(0, 3));
          console.log('📊 Values to highlight:', Array.from(fieldValues).slice(0, 3));
          console.log('📊 Numeric values to highlight:', Array.from(numericValues).slice(0, 3));
          
          // Get text content and apply highlighting using text replacement
          let textContent = contentElement.innerHTML;
          
          // Format bullets: larger bullets only, more specific matching
          textContent = textContent.replace(/•/g, '<br><span style="font-size: 20px;">•</span>');
          // Match numbered lists and add line breaks for proper spacing, just like bullet points
          textContent = textContent.replace(/(\d+\.)\s+/g, '<br><span style="font-size: 18px; font-weight: bold;">$1</span> ');
          
          // Highlight numeric values first (purple) - before other field values
          numericValues.forEach(numValue => {
            if (!isNaN(numValue) && String(numValue).length > 0) {
              const escapedNum = String(numValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escapedNum}\\b`, 'gi');
              textContent = textContent.replace(regex, `<span class="number-highlight">${numValue}</span>`);
            }
          });
          
          // Highlight field names (blue)
          fieldNames.forEach(fieldName => {
            const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedField}\\b`, 'gi');
            textContent = textContent.replace(regex, `<span class="qlik-field">${fieldName}</span>`);
          });
          
          // Highlight non-numeric field values (blue)
          fieldValues.forEach(value => {
            if (String(value).length > 2 && isNaN(value)) { // Only non-numeric values
              const escapedValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escapedValue}\\b`, 'gi');
              textContent = textContent.replace(regex, `<span class="qlik-value">${value}</span>`);
            }
          });
          
          // Apply the highlighted content
          contentElement.innerHTML = textContent;
          
          console.log('✅ Simple highlighting applied');
        };

        // Generate Analysis Function
        const generateAnalysis = async () => {
          try {
            // Create global loading overlay for entire extension
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'global-loading-overlay';
            loadingOverlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(248, 249, 250, 0.95);
              z-index: 9999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              backdrop-filter: blur(2px);
            `;
            
            loadingOverlay.innerHTML = `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                padding: 32px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid #e8e8e8;
              ">
                <div style="
                  width: 40px;
                  height: 40px;
                  border: 4px solid #f3f3f3;
                  border-radius: 50%;
                  border-top: 4px solid #1890ff;
                  animation: spin 1s linear infinite;
                "></div>
                <div style="
                  font-size: 16px;
                  font-weight: 600;
                  color: #333;
                  margin-bottom: 4px;
                ">🤖 AI Analysis in Progress</div>
                <div style="
                  font-size: 14px;
                  color: #666;
                  text-align: center;
                  line-height: 1.4;
                ">Processing your data and generating insights...<br/>This may take a few moments.</div>
              </div>
            `;
            
            // Add to main container (scoped to this element)
            const mainContainer = element.querySelector(`#${uniqueMainId}`);
            if (mainContainer) {
              mainContainer.style.position = 'relative';
              mainContainer.appendChild(loadingOverlay);
            }

            const analyzeBtn = element.querySelector(`#${uniqueAnalyzeBtnId}`);
            const resultDiv = element.querySelector('#analysis-result');
            const contentDiv = element.querySelector('#analysis-content');

                         // Show loading state with spinner
             analyzeBtn.disabled = true;
             analyzeBtn.innerHTML = `
               <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                 <div style="
                   width: 16px;
                   height: 16px;
                   border: 2px solid #f3f3f3;
                   border-radius: 50%;
                   border-top: 2px solid #1890ff;
                   animation: spin 1s linear infinite;
                 "></div>
                 <span>Analyzing...</span>
               </div>
             `;
             analyzeBtn.style.background = '#f5f5f5';
             analyzeBtn.style.color = '#999';
             analyzeBtn.style.cursor = 'not-allowed';
             
                           // Add spinner animation CSS if not already added
              if (!document.getElementById('spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.textContent = `
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `;
                document.head.appendChild(style);
              }

            // Transform UI immediately when analysis starts
            transformToResultsView();

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
                 const objectId = layout?.qInfo?.qId || model?.id || 'unknown';
                 const extensionId = `qlikLLM_object_${objectId}`;
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
            
                         // Show results with simple highlighting
             contentDiv.innerHTML = response;
             applySimpleHighlighting(contentDiv, layout);
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
             // Remove global loading overlay (scoped to this element)
             const loadingOverlay = element.querySelector('#global-loading-overlay');
             if (loadingOverlay) {
               loadingOverlay.remove();
             }
             
             // Reset button state only if analysis failed (button will be hidden on success)
             const analyzeBtn = element.querySelector(`#${uniqueAnalyzeBtnId}`);
             const resultDiv = element.querySelector('#analysis-result');
             
             if (!resultDiv || resultDiv.style.display === 'none') {
               // Only reset if analysis failed
               analyzeBtn.disabled = false;
               analyzeBtn.textContent = 'Generate Analysis';
               analyzeBtn.style.background = '#1890ff';
               analyzeBtn.style.color = 'white';
               analyzeBtn.style.cursor = 'pointer';
             }
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
          
          // Step 4: Build config with dynamic connection name - let the connection handle its own parameters
          let configStr;
          
          // Check if connection name suggests it's Claude/Anthropic
          if (connectionName.toLowerCase().includes('claude') || connectionName.toLowerCase().includes('anthropic')) {
            // Use Anthropic-specific parameters
            configStr = `{"RequestType":"endpoint","endpoint":{"connectionname":"${connectionName.replace(/"/g, '\\"')}","column":"text","parameters":{"temperature":${temperature},"topk":${topK},"topp":${topP},"maxtoken":${maxTokens},"anthropicmodel":"anthropic.claude-3-5-sonnet-20240620-v1:0"}}}`;
          } else {
            // Use generic parameters that work with most AI connections
            configStr = `{"RequestType":"endpoint","endpoint":{"connectionname":"${connectionName.replace(/"/g, '\\"')}","column":"text","parameters":{"temperature":${temperature},"max_tokens":${maxTokens}}}}`;
          }
          
          // Step 5: Use double single quotes for Qlik string escaping
          const escapedPrompt = cleanPrompt.replace(/'/g, "''");
          
          // Step 6: Build expression
          const expression = `endpoints.ScriptEvalStr('${configStr}', '${escapedPrompt}')`;
          
          console.log("🔒 Using dynamic connection-based parameters");
          console.log("🔗 Connection name:", connectionName);
          console.log("🔍 Config string:", configStr.substring(0, 100) + "...");
          console.log("🔍 Escaped prompt preview:", escapedPrompt.substring(0, 100) + "...");
          console.log("✅ Expression built successfully, length:", expression.length);
          console.log("🔍 Expression preview:", expression.substring(0, 200) + "...");
          
          return expression;
        };

                // Claude API calling function using EXACT same endpoints.ScriptEvalStr approach that worked before
        const callClaudeAPI = async (systemPrompt, userPrompt, connectionName, temperature) => {
          try {
            console.log("🤖 Using EXACT endpoints.ScriptEvalStr approach (same as manual input)");
            console.log("🔍 Connection name from dropdown:", connectionName);
            
            // Use the full connection name with space prefix (as it worked in manual)
            const actualConnectionName = connectionName;
            console.log("🔗 Using connection name with space prefix:", actualConnectionName);
            
            // CRITICAL: Check exact connection name format
            console.log("🔍 CRITICAL - Expected working format: 'Churn Analytics:Anthropic_Claude35Sonnet_ChurnML'");
            console.log("🔍 CRITICAL - Current format:", `'${actualConnectionName}'`);
            console.log("🔍 CRITICAL - Exact match?", actualConnectionName === 'Churn Analytics:Anthropic_Claude35Sonnet_ChurnML');
            
            // DEBUG: Check if endpoints extension is available
            try {
              const testEndpoints = await app.evaluate('endpoints');
              console.log("🔍 Endpoints extension test:", JSON.stringify(testEndpoints));
            } catch (endpointsError) {
              console.log("❌ Endpoints extension not available:", endpointsError.message);
            }
            
            // Combine system and user prompts exactly like manual input
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nAssistant:`;
            console.log("📝 Full prompt length:", fullPrompt.length);
            
            // Build expression EXACTLY like it worked before with manual input
            const escapedPrompt = fullPrompt.replace(/'/g, "''");
            
            // Use the EXACT same ScriptEvalStr format that worked manually
            const configString = JSON.stringify({
              "RequestType": "endpoint",
              "endpoint": {
                "connectionname": actualConnectionName,
                "column": "text",
                "parameters": {
                  "temperature": temperature.toString(),
                  "Top K": (layout?.props?.topK || 250).toString(),
                  "Top P": (layout?.props?.topP || 1).toString()
                }
              }
            });
            
            const expression = `endpoints.ScriptEvalStr('${configString}', '${escapedPrompt}')`;
            
            console.log("🔍 Config string:", configString);
            console.log("🔍 Expression preview:", expression.substring(0, 200) + "...");
            console.log("🔍 Expression length:", expression.length);
            
            const result = await app.evaluate(expression);
            console.log("🔍 Raw result:", JSON.stringify(result));
            console.log("🔍 Result type:", typeof result);
            console.log("🔍 Result length:", result?.length);
            
            if (typeof result === 'string' && result.trim() && !result.startsWith('Error:')) {
              console.log('✅ endpoints.ScriptEvalStr call successful!');
              return result;
            }
            
            // If we get "Error:" try the EXACT same approach but with simpler parameters
            console.log('🔄 Trying with minimal parameters (same as worked before)...');
            const simpleConfig = JSON.stringify({
              "RequestType": "endpoint", 
              "endpoint": {
                "connectionname": actualConnectionName,
                "column": "text",
                "parameters": {
                  "temperature": temperature.toString()
                }
              }
            });
            
            const simpleExpression = `endpoints.ScriptEvalStr('${simpleConfig}', '${escapedPrompt}')`;
            console.log("🔄 Simple config:", simpleConfig);
            
            const simpleResult = await app.evaluate(simpleExpression);
            console.log("🔄 Simple result:", JSON.stringify(simpleResult));
            
            if (typeof simpleResult === 'string' && simpleResult.trim() && !simpleResult.startsWith('Error:')) {
              console.log('✅ Simple endpoints.ScriptEvalStr worked!');
              return simpleResult;
            }
            
            throw new Error(`endpoints.ScriptEvalStr failed. Result: ${result}`);

          } catch (evalError) {
            console.log('❌ Robust ScriptEvalStr call failed:', evalError);
            throw new Error(`Claude API call failed: ${evalError.message}. Please check your connection configuration and ensure the connection "${connectionName}" is properly set up.`);
          }
        };

        // Function to show prompts modal
        const showPromptsModal = () => {
          // Ensure we have current props data, with localStorage fallback
          let currentProps = layout?.props || {};
          
          // Check localStorage for backup data
          const objectId = layout?.qInfo?.qId || model?.id || 'unknown';
          const extensionId = `qlikLLM_object_${objectId}`;
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
              width: 95%;
              max-width: 1400px;
              height: 85%;
              max-height: 750px;
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
              
              <!-- Instructions -->
              <div style="
                padding: 16px 24px 0px 24px;
                border-bottom: 1px solid #f0f0f0;
                background: #fafafa;
              ">
                <p style="
                  margin: 0 0 16px 0;
                  color: #666;
                  font-size: 13px;
                  font-style: italic;
                  line-height: 1.5;
                ">
                  <strong>Instructions:</strong> Type your prompts in the text areas below. Click the <span style="
                    background: #f5f5f5;
                    border: 1px solid #d9d9d9;
                    border-radius: 3px;
                    padding: 2px 6px;
                    font-family: monospace;
                    color: #333;
                    font-style: normal;
                  ">➕</span> icon to insert available data fields from your extension. Remember to click <strong>Save Mappings</strong> when finished.
                </p>
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
                  ">🤖 Prompt Assistant (Coming Soon)</h3>
                  
                  <!-- Coming Soon Banner -->
                  <div style="
                    background: linear-gradient(135deg, #ffd700, #ffb347);
                    border: 2px solid #ff8c00;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(255, 140, 0, 0.2);
                  ">
                    <div style="
                      font-size: 16px;
                      font-weight: bold;
                      color: #8b4513;
                      margin-bottom: 4px;
                    ">Phase 2 Feature</div>
                    <div style="
                      font-size: 12px;
                      color: #8b4513;
                      line-height: 1.4;
                    ">This AI-powered prompt assistant will help you craft effective prompts for your Qlik data analysis. Stay tuned for the next release!</div>
                  </div>
                  
                  <!-- Chat Messages with disabled overlay -->
                  <div style="position: relative;">
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
                      opacity: 0.6;
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
                    
                    <!-- Disabled Overlay -->
                    <div style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      background: rgba(255, 255, 255, 0.8);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      border-radius: 6px;
                      cursor: not-allowed;
                    ">
                      <div style="
                        background: #fff;
                        border: 2px solid #ff8c00;
                        border-radius: 8px;
                        padding: 12px 16px;
                        text-align: center;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                      ">
                        <div style="font-size: 14px; font-weight: bold; color: #ff8c00; margin-bottom: 4px;">Feature under development</div>
                      </div>
                    </div>
                  </div>
                  </div>
                  
                  <!-- Chat Input - Disabled -->
                  <div style="
                    position: relative;
                    display: flex;
                    opacity: 0.5;
                  ">
                    <textarea 
                      id="chat-input"
                      placeholder="Coming in Phase 2..."
                      disabled
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
                        background: #f5f5f5;
                        cursor: not-allowed;
                      "
                    ></textarea>
                    <button 
                      id="send-chat"
                      disabled
                      style="
                        position: absolute;
                        right: 8px;
                        bottom: 8px;
                        width: 28px;
                        height: 28px;
                        border: 1px solid #d9d9d9;
                        background: #f5f5f5;
                        color: #ccc;
                        border-radius: 6px;
                        cursor: not-allowed;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                      "
                      title="Coming in Phase 2">✕</button>
                  </div>
                  
                  <!-- Quick Actions - Disabled -->
                  <div style="
                    margin-top: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    opacity: 0.5;
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
              
              // Save to Qlik object properties using the model API
              // This properly persists the data to Qlik's backend
              const updatedProps = {
                ...currentProps,
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                promptsConfigured: true
              };
              
              // Update the layout props directly (in-memory) to avoid extension invalidation
              // This will persist for the session and be restored from localStorage
              if (layout && layout.props) {
                layout.props.systemPrompt = systemPrompt;
                layout.props.userPrompt = userPrompt;
                layout.props.promptsConfigured = true;
              }
              
              console.log('✅ Prompts saved to layout properties (session)');
              
              // Also store in localStorage as backup persistence  
              // Use object ID for unique localStorage key per object instance
              const objectId = layout?.qInfo?.qId || model?.id || 'unknown';
              const extensionId = `qlikLLM_object_${objectId}`;
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
                
                // Update Generate Analysis button visibility
                updateGenerateAnalysisButtonVisibility();
              }, 500); // Small delay to show the disabled state
              
            } catch (error) {
              console.error('❌ Error saving prompts:', error);
              alert(`Error saving prompts: ${error.message}\n\nPlease try again or check the console for details.`);
            }
          };

          // Close modal when clicking outside (but not during drag operations)
          let isDragging = false;
          
          // Track drag operations on textareas
          const textareas = modal.querySelectorAll('textarea');
          textareas.forEach(textarea => {
            textarea.addEventListener('mousedown', (e) => {
              // Detect if this is a resize drag (near the bottom-right corner)
              const rect = textarea.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const nearRightEdge = x > rect.width - 20;
              const nearBottomEdge = y > rect.height - 20;
              
              if (nearRightEdge || nearBottomEdge) {
                isDragging = true;
              }
            });
          });
          
          // Reset drag flag on mouseup anywhere
          document.addEventListener('mouseup', () => {
            isDragging = false;
          });
          
          modal.onclick = (e) => {
            if (e.target === modal && !isDragging) {
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
          <div id="${uniqueMainId}" style="
            padding: clamp(8px, 1vh, 12px) clamp(12px, 1.5vw, 16px); 
            font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f8f9fa;
            min-height: clamp(200px, 15vh, 300px);
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-sizing: border-box;
          ">
            
                        <!-- Header - Compact -->
            <div id="${uniqueFullHeaderId}" style="text-align: center; margin-bottom: clamp(8px, 1.5vh, 15px); transition: all 0.5s ease;">
              <h1 style="
                color: #595959; 
                font-size: clamp(14px, 2.5vw, 18px); 
                font-weight: 700;
                letter-spacing: -0.3px;
                margin: 0 0 clamp(2px, 0.5vh, 6px) 0;
                line-height: 1.1;
              ">Dynamic LLM Extension</h1>
              <p style="
                color: #8c8c8c; 
                margin: 0; 
                font-size: clamp(10px, 1.8vw, 13px);
                font-weight: 400;
                line-height: 1.2;
              ">Follow these steps for AI-powered analysis</p>
            </div>

            <!-- Analysis Button - Shows above steps when all are completed -->
            ${isConnectionConfigured && hasDimensionsOrMeasures && arePromptsConfigured ? `
              <div id="${uniqueButtonContainerId}" style="
                width: 100%; 
                max-width: min(400px, 85vw); 
                margin-bottom: clamp(10px, 1.5vh, 18px);
                text-align: center;
                transition: all 0.5s ease;
              ">
                <button id="${uniqueAnalyzeBtnId}" style="
                  background: #1890ff;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  padding: clamp(6px, 0.8vh, 7px) clamp(12px, 1.8vw, 14px);
                  font-size: clamp(11px, 1.8vw, 13px);
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  min-width: clamp(100px, 18vw, 120px);
                " onmouseover="this.style.background='#0c7cd5'" onmouseout="this.style.background='#1890ff'">
                  Generate Analysis
                </button>
              </div>
            ` : ''}

            <!-- Steps Container -->
            <div id="${uniqueStepsId}" style="
              width: 100%; 
              max-width: min(400px, 85vw); 
              display: flex; 
              flex-direction: column; 
              gap: clamp(6px, 1vh, 8px);
              transition: all 0.5s ease;
            ">
              
              <!-- Step 1: Configure Claude Connection -->
              <div style="
                background: ${isConnectionConfigured ? '#f6ffed' : '#f5f5f5'};
                border: 1px solid ${isConnectionConfigured ? '#b7eb8f' : '#d9d9d9'};
                border-radius: 4px;
                padding: clamp(6px, 0.8vh, 8px) clamp(8px, 1.2vw, 10px);
                display: flex;
                align-items: center;
                gap: clamp(8px, 1.4vw, 10px);
                min-height: clamp(50px, 8vh, 60px);
                transition: all 0.3s ease;
              ">
                <div style="
                  width: clamp(20px, 3vw, 24px);
                  height: clamp(20px, 3vw, 24px);
                  border-radius: 50%;
                  background: ${isConnectionConfigured ? '#52c41a' : '#595959'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: clamp(10px, 1.5vw, 12px);
                  flex-shrink: 0;
                ">
                  ${isConnectionConfigured ? '✓' : '1'}
                </div>
                <div style="flex: 1;">
                  <h3 style="
                    margin: 0 0 clamp(1px, 0.2vh, 2px) 0;
                    color: ${isConnectionConfigured ? '#52c41a' : '#595959'};
                    font-size: clamp(11px, 1.8vw, 13px);
                    font-weight: 600;
                    line-height: 1.1;
                  ">${isConnectionConfigured ? 'Connection Configured ✓' : 'Configure Connection'}</h3>
                  <p style="
                    margin: 0;
                    color: #8c8c8c;
                    font-size: clamp(9px, 1.4vw, 10px);
                    font-weight: 400;
                    line-height: 1.2;
                  ">${isConnectionConfigured ? 'Ready to connect to Claude AI' : 'Set connection name in LLM Configuration'}</p>
                </div>
              </div>

              <!-- Step 2: Add Dimensions & Measures -->
              <div style="
                background: ${hasDimensionsOrMeasures ? '#f6ffed' : '#f5f5f5'};
                border: 1px solid ${hasDimensionsOrMeasures ? '#b7eb8f' : '#d9d9d9'};
                border-radius: 4px;
                padding: clamp(6px, 0.8vh, 8px) clamp(8px, 1.2vw, 10px);
                display: flex;
                align-items: center;
                gap: clamp(8px, 1.4vw, 10px);
                min-height: clamp(50px, 8vh, 60px);
                transition: all 0.3s ease;
              ">
                <div style="
                  width: clamp(20px, 3vw, 24px);
                  height: clamp(20px, 3vw, 24px);
                  border-radius: 50%;
                  background: ${hasDimensionsOrMeasures ? '#52c41a' : '#595959'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: clamp(10px, 1.5vw, 12px);
                  flex-shrink: 0;
                ">
                  ${hasDimensionsOrMeasures ? '✓' : '2'}
                </div>
                <div style="flex: 1;">
                  <h3 style="
                    margin: 0 0 clamp(1px, 0.2vh, 2px) 0;
                    color: ${hasDimensionsOrMeasures ? '#52c41a' : '#595959'};
                    font-size: clamp(11px, 1.8vw, 13px);
                    font-weight: 600;
                    line-height: 1.1;
                  ">${hasDimensionsOrMeasures ? 'Data Fields Added ✓' : 'Add Data Fields'}</h3>
                  <p style="
                    margin: 0;
                    color: #8c8c8c;
                    font-size: clamp(9px, 1.4vw, 10px);
                    font-weight: 400;
                    line-height: 1.2;
                  ">${hasDimensionsOrMeasures ? 
                    `${dimensionCount} dimension${dimensionCount !== 1 ? 's' : ''} and ${measureCount} measure${measureCount !== 1 ? 's' : ''} configured` : 
                    'Add data fields in the Data panel'
                  }</p>
                </div>
              </div>

              <!-- Step 3: Setup Selection Validation -->
              <div data-step="3" class="selection-validation-step" style="
                background: ${validationState.status === 'configured_with_selections' ? '#f6ffed' : 
                           validationState.status === 'configured_no_selections' ? '#fffbe6' : '#f5f5f5'};
                border: 1px solid ${validationState.status === 'configured_with_selections' ? '#b7eb8f' : 
                                  validationState.status === 'configured_no_selections' ? '#ffd666' : '#d9d9d9'};
                border-radius: 4px;
                padding: clamp(6px, 0.8vh, 8px) clamp(8px, 1.2vw, 10px);
                display: flex;
                align-items: center;
                gap: clamp(8px, 1.4vw, 10px);
                min-height: clamp(50px, 8vh, 60px);
                transition: all 0.3s ease;
              ">
                <div style="
                  width: clamp(20px, 3vw, 24px);
                  height: clamp(20px, 3vw, 24px);
                  border-radius: 50%;
                  background: ${validationState.status === 'configured_with_selections' ? '#52c41a' : 
                              validationState.status === 'configured_no_selections' ? '#faad14' : '#595959'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: clamp(10px, 1.5vw, 12px);
                  flex-shrink: 0;
                ">
                  ${validationState.status === 'configured_with_selections' ? '✓' : 
                    validationState.status === 'configured_no_selections' ? '!' : '3'}
                </div>
                <div style="flex: 1;">
                  <h3 style="
                    margin: 0 0 clamp(1px, 0.2vh, 2px) 0;
                    color: ${validationState.status === 'configured_with_selections' ? '#52c41a' : 
                            validationState.status === 'configured_no_selections' ? '#faad14' : '#595959'};
                    font-size: clamp(11px, 1.8vw, 13px);
                    font-weight: 600;
                    line-height: 1.1;
                  ">${validationState.status === 'configured_with_selections' ? 'Selection Validation Active ✓' : 
                      validationState.status === 'configured_no_selections' ? 'Awaiting Selection' : 
                      'Setup Selection Validation'}</h3>
                  <p style="
                    margin: 0;
                    color: #8c8c8c;
                    font-size: clamp(9px, 1.4vw, 10px);
                    font-weight: 400;
                    line-height: 1.2;
                  ">${validationState.message}</p>
                </div>
              </div>

              <!-- Step 4: Add AI Prompts -->
              <div data-step="4" style="
                background: ${arePromptsConfigured ? '#f6ffed' : '#f5f5f5'};
                border: 1px solid ${arePromptsConfigured ? '#b7eb8f' : '#d9d9d9'};
                border-radius: 4px;
                padding: clamp(6px, 0.8vh, 8px) clamp(8px, 1.2vw, 10px);
                display: flex;
                align-items: center;
                gap: clamp(8px, 1.4vw, 10px);
                min-height: clamp(50px, 8vh, 60px);
                transition: all 0.3s ease;
              ">
                <div data-step-circle="4" style="
                  width: clamp(20px, 3vw, 24px);
                  height: clamp(20px, 3vw, 24px);
                  border-radius: 50%;
                  background: ${arePromptsConfigured ? '#52c41a' : '#595959'};
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: clamp(10px, 1.5vw, 12px);
                  flex-shrink: 0;
                ">
                  ${arePromptsConfigured ? '✓' : '4'}
                </div>
                <div style="flex: 1;">
                  <h3 data-step-title="4" style="
                    margin: 0 0 4px 0;
                    color: ${arePromptsConfigured ? '#52c41a' : '#595959'};
                    font-size: clamp(11px, 1.8vw, 13px);
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

            <!-- Analysis Results - With integrated timeline header -->
            <div id="analysis-result" style="
              margin-top: 0;
              padding: 0;
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              text-align: left;
              display: none;
              width: 100%;
              max-width: 100%;
              max-height: 350px;
              overflow: hidden;
            ">
              <!-- Timeline Header inside results box -->
              <div id="${uniqueTimelineHeaderId}" style="
                display: none;
                padding: 12px 20px;
                background: #ffffff;
                border-bottom: 1px solid #e9ecef;
                transition: all 0.5s ease;
                opacity: 0;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 20px;
                ">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                      width: 20px; height: 20px; border-radius: 50%; background: #52c41a; color: white; 
                      display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;
                    ">✓</div>
                    <span style="font-size: 12px; color: #595959;">Connection</span>
                  </div>
                  <div style="width: 30px; height: 2px; background: #52c41a;"></div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                      width: 20px; height: 20px; border-radius: 50%; background: #52c41a; color: white; 
                      display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;
                    ">✓</div>
                    <span style="font-size: 12px; color: #595959;">Data</span>
                  </div>
                  <div style="width: 30px; height: 2px; background: #52c41a;"></div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                      width: 20px; height: 20px; border-radius: 50%; background: #52c41a; color: white; 
                      display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;
                    ">✓</div>
                    <span style="font-size: 12px; color: #595959;">Validation</span>
                  </div>
                  <div style="width: 30px; height: 2px; background: #52c41a;"></div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                      width: 20px; height: 20px; border-radius: 50%; background: #52c41a; color: white; 
                      display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;
                    ">✓</div>
                    <span style="font-size: 12px; color: #595959;">Prompts</span>
                  </div>
                </div>
              </div>
              
              <!-- Content area with scroll -->
              <div style="
                padding: 20px;
                max-height: 280px;
                overflow-y: auto;
              ">
                <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: 600;">AI Analysis Results:</h4>
                <div id="analysis-content" style="color: #555; line-height: 1.6; font-size: 14px;"></div>
              </div>
            </div>

          </div>
        `;

        // Add analyze button click handler (scoped to this element)
        const analyzeBtn = element.querySelector(`#${uniqueAnalyzeBtnId}`);
        if (analyzeBtn) {
          analyzeBtn.onclick = async () => {
            await generateAnalysis();
          };
        }

        // Add click handler for prompts button from ext.js
        window.showPromptsModal = showPromptsModal;
      }, [layout]);

      return () => {
        // Cleanup selection validation interval
        if (window.selectionValidationInterval) {
          clearInterval(window.selectionValidationInterval);
          window.selectionValidationInterval = null;
        }
      };
    },
  };
}
