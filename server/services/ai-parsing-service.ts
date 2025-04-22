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

interface ParsedItem {
  itemName: string;
  category: string;
  designDetails: string;
  fabricType: string;
  colorHex: string;
  yardagePerUnit: number;
  measurements: {
    [size: string]: {
      [measurement: string]: number;
    };
  };
  requiresReview?: boolean;
}

class AiParsingService {
  /**
   * Parse client notes into structured item data
   * In a real implementation, this would use OpenAI function calling or Claude
   */
  async parseItemsFromNotes(clientNotes: string): Promise<ParsedItem[]> {
    console.log("Processing client notes for AI parsing:", clientNotes);
    
    // For demo purposes, we'll create mock parsed items
    // In a real implementation, this would call OpenAI with function calling
    const mockParsedItems: ParsedItem[] = [];
    
    // Mock parsing logic
    if (clientNotes.toLowerCase().includes("jacket")) {
      mockParsedItems.push({
        itemName: "Team Jacket",
        category: "jacket",
        designDetails: "Team logo on back, small logo on chest",
        fabricType: "Polyester",
        colorHex: "#0a2463",
        yardagePerUnit: 2.5,
        measurements: {
          small: { bodyLength: 26, chest: 40, shoulder: 17, sleeve: 25 },
          medium: { bodyLength: 27, chest: 42, shoulder: 18, sleeve: 26 },
          large: { bodyLength: 28, chest: 44, shoulder: 19, sleeve: 27 }
        }
      });
    }
    
    if (clientNotes.toLowerCase().includes("pant") || clientNotes.toLowerCase().includes("pants")) {
      mockParsedItems.push({
        itemName: "Team Pants",
        category: "pants",
        designDetails: "Logo on left leg, elastic waistband",
        fabricType: "Poly-cotton blend",
        colorHex: "#1e1e1e",
        yardagePerUnit: 1.8,
        measurements: {
          small: { outseam: 40, waist: 30, inseam: 31, rise: 10, hip: 38 },
          medium: { outseam: 41, waist: 32, inseam: 32, rise: 10.5, hip: 40 },
          large: { outseam: 42, waist: 34, inseam: 33, rise: 11, hip: 42 }
        }
      });
    }
    
    if (clientNotes.toLowerCase().includes("shirt") || clientNotes.toLowerCase().includes("tee") || clientNotes.toLowerCase().includes("t-shirt")) {
      mockParsedItems.push({
        itemName: "Team T-Shirt",
        category: "shirt",
        designDetails: "Team logo centered on chest",
        fabricType: "Cotton",
        colorHex: "#e63946",
        yardagePerUnit: 1.2,
        measurements: {
          small: { bodyLength: 27, chest: 38, shoulder: 16, sleeve: 8 },
          medium: { bodyLength: 28, chest: 40, shoulder: 17, sleeve: 8.5 },
          large: { bodyLength: 29, chest: 42, shoulder: 18, sleeve: 9 }
        }
      });
    }
    
    if (clientNotes.toLowerCase().includes("hoodie") || clientNotes.toLowerCase().includes("sweatshirt")) {
      mockParsedItems.push({
        itemName: "Team Hoodie",
        category: "hoodie",
        designDetails: "Small logo on chest, hood with drawstrings",
        fabricType: "Fleece",
        colorHex: "#457b9d",
        yardagePerUnit: 2.0,
        measurements: {
          small: { bodyLength: 26, chest: 40, shoulder: 17, sleeve: 25 },
          medium: { bodyLength: 27, chest: 42, shoulder: 18, sleeve: 26 },
          large: { bodyLength: 28, chest: 44, shoulder: 19, sleeve: 27 }
        }
      });
    }
    
    // Fallback for empty results
    if (mockParsedItems.length === 0) {
      mockParsedItems.push({
        itemName: "Custom Apparel Item",
        category: "generic",
        designDetails: "Details to be specified",
        fabricType: "To be determined",
        colorHex: "#cccccc",
        yardagePerUnit: 1.5,
        measurements: {
          small: { height: 20, width: 20 },
          medium: { height: 22, width: 22 },
          large: { height: 24, width: 24 }
        },
        requiresReview: true
      });
    }
    
    return mockParsedItems;
  }
  
  /**
   * Process the parsed items - in a real implementation, this would:
   * 1. Check for existing fabrics in the database
   * 2. Look for matching catalog items
   * 3. Create or update product catalog entries
   * 4. Handle measurement templates
   */
  async processItemsForLead(leadId: number, items: ParsedItem[]) {
    // This would involve database operations in a real implementation
    console.log(`Processing ${items.length} items for lead ${leadId}`);
    
    // Return processed items with additional metadata
    return items.map(item => ({
      ...item,
      processedAt: new Date().toISOString(),
      // In a real implementation, these would be actual database IDs
      catalogItemId: Math.floor(Math.random() * 1000),
      fabricId: Math.floor(Math.random() * 100),
    }));
  }
}

export default new AiParsingService();