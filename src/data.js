// data.js - Data configuration for QAE (Qlik Analytics Engine)
export default {
  targets: [
    {
      path: "/qHyperCubeDef", // Path to hypercube definition
      dimensions: {
        min: 0, // Minimum dimensions allowed
        max: 20, // Maximum dimensions allowed
      },
      measures: {
        min: 0, // Minimum measures allowed
        max: 20, // Maximum measures allowed
      },
    },
  ],
};
