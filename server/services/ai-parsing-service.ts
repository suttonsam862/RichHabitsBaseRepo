// AI Parsing Service - Handles parsing text into structured data for items
import anthropicService from "./anthropic-service";

// Define measurement schemas based on product category
const measurementSchemas = {
  pants: ["outseam", "waist", "inseam", "rise", "hip"],
  shorts: ["outseam", "waist", "hip"],
  shirt: ["bodyLength", "chest", "shoulder", "sleeve"],
  hoodie: ["bodyLength", "chest", "shoulder", "sleeve"],
  jacket: ["bodyLength", "chest", "shoulder", "sleeve"],
  singlet: ["bodyLength", "chest", "shoulder"],
  generic: ["height", "width"]
};

// Common fabric types
const commonFabrics = [
  "Cotton", "Polyester", "Nylon", "Spandex", "Rayon", "Wool", "Fleece", 
  "Denim", "Linen", "Silk", "Poly-cotton blend", "Performance fabric",
  "Cotton jersey", "Terry cloth", "Microfiber", "Canvas", "Oxford cloth"
];

// Color reference map
const colorReferenceMap = {
  red: "#e63946",
  blue: "#457b9d",
  darkBlue: "#0a2463",
  navy: "#001f3f",
  black: "#1e1e1e",
  grey: "#6c757d",
  white: "#ffffff",
  yellow: "#f9c74f",
  green: "#2a9d8f",
  purple: "#9d4edd",
  orange: "#f3722c",
  brown: "#774936",
  maroon: "#9b2226",
  teal: "#0096c7",
  gold: "#ffd700",
  silver: "#c0c0c0",
};

export interface ParsedItem {
  itemName: string;
  category: string;
  designDetails: string;
  fabricType: string;
  colorDisplay: string;
  colorHex: string;
  yardagePerUnit: number;
  measurements: {
    [size: string]: {
      [measurement: string]: number;
    };
  };
  requiresReview?: boolean;
  alternativeItems?: string[];
  productCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  expectedQuantity?: number;
  priceEstimate?: number;
}

class AiParsingService {
  /**
   * Parse client notes into structured item data using Anthropic Claude
   */
  async parseItemsFromNotes(clientNotes: string): Promise<ParsedItem[]> {
    console.log("Processing client notes for AI parsing:", clientNotes);
    
    try {
      // First use Anthropic to extract structured data from the notes
      const systemPrompt = `You are a garment manufacturing expert who extracts structured product data from client notes.
      Your task is to parse unstructured client notes and convert them into detailed apparel item specifications.
      You must identify each distinct item requested and extract:
      1. Item name (clear, descriptive name of the garment)
      2. Category (one of: pants, shorts, shirt, hoodie, jacket, singlet, generic)
      3. Design details (any logos, artwork, special features)
      4. Fabric type (be specific but realistic)
      5. Primary color (with closest hex code)
      6. Yardage required per unit (realistic estimate)
      7. Expected measurements for standard sizes
      8. Quantity needed if specified
      9. Alternative items that might be related

      Always use the standard measurement schemas for each category type:
      - pants: outseam, waist, inseam, rise, hip
      - shorts: outseam, waist, hip
      - shirt: bodyLength, chest, shoulder, sleeve
      - hoodie/jacket: bodyLength, chest, shoulder, sleeve
      - singlet: bodyLength, chest, shoulder
      - generic: height, width

      Format your response as a valid JSON array of item objects without any markdown formatting or explanation.`;
      
      // Prepare the user prompt with client notes
      const userPrompt = `Extract structured apparel item specifications from these client notes:
      
      "${clientNotes}"
      
      Return a JSON array with each item containing:
      {
        "itemName": string,
        "category": string (one of: pants, shorts, shirt, hoodie, jacket, singlet, generic),
        "designDetails": string,
        "fabricType": string,
        "colorDisplay": string (readable color name),
        "colorHex": string (hex code),
        "yardagePerUnit": number,
        "expectedQuantity": number (if mentioned),
        "measurements": {
          "small": { relevant measurements from schema },
          "medium": { relevant measurements from schema },
          "large": { relevant measurements from schema }
        },
        "alternativeItems": [string array of alternative product suggestions],
        "primaryColor": string,
        "secondaryColor": string (if applicable)
      }`;
      
      // Make request to Anthropic to parse the notes
      const response = await anthropicService.getCompletionWithJSON(systemPrompt, userPrompt);
      
      // In case Anthropic API is not available or returns invalid result, fallback to mock data
      if (!response || !Array.isArray(response)) {
        console.warn("AI parsing failed, using fallback data");
        return this.generateFallbackItems(clientNotes);
      }
      
      // Enhance the parsed items with any missing data
      const enhancedItems = response.map(item => {
        // Ensure all items have required fields
        return {
          ...item,
          // Set defaults for any missing fields
          requiresReview: item.requiresReview ?? true,
          colorHex: item.colorHex || this.getColorHexFromName(item.colorDisplay || 'gray'),
          productCode: item.productCode || this.generateProductCode(item.category, item.itemName),
          // Set a realistic price estimate based on category and fabric
          priceEstimate: item.priceEstimate || this.estimatePrice(item.category, item.fabricType)
        };
      });
      
      console.log(`Successfully parsed ${enhancedItems.length} items from client notes`);
      return enhancedItems;
    } catch (error) {
      console.error("Error parsing items with AI:", error);
      // In case of any error, return fallback data
      return this.generateFallbackItems(clientNotes);
    }
  }
  
  /**
   * Generate fallback items based on keyword matching in case AI parsing fails
   */
  private generateFallbackItems(clientNotes: string): ParsedItem[] {
    console.log("Generating fallback items from keywords in client notes");
    const items: ParsedItem[] = [];
    const lowerCaseNotes = clientNotes.toLowerCase();
    
    // Extract potential quantities
    const quantityMatch = lowerCaseNotes.match(/\b(\d+)\s+(shirts|pants|jackets|hoodies|shorts|singlets)\b/i);
    const defaultQuantity = quantityMatch ? parseInt(quantityMatch[1]) : 20;
    
    // Extract potential colors
    const colorMatches = Object.keys(colorReferenceMap).filter(color => 
      lowerCaseNotes.includes(color.toLowerCase())
    );
    const primaryColor = colorMatches.length > 0 ? colorMatches[0] : 'blue';
    const colorHex = colorReferenceMap[primaryColor as keyof typeof colorReferenceMap] || '#457b9d';
    
    // Check for apparel types and create items
    if (lowerCaseNotes.includes("jacket")) {
      items.push({
        itemName: "Team Jacket",
        category: "jacket",
        designDetails: "Team logo on back, small logo on chest",
        fabricType: "Polyester",
        colorDisplay: primaryColor,
        colorHex,
        yardagePerUnit: 2.5,
        expectedQuantity: defaultQuantity,
        measurements: {
          small: { bodyLength: 26, chest: 40, shoulder: 17, sleeve: 25 },
          medium: { bodyLength: 27, chest: 42, shoulder: 18, sleeve: 26 },
          large: { bodyLength: 28, chest: 44, shoulder: 19, sleeve: 27 }
        },
        alternativeItems: ["Lightweight Windbreaker", "Full-Zip Jacket"],
        primaryColor,
        priceEstimate: 45.99
      });
    }
    
    if (lowerCaseNotes.includes("pant") || lowerCaseNotes.includes("pants")) {
      items.push({
        itemName: "Team Pants",
        category: "pants",
        designDetails: "Logo on left leg, elastic waistband",
        fabricType: "Poly-cotton blend",
        colorDisplay: primaryColor === 'white' ? 'black' : primaryColor,
        colorHex: primaryColor === 'white' ? '#1e1e1e' : colorHex,
        yardagePerUnit: 1.8,
        expectedQuantity: defaultQuantity,
        measurements: {
          small: { outseam: 40, waist: 30, inseam: 31, rise: 10, hip: 38 },
          medium: { outseam: 41, waist: 32, inseam: 32, rise: 10.5, hip: 40 },
          large: { outseam: 42, waist: 34, inseam: 33, rise: 11, hip: 42 }
        },
        alternativeItems: ["Athletic Joggers", "Warm-Up Pants"],
        primaryColor: primaryColor === 'white' ? 'black' : primaryColor,
        priceEstimate: 32.99
      });
    }
    
    if (lowerCaseNotes.includes("shirt") || lowerCaseNotes.includes("tee") || lowerCaseNotes.includes("t-shirt")) {
      items.push({
        itemName: "Team T-Shirt",
        category: "shirt",
        designDetails: "Team logo centered on chest",
        fabricType: "Cotton",
        colorDisplay: primaryColor,
        colorHex,
        yardagePerUnit: 1.2,
        expectedQuantity: defaultQuantity,
        measurements: {
          small: { bodyLength: 27, chest: 38, shoulder: 16, sleeve: 8 },
          medium: { bodyLength: 28, chest: 40, shoulder: 17, sleeve: 8.5 },
          large: { bodyLength: 29, chest: 42, shoulder: 18, sleeve: 9 }
        },
        alternativeItems: ["Performance Tee", "Long-Sleeve Shirt"],
        primaryColor,
        priceEstimate: 18.99
      });
    }
    
    if (lowerCaseNotes.includes("hoodie") || lowerCaseNotes.includes("sweatshirt")) {
      items.push({
        itemName: "Team Hoodie",
        category: "hoodie",
        designDetails: "Small logo on chest, hood with drawstrings",
        fabricType: "Fleece",
        colorDisplay: primaryColor,
        colorHex,
        yardagePerUnit: 2.0,
        expectedQuantity: defaultQuantity,
        measurements: {
          small: { bodyLength: 26, chest: 40, shoulder: 17, sleeve: 25 },
          medium: { bodyLength: 27, chest: 42, shoulder: 18, sleeve: 26 },
          large: { bodyLength: 28, chest: 44, shoulder: 19, sleeve: 27 }
        },
        alternativeItems: ["Pull-Over Hoodie", "Quarter-Zip Sweatshirt"],
        primaryColor,
        priceEstimate: 39.99
      });
    }
    
    // Fallback for empty results
    if (items.length === 0) {
      items.push({
        itemName: "Custom Apparel Item",
        category: "generic",
        designDetails: "Details to be specified",
        fabricType: "To be determined",
        colorDisplay: "Gray",
        colorHex: "#cccccc",
        yardagePerUnit: 1.5,
        expectedQuantity: defaultQuantity,
        measurements: {
          small: { height: 20, width: 20 },
          medium: { height: 22, width: 22 },
          large: { height: 24, width: 24 }
        },
        requiresReview: true,
        alternativeItems: ["T-Shirt", "Hoodie", "Jacket"],
        primaryColor: "gray",
        priceEstimate: 25.99
      });
    }
    
    return items;
  }
  
  /**
   * Process the parsed items - in production this would:
   * 1. Check for existing fabrics in the database
   * 2. Look for matching catalog items
   * 3. Create or update product catalog entries
   * 4. Handle measurement templates
   */
  async processItemsForLead(leadId: number, items: ParsedItem[]) {
    console.log(`Processing ${items.length} items for lead ${leadId}`);
    
    // Enhanced processing with more realistic data
    return items.map(item => ({
      ...item,
      processedAt: new Date().toISOString(),
      catalogItemId: this.generateCatalogId(item.category),
      fabricId: this.matchFabricId(item.fabricType),
      measurementSchemaId: this.getMeasurementSchemaId(item.category),
      // Add manufacturing specifications
      manufacturingSpecs: {
        estimatedProductionTime: this.estimateProductionTime(item.category, item.expectedQuantity || 20),
        minimumOrderQuantity: this.calculateMinimumOrderQuantity(item.category),
        recommendedPrinter: this.recommendPrinter(item.designDetails),
        productionNotes: `${item.fabricType} ${item.category} with ${item.designDetails}`
      }
    }));
  }
  
  /**
   * Helper methods to generate realistic data
   */
  private getColorHexFromName(colorName: string): string {
    const normalizedColor = colorName.toLowerCase();
    
    // Try direct match first
    for (const [key, value] of Object.entries(colorReferenceMap)) {
      if (normalizedColor.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Fallback colors
    if (normalizedColor.includes('dark')) return '#333333';
    if (normalizedColor.includes('light')) return '#f8f9fa';
    return '#457b9d'; // Default blue
  }
  
  private generateProductCode(category: string, itemName: string): string {
    const prefix = category.substring(0, 2).toUpperCase();
    const hash = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${hash}`;
  }
  
  private estimatePrice(category: string, fabricType: string): number {
    const basePrices: Record<string, number> = {
      shirt: 18.99,
      pants: 32.99,
      shorts: 24.99,
      hoodie: 39.99,
      jacket: 45.99,
      singlet: 21.99,
      generic: 25.99
    };
    
    const premiumFabrics = ['Performance', 'Moisture-wicking', 'Wool', 'Silk', 'Organic'];
    const isPremium = premiumFabrics.some(fabric => fabricType.includes(fabric));
    
    const basePrice = basePrices[category] || 25.99;
    return isPremium ? basePrice * 1.25 : basePrice;
  }
  
  private generateCatalogId(category: string): number {
    // In production, this would query the database for matching items
    const categoryPrefixes: Record<string, number> = {
      shirt: 1000,
      pants: 2000,
      shorts: 3000,
      hoodie: 4000,
      jacket: 5000,
      singlet: 6000,
      generic: 9000
    };
    
    const prefix = categoryPrefixes[category] || 9000;
    return prefix + Math.floor(Math.random() * 1000);
  }
  
  private matchFabricId(fabricType: string): number {
    // In production, this would match against fabric database
    const fabricMap: Record<string, number> = {
      'Cotton': 101,
      'Polyester': 102,
      'Poly-cotton blend': 103,
      'Fleece': 104,
      'Performance fabric': 105,
      'Denim': 106,
      'Jersey': 107,
      'Nylon': 108,
      'Spandex': 109
    };
    
    // Try to find a match in our fabric map
    for (const [key, value] of Object.entries(fabricMap)) {
      if (fabricType.includes(key)) {
        return value;
      }
    }
    
    // Return a generic fabric ID if no match
    return 100;
  }
  
  private getMeasurementSchemaId(category: string): number {
    const schemaMap: Record<string, number> = {
      'pants': 1,
      'shorts': 2,
      'shirt': 3,
      'hoodie': 4,
      'jacket': 5,
      'singlet': 6,
      'generic': 99
    };
    
    return schemaMap[category] || 99;
  }
  
  private estimateProductionTime(category: string, quantity: number): string {
    const baseTimeInDays = {
      'shirt': 7,
      'pants': 10,
      'shorts': 8,
      'hoodie': 12,
      'jacket': 15,
      'singlet': 9,
      'generic': 10
    }[category] || 10;
    
    // Add days based on quantity
    let additionalDays = 0;
    if (quantity > 100) additionalDays = 7;
    else if (quantity > 50) additionalDays = 3;
    
    return `${baseTimeInDays + additionalDays} business days`;
  }
  
  private calculateMinimumOrderQuantity(category: string): number {
    return {
      'shirt': 12,
      'pants': 12,
      'shorts': 12,
      'hoodie': 12,
      'jacket': 8,
      'singlet': 12,
      'generic': 10
    }[category] || 10;
  }
  
  private recommendPrinter(designDetails: string): string {
    if (designDetails.toLowerCase().includes('embroid')) return 'EmbroideryPro Inc.';
    if (designDetails.toLowerCase().includes('sublim')) return 'TotalDye Sublimation';
    if (designDetails.toLowerCase().includes('screen')) return 'ScreenMasters LLC';
    return 'Universal Printing Services';
  }
}

export default new AiParsingService();