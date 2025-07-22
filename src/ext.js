// Clean ext.js with dynamic space and connection selection
import qlikApiService from "./services/qlik-api-service";

export default {
    definition: {
      type: "items",
      component: "accordion",
      items: {
        // Standard data configuration section
        data: {
          uses: "data",
        },
  
       // LLM Configuration section
        settings: {
          type: "items",
          label: "LLM Configuration",
          items: {

            // Space Selection
            spaceHeader: {
              component: "text",
              label: "Select Qlik Cloud Space & Connection",
              style: "font-weight: bold; font-size: 14px; color: #333; margin-top: 10px;",
              show: function (data) {
                return true; // Always show since we only support Claude
              },
            },
            
            selectedSpace: {
              type: "string",
              component: "dropdown",
              label: "Choose Space",
              ref: "props.selectedSpace",
              defaultValue: "",
              options: async function() {
                try {
                  const spaces = await qlikApiService.fetchSpaces();
                  const options = [];
                  
                  // Add personal spaces
                  spaces.personal.forEach(space => {
                    options.push({
                      value: space.id,
                      label: `${space.name} (Personal)`
                    });
                  });
                  
                  // Add shared spaces  
                  spaces.shared.forEach(space => {
                    options.push({
                      value: space.id,
                      label: `${space.name} (Shared)`
                    });
                  });
                  
                  // Add managed spaces
                  spaces.managed.forEach(space => {
                    options.push({
                      value: space.id,
                      label: `${space.name} (Managed)`
                    });
                  });
                  
                  return options.length > 0 ? options : [
                    { value: "", label: "No spaces found" }
                  ];
                } catch (error) {
                  console.error('Error loading spaces:', error);
                  return [{ value: "", label: "Error loading spaces" }];
                }
              },
              change: function(data) {
                // Clear connection selection when space changes
                data.props.selectedConnection = "";
                data.props.connectionName = "";
              },
              show: function (data) {
                return true;
              },
            },
            
            selectedConnection: {
              type: "string",
              component: "dropdown",
              label: "Choose AI Connection",
              ref: "props.selectedConnection",
              defaultValue: "",
              options: async function(data) {
                try {
                  const selectedSpaceId = data?.props?.selectedSpace;
                  if (!selectedSpaceId) {
                    return [{ value: "", label: "Please select a space first" }];
                  }
                  
                  // Get space info and connections
                  const spaces = await qlikApiService.fetchSpaces();
                  const allSpaces = [...spaces.personal, ...spaces.shared, ...spaces.managed];
                  const selectedSpace = allSpaces.find(s => s.id === selectedSpaceId);
                  
                  if (!selectedSpace) {
                    return [{ value: "", label: "Space not found" }];
                  }
                  
                  // Get connections specifically for the selected space
                  const allConnections = await qlikApiService.fetchDataConnections(selectedSpaceId);
                  console.log('🔍 Debug: Selected space:', selectedSpace);
                  console.log('🔍 Debug: Connections for selected space:', allConnections.length);
                  
                  // Filter AI connections from the space-specific results
                  const aiConnections = allConnections.filter(conn => {
                    const name = conn.name?.toLowerCase() || conn.qName?.toLowerCase() || '';
                    const isAI = name.includes('anthropic') || name.includes('claude') || name.includes('openai') || name.includes('gpt');
                    
                    // Additional debug for space filtering
                    if (isAI) {
                      console.log('🔍 AI Connection found:', { 
                        name: conn.qName || conn.name, 
                        spaceId: conn.spaceId,
                        space: conn.space,
                        selectedSpaceId: selectedSpaceId 
                      });
                    }
                    
                    return isAI;
                  });
                  
                  console.log('🔍 Debug: AI connections found:', aiConnections);
                  
                  // CRITICAL FIX: Use the exact space name format from working manual code
                  // Manual code used "Churn Analytics" not "Churn Analytics Space"
                  let workingSpaceName = selectedSpace.name;
                  if (workingSpaceName === 'Churn Analytics Space') {
                    workingSpaceName = 'Churn Analytics'; // Use the exact name from working manual code
                  }
                  console.log('🔧 Space name mapping:', { original: selectedSpace.name, working: workingSpaceName });
                  
                  const options = aiConnections.map(conn => ({
                    // FIXED: Use the working space name format
                    value: `${workingSpaceName}:${conn.qName || conn.name}`,
                    label: `${conn.qName || conn.name}`
                  }));
                  
                  return options.length > 0 ? options : [
                    { value: "", label: "No AI connections found in this space" }
                  ];
                } catch (error) {
                  console.error('Error loading connections:', error);
                  return [{ value: "", label: "Error loading connections" }];
                }
              },
              change: function(data) {
                if (data.props.selectedConnection) {
                  // FIXED: Store the full connection name with space prefix
                  data.props.connectionName = data.props.selectedConnection;
                  console.log('🔗 Connection selected with space prefix:', data.props.selectedConnection);
                }
              },
              show: function (data) {
                return data.props?.selectedSpace;
              },
            },
            
            // Active Connection Display
            activeConnection: {
              component: "text",
              label: "Active Connection",
              style: "background: #f0f8ff; padding: 5px; border-radius: 3px; font-weight: bold;",
              show: function (data) {
                return data.props?.connectionName;
              },
            },  
  
            advancedToggle: {
              type: "boolean",
              label: "Advanced Parameters",
              ref: "props.showAdvanced",
              defaultValue: false,
              show: function (data) {
                return true; // Always show since we only support Claude
              },
            },
            temperature: {
              type: "number",
              component: "slider",
              label: "Temperature",
              ref: "props.temperature",
              min: 0,
              max: 2,
              step: 0.1,
              defaultValue: 0.7,
              show: function (data) {
                const showAdvanced = data.props?.showAdvanced || false;
                return showAdvanced;
              },
            },
            temperatureDescription: {
              component: "text",
              label: "Controls randomness in responses. Lower values (0.1) make outputs more focused and deterministic, higher values (1.5+) increase creativity and variability.",
              style: "font-style: italic; color: #666; font-size: 12px;",
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
              },
            },
            topK: {
              type: "integer",
              label: "Top K",
              ref: "props.topK",
              defaultValue: 250,
              min: 1,
              max: 500,
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
              },
            },
            topKDescription: {
              component: "text",
              label: "Restricts token selection to the K most likely tokens, ignoring all others regardless of their probability mass.",
              style: "font-style: italic; color: #666; font-size: 12px;",
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
              },
            },
            topP: {
              type: "number",
              label: "Top P",
              ref: "props.topP",
              defaultValue: 1,
              min: 0,
              max: 1,
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
              },
            },
            topPDescription: {
              component: "text",
              label: "Limits token selection to the smallest set whose cumulative probability exceeds P, ensuring sampling only from the most likely tokens.",
              style: "font-style: italic; color: #666; font-size: 12px;",
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
              },
            },
            maxTokens: {
              type: "integer",
              label: "Max Tokens",
              ref: "props.maxTokens",
              defaultValue: 1000,
              min: 100,
              max: 4000,
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
              },
            },
            maxTokensDescription: {
              component: "text",
              label: "Specifies the maximum number of tokens the model can generate in the output, capping the response length.",
              style: "font-style: italic; color: #666; font-size: 12px;",
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
              },
            },
          },
        },
  
              // Selection Validation section
      selectionValidation: {
        type: "items",
        label: "Selection Validation",
        items: {
          enableSelectionValidation: {
            type: "boolean",
            label: "Enable Selection Validation",
            ref: "props.enableSelectionValidation",
            defaultValue: false,
          },
                      customValidationExpression: {
            type: "string",
            component: "expression",
            label: "Selection Validation Expression",
            ref: "props.customValidationExpression",
            defaultValue: "",
            show: function (data) {
              return data.props?.enableSelectionValidation || false;
            },
          },
            clearValidationButton: {
              component: "button",
              label: "Clear Validation Expression",
              action: function(data) {
                data.props.customValidationExpression = "";
                return data;
              },
              show: function (data) {
                const hasExpression = data.props?.customValidationExpression?.trim();
                const isEnabled = data.props?.enableSelectionValidation || false;
                return isEnabled && hasExpression;
              },
            },
            customValidationErrorMessage: {
              type: "string",
              component: "textarea",
              label: "Custom Validation Error Message",
              ref: "props.customValidationErrorMessage",
              defaultValue: "Please make the required selections to proceed with AI analysis",
              show: function (data) {
                return data.props?.enableSelectionValidation || false;
              },
            },
            expressionStatus: {
              component: "text",
              label: "Expression Status",
              show: function (data) {
                const hasExpression = data.props?.customValidationExpression?.trim();
                const isEnabled = data.props?.enableSelectionValidation || false;
                return isEnabled && hasExpression;
              },
            },
                      expressionExamples: {
            component: "text",
            label: "Examples:\nGetSelectedCount([FieldName])=1\nGetSelectedCount([Customer])=1 and GetSelectedCount([Date])=1",
            style: "font-style: italic; color: #666; font-size: 12px; white-space: pre-line;",
            show: function (data) {
              return data.props?.enableSelectionValidation || false;
            },
          },
          },
        },

        // Prompts & Field Mapping section
        promptsFieldMapping: {
          type: "items",
          label: "Prompts & Field Mapping",
          items: {
            promptsDescription: {
              component: "text",
              label: "Configure prompts and map data fields to optimize analysis results. System prompts define the AI's role and behavior, while user prompts specify the analysis tasks.",
              style: "font-style: italic; color: #666; font-size: 14px; margin-bottom: 15px;",
            },
            promptsButton: {
              component: "button",
              label: "Prompts & Field Mapping",
              action: function(data) {
                // Call the modal function
                if (window.showPromptsModal) {
                  window.showPromptsModal();
                } else {
                  console.log("Modal function not available");
                }
              },
            },


          },
        },

        // Standard appearance settings
        appearance: {
          uses: "settings",
          items: {
            general: {
              items: {
                showTitles: {
                  defaultValue: true,
                },
                title: {
                  defaultValue: "",
                },
                subtitle: {
                  defaultValue: "",
                },
                footnote: {
                  defaultValue: "",
                },
              },
            },
          },
        },
      },
    },
    support: {
      snapshot: true,
      export: true,
      exportData: false,
    },
  };