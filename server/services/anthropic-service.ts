import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client with API key from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Use Claude 3 Opus - the most capable Claude model
const DEFAULT_MODEL = 'claude-3-opus-20240229';

interface FabricResearchOptions {
  fabricType?: string;
  properties?: string[];
  region?: string;
  sustainabilityFocus?: boolean;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
}

interface FabricProperty {
  name: string;
  value: string;
  description?: string;
  unit?: string;
}

interface ManufacturingCost {
  region: string;
  baseUnitCost: number;
  minOrderQuantity: number;
  currency: string;
  leadTime: string;
  notes?: string;
}

interface FabricResearchResult {
  fabricType: string;
  description: string;
  composition: string[];
  properties: FabricProperty[];
  applications: string[];
  manufacturingCosts: ManufacturingCost[];
  sustainabilityInfo: {
    environmentalImpact: string;
    recyclability: string;
    certifications: string[];
  };
  careInstructions: string[];
  alternatives: string[];
  sources: string[];
}

/**
 * Researches fabric information using the Anthropic Claude model
 */
export async function researchFabric(options: FabricResearchOptions): Promise<FabricResearchResult> {
  const detailLevel = options.detailLevel || 'comprehensive';
  const fabricType = options.fabricType || 'Please specify fabric type';
  const propertiesFocus = options.properties?.join(', ') || 'all relevant properties';
  const region = options.region || 'global';
  const sustainabilityFocus = options.sustainabilityFocus ? 'with special attention to sustainability aspects' : '';

  const prompt = `
You are FabricExpert, an AI expert in textiles, fabrics, and manufacturing.
Provide accurate, structured information about fabrics used in apparel manufacturing.
Focus on properties, costs, applications, and manufacturing considerations.
Present all numeric data with appropriate units.
Format costs in USD unless another currency is specified.
Provide all information in structured JSON format without any surrounding text.

${Anthropic.HUMAN_PROMPT}
Research the following fabric type: ${fabricType}
Provide ${detailLevel} information about its properties, focusing on ${propertiesFocus}.
Include manufacturing cost estimates for ${region} ${sustainabilityFocus}.
Format your response as a single JSON object with the following structure:
{
  "fabricType": "name of fabric",
  "description": "brief description",
  "composition": ["material1", "material2"],
  "properties": [
    {"name": "property name", "value": "property value", "description": "brief explanation", "unit": "unit of measurement if applicable"}
  ],
  "applications": ["application1", "application2"],
  "manufacturingCosts": [
    {"region": "region name", "baseUnitCost": number, "minOrderQuantity": number, "currency": "USD", "leadTime": "timeframe", "notes": "optional notes"}
  ],
  "sustainabilityInfo": {
    "environmentalImpact": "description",
    "recyclability": "description",
    "certifications": ["certification1", "certification2"]
  },
  "careInstructions": ["instruction1", "instruction2"],
  "alternatives": ["alternative1", "alternative2"],
  "sources": ["source1", "source2"]
}
${Anthropic.AI_PROMPT}
`;

  try {
    const response = await anthropic.completions.create({
      model: DEFAULT_MODEL,
      max_tokens_to_sample: 4000,
      prompt: prompt,
      temperature: 0.2
    });

    // Parse the JSON response
    const content = response.completion;
    const result = JSON.parse(content);
    return result as FabricResearchResult;
  } catch (error: any) {
    console.error('Error researching fabric with Anthropic:', error);
    throw new Error(`Failed to research fabric information: ${error.message}`);
  }
}

/**
 * Analyzes compatibility between fabrics and production methods
 */
export async function analyzeFabricCompatibility(
  fabricType: string, 
  productionMethod: string
): Promise<{ compatible: boolean; reasons: string[]; alternatives?: string[] }> {
  const prompt = `
You are ProductionExpert, an AI expert in textile manufacturing.
Analyze compatibility between fabrics and production methods.
Provide objective assessments based on industry standards.
Format response as structured JSON.

${Anthropic.HUMAN_PROMPT}
Analyze the compatibility between ${fabricType} fabric and the ${productionMethod} production method.
Determine if they are compatible, and why or why not.
Format your response as a JSON object with the following structure:
{
  "compatible": true/false,
  "reasons": ["reason1", "reason2"],
  "alternatives": ["alternative1", "alternative2"] // if not compatible
}
${Anthropic.AI_PROMPT}
`;

  try {
    const response = await anthropic.completions.create({
      model: DEFAULT_MODEL,
      max_tokens_to_sample: 1000,
      prompt: prompt,
      temperature: 0.1
    });

    // Parse the JSON response
    const content = response.completion;
    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error analyzing fabric compatibility with Anthropic:', error);
    throw new Error(`Failed to analyze fabric compatibility: ${error.message}`);
  }
}

/**
 * Suggests fabrics based on product requirements
 */
export async function suggestFabrics(requirements: {
  productType: string;
  properties: string[];
  pricePoint: 'budget' | 'mid-range' | 'premium';
  seasonality?: 'summer' | 'winter' | 'all-season';
  sustainability?: boolean;
}): Promise<{ 
  primarySuggestion: string; 
  alternatives: string[]; 
  rationale: string;
  propertiesMatch: { [property: string]: boolean };
}> {
  const prompt = `
You are TextileAdvisor, an AI expert in textile selection for apparel.
Suggest appropriate fabrics based on product requirements.
Provide objective recommendations with supporting rationale.
Format response as structured JSON.

${Anthropic.HUMAN_PROMPT}
Suggest fabrics for a ${requirements.productType} with the following requirements:
- Properties needed: ${requirements.properties.join(', ')}
- Price point: ${requirements.pricePoint}
${requirements.seasonality ? `- Seasonality: ${requirements.seasonality}` : ''}
${requirements.sustainability ? '- Sustainability is important' : ''}

Format your response as a JSON object with the following structure:
{
  "primarySuggestion": "fabric name",
  "alternatives": ["fabric1", "fabric2", "fabric3"],
  "rationale": "explanation for recommendations",
  "propertiesMatch": {
    "property1": true/false,
    "property2": true/false
  }
}
${Anthropic.AI_PROMPT}
`;

  try {
    const response = await anthropic.completions.create({
      model: DEFAULT_MODEL,
      max_tokens_to_sample: 1500,
      prompt: prompt,
      temperature: 0.3
    });

    // Parse the JSON response
    const content = response.completion;
    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error suggesting fabrics with Anthropic:', error);
    throw new Error(`Failed to suggest fabrics: ${error.message}`);
  }
}

export default {
  researchFabric,
  analyzeFabricCompatibility,
  suggestFabrics
};