// Streamlined ext.js - Simple custom expression validation with fixed examples
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
            connectionType: {
              type: "string",
              component: "dropdown",
              label: "AI Service",
              ref: "props.connectionType",
              defaultValue: "claude",
              options: [
                {
                  value: "claude",
                  label: "🤖 Claude 3.5 Sonnet (External Connection)",
                },
              ],
            },
            connectionName: {
              type: "string",
              label: "Claude Connection Name",
              ref: "props.connectionName",
              defaultValue:
                "",
              show: function (data) {
                return data.props?.connectionType === "claude";
              },
            },  
  
            advancedToggle: {
              type: "boolean",
              label: "Advanced Parameters",
              ref: "props.showAdvanced",
              defaultValue: false,
              show: function (data) {
                const connectionType = data.props?.connectionType || "claude";
                return connectionType === "claude";
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
                const connectionType = data.props?.connectionType || "claude";
                const showAdvanced = data.props?.showAdvanced || false;
                return connectionType === "claude" && showAdvanced;
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
              label: "Enable Custom Selection Validation",
              ref: "props.enableSelectionValidation",
              defaultValue: false,
            },
            customValidationExpression: {
              type: "string",
              component: "expression",
              label: "Custom Validation Expression",
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
              label: "Expression Examples:\n• Single selection: GetSelectedCount(automl_feature)=1\n• Multiple fields: GetSelectedCount(Customer)=1 and GetSelectedCount(Invoice)=1",
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

            systemPromptDescription: {
              component: "text",
              label: "System Prompt: An instruction that defines the model's role, behavior, or response style within a given interaction.",
              style: "font-weight: 500; color: #333; font-size: 13px; margin-top: 15px;",
            },
            userPromptDescription: {
              component: "text", 
              label: "User Prompt: The input that conveys the user's intent or query, prompting the model to generate a relevant response.",
              style: "font-weight: 500; color: #333; font-size: 13px; margin-top: 8px;",
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