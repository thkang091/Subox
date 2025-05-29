// lib/googleVision.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { VisionAnalysisResult, DetectedObject, ItemSuggestion } from '../types/vision';

// Initialize the client
const vision = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export class GoogleVisionService {
  static async analyzeImage(imageBuffer: Buffer): Promise<VisionAnalysisResult> {
    try {
      // Perform multiple detection types
      const [objectResult] = await vision.objectLocalization({
        image: { content: imageBuffer },
      });

      const [labelResult] = await vision.labelDetection({
        image: { content: imageBuffer },
        maxResults: 20,
      });

      const [propertiesResult] = await vision.imageProperties({
        image: { content: imageBuffer },
      });

      // Process objects
      const objects: DetectedObject[] = (objectResult.localizedObjectAnnotations || [])
        .filter(obj => obj.score && obj.score > 0.5) // Filter by confidence
        .map(obj => ({
          name: obj.name || 'Unknown Object',
          confidence: obj.score || 0,
          category: this.categorizeObject(obj.name || ''),
        }))
        .slice(0, 10); // Limit to top 10 objects

      // Process labels
      const labels = (labelResult.labelAnnotations || [])
        .filter(label => label.score && label.score > 0.7)
        .map(label => ({
          description: label.description || '',
          score: label.score || 0,
        }))
        .slice(0, 15);

      // Process dominant colors
      const dominantColors = propertiesResult.imagePropertiesAnnotation?.dominantColors?.colors
        ?.slice(0, 5)
        .map(colorInfo => ({
          color: {
            red: colorInfo.color?.red || 0,
            green: colorInfo.color?.green || 0,
            blue: colorInfo.color?.blue || 0,
          },
          score: colorInfo.score || 0,
        }));

      return {
        objects,
        labels,
        dominantColors,
      };
    } catch (error) {
      console.error('Google Vision API Error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  private static categorizeObject(objectName: string): string {
    const categories = {
      'Furniture': ['chair', 'table', 'desk', 'bed', 'sofa', 'couch', 'dresser', 'cabinet', 'shelf', 'bookshelf'],
      'Electronics': ['laptop', 'computer', 'monitor', 'television', 'phone', 'tablet', 'speaker', 'headphones', 'camera', 'gaming'],
      'Appliances': ['refrigerator', 'microwave', 'washer', 'dryer', 'dishwasher', 'oven', 'blender', 'toaster'],
      'Clothing': ['shirt', 'pants', 'dress', 'jacket', 'shoes', 'hat', 'bag', 'purse', 'backpack'],
      'Books & Media': ['book', 'magazine', 'cd', 'dvd', 'vinyl', 'record'],
      'Sports & Recreation': ['bicycle', 'skateboard', 'ball', 'racket', 'weights', 'yoga', 'fitness'],
      'Kitchen & Dining': ['plate', 'cup', 'glass', 'utensil', 'pot', 'pan', 'bowl', 'cutting board'],
      'Home Decor': ['lamp', 'mirror', 'picture', 'vase', 'plant', 'clock', 'candle', 'pillow'],
    };

    const lowerName = objectName.toLowerCase();
    
    for (const [category, items] of Object.entries(categories)) {
      if (items.some(item => lowerName.includes(item))) {
        return category;
      }
    }
    
    return 'Other';
  }

  static generateItemSuggestions(visionResult: VisionAnalysisResult): ItemSuggestion[] {
    const suggestions: ItemSuggestion[] = [];
    
    // Process detected objects
    visionResult.objects.forEach(obj => {
      const suggestion = this.createItemSuggestion(obj.name, obj.confidence, obj.category);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    // Process labels as backup suggestions
    visionResult.labels.forEach(label => {
      if (!suggestions.some(s => s.itemName.toLowerCase().includes(label.description.toLowerCase()))) {
        const suggestion = this.createItemSuggestion(label.description, label.score);
        if (suggestion && suggestion.confidence > 0.7) {
          suggestions.push(suggestion);
        }
      }
    });

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private static createItemSuggestion(
    itemName: string, 
    confidence: number, 
    category?: string
  ): ItemSuggestion | null {
    const priceMap: Record<string, number> = {
      // Furniture
      'chair': 25, 'table': 40, 'desk': 60, 'bed': 100, 'sofa': 80, 'couch': 80,
      'dresser': 70, 'cabinet': 50, 'shelf': 30, 'bookshelf': 35,
      
      // Electronics
      'laptop': 200, 'computer': 150, 'monitor': 80, 'television': 120, 'tv': 120,
      'phone': 100, 'tablet': 80, 'speaker': 30, 'headphones': 25, 'camera': 60,
      
      // Appliances
      'refrigerator': 200, 'microwave': 40, 'washer': 150, 'dryer': 120,
      'dishwasher': 100, 'oven': 80, 'blender': 15, 'toaster': 10,
      
      // Default prices by category
      'clothing': 10, 'book': 5, 'kitchen': 8, 'home decor': 15, 'sports': 20,
    };

    const lowerName = itemName.toLowerCase();
    let suggestedPrice = 20; // Default price

    // Find specific price
    for (const [key, price] of Object.entries(priceMap)) {
      if (lowerName.includes(key)) {
        suggestedPrice = price;
        break;
      }
    }

    // Generate alternative names
    const alternativeNames = this.generateAlternativeNames(itemName);

    return {
      itemName: this.formatItemName(itemName),
      category: category || 'Other',
      suggestedPrice,
      confidence,
      alternativeNames,
    };
  }

  private static formatItemName(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private static generateAlternativeNames(itemName: string): string[] {
    const alternatives: Record<string, string[]> = {
      'chair': ['Seat', 'Dining Chair', 'Office Chair'],
      'table': ['Desk', 'Dining Table', 'Coffee Table'],
      'sofa': ['Couch', 'Loveseat', 'Sectional'],
      'television': ['TV', 'Smart TV', 'Monitor'],
      'laptop': ['Computer', 'MacBook', 'Notebook'],
      'bicycle': ['Bike', 'Mountain Bike', 'Road Bike'],
    };

    const lowerName = itemName.toLowerCase();
    for (const [key, alts] of Object.entries(alternatives)) {
      if (lowerName.includes(key)) {
        return alts;
      }
    }

    return [itemName + ' (Used)', itemName + ' (Like New)'];
  }
}