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
            extensionVersion: {
              type: "string",
              component: "text",
              label: "Extension Version",
              show: "v3.0 - Streamlined Custom Expression",
            },
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