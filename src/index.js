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
        // Clear and setup the basic extension UI
        element.innerHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h3>LLM Extension</h3>
            <div id="llm-content">
              <p>Extension loaded successfully!</p>
              <p>Connection Type: ${
                layout?.props?.connectionType || "claude"
              }</p>
              <p>Temperature: ${layout?.props?.temperature || 0.7}</p>
              <p>Top K: ${layout?.props?.topK || 250}</p>
              <p>Top P: ${layout?.props?.topP || 1}</p>
              <p>Max Tokens: ${layout?.props?.maxTokens || 1000}</p>
            </div>
          </div>
        `;
      }, [layout]);

      return () => {
        // Cleanup if needed
      };
    },
  };
}
