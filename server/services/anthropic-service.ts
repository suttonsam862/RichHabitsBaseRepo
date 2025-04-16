import Anthropic from '@anthropic-ai/sdk';
import { InsertFabricType } from '@shared/schema';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const CURRENT_MODEL = 'claude-3-7-sonnet-20250219';

export interface FabricResearchRequest {
  fabricType: string;
  properties?: string[];
  region?: string;
  sustainabilityFocus?: boolean;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
}

export interface FabricResearchResult {
  fabricType: string;
  description: string;
  composition: string[];
  properties: {
    name: string;
    value: string;
    description: string;
    unit?: string;
  }[];
  applications: string[];
  manufacturingCosts: {
    region: string;
    baseUnitCost: number;
    minOrderQuantity: number;
    currency: string;
    leadTime: string;
    notes?: string;
  }[];
  sustainabilityInfo: {
    environmentalImpact: string;
    recyclability: string;
    certifications: string[];
  };
  careInstructions: string[];
  alternatives: string[];
  sources: string[];
}

export interface FabricCompatibilityRequest {
  fabricType: string;
  productionMethod: string;
}

export interface FabricCompatibilityResult {
  compatible: boolean;
  reasons: string[];
  alternatives?: string[];
}

export interface FabricSuggestionRequest {
  productType: string;
  properties: string[];
  pricePoint: 'budget' | 'mid-range' | 'premium';
  seasonality?: 'summer' | 'winter' | 'all-season';
  sustainability?: boolean;
}

export class AnthropicService {
  /**
   * Research fabric properties and details
   */
  async researchFabric(
    request: FabricResearchRequest
  ): Promise<FabricResearchResult> {
    const { fabricType, properties, region, sustainabilityFocus, detailLevel } = request;
    
    // Build a prompt based on the request parameters
    let systemPrompt = `You are a Fabric Research Assistant with expertise in textiles, manufacturing, and material science. 
Your task is to research and provide detailed, factual information about fabrics.
Always format your response as a valid JSON object without markdown formatting.`;

    if (detailLevel === 'comprehensive') {
      systemPrompt += `\nProvide extremely detailed and technical information with precise specifications.`;
    } else if (detailLevel === 'basic') {
      systemPrompt += `\nProvide concise, essential information without going into technical details.`;
    }

    if (sustainabilityFocus) {
      systemPrompt += `\nPrioritize information about environmental impact, sustainability certifications, and eco-friendly aspects of the fabric.`;
    }

    if (region && region !== 'global') {
      systemPrompt += `\nFocus on manufacturing information, availability, and pricing specific to the ${region} region.`;
    }

    const userPrompt = `Research the fabric type: ${fabricType}${
      properties && properties.length > 0
        ? `, focusing on these properties: ${properties.join(', ')}`
        : ''
    }. 
    
Return your findings in the following JSON format:
{
  "fabricType": "Name of the fabric",
  "description": "Detailed description of the fabric",
  "composition": ["Primary material", "Secondary material", ...],
  "properties": [
    {
      "name": "Property name (e.g., Breathability, Durability, Stretch)",
      "value": "Rating or value",
      "description": "Explanation of the property for this fabric",
      "unit": "Unit of measurement if applicable"
    }
  ],
  "applications": ["Application 1", "Application 2", ...],
  "manufacturingCosts": [
    {
      "region": "Geographic region",
      "baseUnitCost": 0.00,
      "minOrderQuantity": 0,
      "currency": "USD",
      "leadTime": "X weeks",
      "notes": "Additional notes on manufacturing"
    }
  ],
  "sustainabilityInfo": {
    "environmentalImpact": "Description of environmental impact",
    "recyclability": "Information on recyclability",
    "certifications": ["Certification 1", "Certification 2", ...]
  },
  "careInstructions": ["Instruction 1", "Instruction 2", ...],
  "alternatives": ["Alternative fabric 1", "Alternative fabric 2", ...],
  "sources": ["Source 1", "Source 2", ...]
}

Ensure all information is factual, accurate, and detailed. Include typical manufacturing costs, sustainability information, and care instructions.`;

    // Make the request to Anthropic
    try {
      const response = await anthropic.messages.create({
        model: CURRENT_MODEL,
        system: systemPrompt,
        max_tokens: 4000,
        temperature: 0.2,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract the text content from the response
      const content = response.content[0].text;
      
      // Parse the JSON response
      const result = JSON.parse(content) as FabricResearchResult;
      
      return result;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Failed to research fabric: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze compatibility between a fabric and a production method
   */
  async analyzeFabricCompatibility(
    request: FabricCompatibilityRequest
  ): Promise<FabricCompatibilityResult> {
    const { fabricType, productionMethod } = request;
    
    const systemPrompt = `You are a Textile Manufacturing Expert specializing in fabric compatibility analysis.
Your task is to analyze if a specific fabric type is compatible with a given production method.
Provide a technically accurate and detailed analysis.
Always format your response as a valid JSON object without markdown formatting.`;

    const userPrompt = `Analyze the compatibility between "${fabricType}" fabric and "${productionMethod}" production method.

Return your analysis in the following JSON format:
{
  "compatible": true/false,
  "reasons": ["Detailed reason 1", "Detailed reason 2", ...],
  "alternatives": ["Alternative method 1", "Alternative method 2", ...] (only if not compatible)
}

Your analysis should consider:
1. Technical compatibility of the fabric with the production method
2. Common industry practices
3. Potential issues or challenges
4. If not compatible, suggest alternative production methods that would work better`;

    try {
      const response = await anthropic.messages.create({
        model: CURRENT_MODEL,
        system: systemPrompt,
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract the text content from the response
      const content = response.content[0].text;
      
      // Parse the JSON response
      const result = JSON.parse(content) as FabricCompatibilityResult;
      
      return result;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Failed to analyze fabric compatibility: ${(error as Error).message}`);
    }
  }

  /**
   * Suggest fabrics for a specific product type with required properties
   */
  async suggestFabrics(
    request: FabricSuggestionRequest
  ): Promise<any> {
    const { productType, properties, pricePoint, seasonality, sustainability } = request;
    
    const systemPrompt = `You are a Textile Product Development Expert specializing in fabric selection.
Your task is to recommend appropriate fabrics for a specific product type based on required properties and constraints.
Provide technically accurate, detailed, and practical fabric recommendations.
Always format your response as a valid JSON object without markdown formatting.`;

    let userPrompt = `Recommend fabrics for a "${productType}" with the following required properties: ${properties.join(', ')}.
Price point: ${pricePoint}${seasonality ? `\nSeasonality: ${seasonality}` : ''}${
      sustainability ? '\nSustainability is a priority.' : ''
    }

Return your recommendations in the following JSON format:
{
  "productType": "${productType}",
  "recommendedFabrics": [
    {
      "name": "Fabric name",
      "description": "Brief description",
      "primaryUse": "Main use case",
      "bestFor": "Specific application",
      "composition": "Material composition",
      "weight": "Weight/GSM if relevant",
      "care": "Care instructions",
      "propertyRatings": {
        "${properties[0]}": 4.5,
        "${properties[1] || 'AnotherProperty'}": 3.5
        // Include ratings for all specified properties
      },
      "costRating": 4.2,
      "availabilityRating": 4.0,
      "durabilityRating": 3.8,
      "sustainabilityRating": 3.5,
      "recyclability": 2.8,
      "waterUsage": 3.2,
      "considerations": "Important considerations for this fabric"
    }
  ],
  "notes": "General notes about the recommendations"
}

Ratings should be on a scale of 1-5, where 5 is excellent.
List fabrics in order of best match first, with at least 3-5 recommendations.
Provide practical, industry-standard fabrics that are actually used for this type of product.`;

    try {
      const response = await anthropic.messages.create({
        model: CURRENT_MODEL,
        system: systemPrompt,
        max_tokens: 3000,
        temperature: 0.3,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract the text content from the response
      const content = response.content[0].text;
      
      // Parse the JSON response
      const result = JSON.parse(content);
      
      return result;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Failed to suggest fabrics: ${(error as Error).message}`);
    }
  }

  /**
   * Convert AI research result to database schema format
   */
  convertToFabricTypeSchema(result: FabricResearchResult, createdBy?: number): InsertFabricType {
    return {
      name: result.fabricType,
      description: result.description,
      composition: result.composition,
      properties: result.properties,
      applications: result.applications,
      manufacturingCosts: result.manufacturingCosts,
      sustainabilityInfo: result.sustainabilityInfo,
      careInstructions: result.careInstructions,
      alternatives: result.alternatives,
      sources: result.sources,
      createdBy: createdBy || null,
    };
  }
}

export default new AnthropicService();