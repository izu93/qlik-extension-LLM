// object-properties.js - Streamlined configuration
export default {
    // Standard Qlik object properties
    showTitles: true,
    title: "",
    subtitle: "",
    footnote: "",
  
    // Hypercube definition for data handling
    qHyperCubeDef: {
      qDimensions: [], // Array to store dimension definitions
      qMeasures: [], // Array to store measure definitions
      // Initial data fetch configuration
      qInitialDataFetch: [
        {
          qWidth: 40, // Number of columns to fetch
          qHeight: 100, // Number of rows to fetch
        },
      ],
    },
  
    // Custom properties for streamlined LLM configuration
    props: {
      connectionType: "claude", // Always Claude for this streamlined version
      connectionName:
        "Churn Analytics:Anthropic_Claude35Sonnet_ChurnML", // Claude SSE connection name
      temperature: 0.7, // Controls randomness in responses (0-1)
      topK: 250, // Limits vocabulary to top K tokens
      topP: 1, // Nucleus sampling parameter
      maxTokens: 1000, // Maximum response length
      
      // Selection validation properties
      enableSelectionValidation: false, // Enable custom selection validation
      customValidationExpression: "", // Custom validation expression
      customValidationErrorMessage: "Please make the required selections to proceed with AI analysis", // Error message
      
      // Prompts & Field Mapping properties
      promptsConfigured: false, // Track if prompts have been configured
      systemPrompt: "You are a helpful and professional analytical assistant inside a Qlik Cloud Analytics application. Use the structured data provided in the user prompt along with any additional context they provide to generate your response. Always respond in exactly three bullets. Do not explain your methodology or how you arrived at your answers. Maintain a friendly and respectful tone.", // System prompt content
      userPrompt: "", // User prompt content
    },
  };