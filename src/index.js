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
