import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';

// ===============================
// TYPES
// ===============================

interface DetectedObject {
  name: string;
  confidence: number;
  category?: string;
  suggestedPrice?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface VisionAnalysisResult {
  objects: DetectedObject[];
  labels: Array<{
    description: string;
    score: number;
  }>;
  dominantColors?: Array<{
    color: { red: number; green: number; blue: number };
    score: number;
  }>;
}

interface ItemSuggestion {
  itemName: string;
  category: string;
  suggestedPrice: number;
  confidence: number;
  alternativeNames: string[];
}

// ===============================
// GOOGLE CLOUD VISION CLIENT
// ===============================

const vision = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

// ===============================
// HELPER FUNCTIONS
// ===============================

function categorizeObject(objectName: string): string {
  const categories = {
    'Furniture': [
      'chair', 'table', 'desk', 'bed', 'sofa', 'couch', 'dresser', 
      'cabinet', 'shelf', 'bookshelf', 'nightstand', 'ottoman', 
      'bench', 'stool', 'wardrobe', 'armchair', 'dining table'
    ],
    'Electronics': [
      'laptop', 'computer', 'monitor', 'television', 'tv', 'phone', 
      'tablet', 'speaker', 'headphones', 'camera', 'gaming', 'xbox', 
      'playstation', 'nintendo', 'printer', 'router'
    ],
    'Appliances': [
      'refrigerator', 'fridge', 'microwave', 'washer', 'dryer', 
      'dishwasher', 'oven', 'blender', 'toaster', 'coffee maker',
      'air conditioner', 'heater', 'vacuum'
    ],
    'Clothing': [
      'shirt', 'pants', 'dress', 'jacket', 'shoes', 'hat', 'bag', 
      'purse', 'backpack', 'jeans', 'sweater', 'coat'
    ],
    'Books & Media': [
      'book', 'magazine', 'cd', 'dvd', 'vinyl', 'record', 'novel', 'textbook'
    ],
    'Sports & Recreation': [
      'bicycle', 'bike', 'skateboard', 'ball', 'racket', 'weights', 
      'yoga', 'fitness', 'treadmill', 'exercise'
    ],
    'Kitchen & Dining': [
      'plate', 'cup', 'glass', 'utensil', 'pot', 'pan', 'bowl', 
      'cutting board', 'knife', 'fork', 'spoon'
    ],
    'Home Decor': [
      'lamp', 'mirror', 'picture', 'frame', 'vase', 'plant', 'clock', 
      'candle', 'pillow', 'curtain', 'rug', 'artwork'
    ],
  };

  const lowerName = objectName.toLowerCase();
  
  for (const [category, items] of Object.entries(categories)) {
    if (items.some(item => lowerName.includes(item))) {
      return category;
    }
  }
  
  return 'Other';
}

function suggestPrice(objectName: string, category: string): number {
  const priceMap: Record<string, number> = {
    // Furniture
    'chair': 25, 'dining chair': 30, 'office chair': 45, 'armchair': 60,
    'table': 40, 'dining table': 80, 'coffee table': 35, 'desk': 60,
    'bed': 120, 'sofa': 100, 'couch': 100, 'dresser': 80, 'nightstand': 35,
    'cabinet': 50, 'shelf': 30, 'bookshelf': 40, 'wardrobe': 90,
    
    // Electronics
    'laptop': 250, 'computer': 200, 'monitor': 90, 'television': 150, 'tv': 150,
    'tablet': 120, 'phone': 100, 'speaker': 40, 'headphones': 30, 'camera': 80,
    'gaming console': 180, 'xbox': 180, 'playstation': 180, 'printer': 60,
    
    // Appliances
    'refrigerator': 300, 'fridge': 300, 'microwave': 50, 'washer': 200, 
    'dryer': 180, 'dishwasher': 150, 'oven': 120, 'coffee maker': 25,
    'air conditioner': 100, 'vacuum': 40,
    
    // Default prices by category
    'furniture': 45, 'electronics': 80, 'appliances': 70, 'clothing': 15,
    'books & media': 8, 'sports & recreation': 25, 'kitchen & dining': 12,
    'home decor': 18, 'other': 20
  };

  const lowerName = objectName.toLowerCase();
  
  // Try to find specific item price
  for (const [key, price] of Object.entries(priceMap)) {
    if (lowerName.includes(key)) {
      return price;
    }
  }
  
  // Fall back to category-based pricing
  const categoryPrice = priceMap[category.toLowerCase()];
  return categoryPrice || 25; // Default fallback price
}

function generateAlternativeNames(itemName: string): string[] {
  const alternatives: Record<string, string[]> = {
    'chair': ['Seat', 'Dining Chair', 'Office Chair', 'Desk Chair'],
    'table': ['Desk', 'Dining Table', 'Coffee Table', 'Side Table'],
    'sofa': ['Couch', 'Loveseat', 'Sectional', 'Settee'],
    'television': ['TV', 'Smart TV', 'Monitor', 'Screen'],
    'laptop': ['Computer', 'Notebook', 'MacBook', 'PC'],
    'bicycle': ['Bike', 'Mountain Bike', 'Road Bike', 'Cycling Bike'],
    'bed': ['Mattress', 'Bed Frame', 'Sleeping Bed', 'Bedroom Furniture'],
    'dresser': ['Chest of Drawers', 'Bedroom Storage', 'Wardrobe'],
    'bookshelf': ['Bookcase', 'Shelf', 'Storage Unit', 'Display Case']
  };

  const lowerName = itemName.toLowerCase();
  
  for (const [key, alts] of Object.entries(alternatives)) {
    if (lowerName.includes(key)) {
      return alts;
    }
  }

  // Generate generic alternatives
  return [
    itemName + ' (Used)',
    itemName + ' (Like New)',
    itemName + ' (Good Condition)',
    'Pre-owned ' + itemName
  ];
}

function formatItemName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ===============================
// VISION ANALYSIS SERVICE
// ===============================

async function analyzeImageWithVision(imageBuffer: Buffer): Promise<VisionAnalysisResult> {
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

    // Process detected objects
    const objects: DetectedObject[] = (objectResult.localizedObjectAnnotations || [])
      .filter(obj => obj.score && obj.score > 0.4) // Lower threshold for more detections
      .map(obj => {
        const name = obj.name || 'Unknown Object';
        const confidence = obj.score || 0;
        const category = categorizeObject(name);
        const suggestedPrice = suggestPrice(name, category);
        
        // Extract bounding box coordinates
        let boundingBox;
        if (obj.boundingPoly?.normalizedVertices && obj.boundingPoly.normalizedVertices.length >= 4) {
          const vertices = obj.boundingPoly.normalizedVertices;
          const xs = vertices.map(v => (v.x || 0) * 100);
          const ys = vertices.map(v => (v.y || 0) * 100);
          
          boundingBox = {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          };
        }

        return {
          name,
          confidence,
          category,
          suggestedPrice,
          boundingBox
        };
      })
      .slice(0, 8); // Limit to top 8 objects

    // Process labels
    const labels = (labelResult.labelAnnotations || [])
      .filter(label => label.score && label.score > 0.6)
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
    throw new Error('Failed to analyze image with Vision API');
  }
}

function generateItemSuggestions(visionResult: VisionAnalysisResult): ItemSuggestion[] {
  const suggestions: ItemSuggestion[] = [];
  
  // Process detected objects first (higher priority)
  visionResult.objects.forEach(obj => {
    const suggestion: ItemSuggestion = {
      itemName: formatItemName(obj.name),
      category: obj.category || 'Other',
      suggestedPrice: obj.suggestedPrice || suggestPrice(obj.name, obj.category || 'Other'),
      confidence: obj.confidence,
      alternativeNames: generateAlternativeNames(obj.name),
    };
    
    suggestions.push(suggestion);
  });

  // Add high-confidence labels as backup suggestions
  visionResult.labels.forEach(label => {
    if (label.score > 0.8) {
      const category = categorizeObject(label.description);
      
      // Only add if it's furniture-related and not already detected
      if (category !== 'Other' && !suggestions.some(s => 
        s.itemName.toLowerCase().includes(label.description.toLowerCase())
      )) {
        const suggestion: ItemSuggestion = {
          itemName: formatItemName(label.description),
          category,
          suggestedPrice: suggestPrice(label.description, category),
          confidence: label.score,
          alternativeNames: generateAlternativeNames(label.description),
        };
        
        suggestions.push(suggestion);
      }
    }
  });

  // Sort by confidence and return top suggestions
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6); // Limit to top 6 suggestions
}

// ===============================
// API ROUTE HANDLER
// ===============================

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
        !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
        !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Cloud Vision API credentials not configured' },
        { status: 500 }
      );
    }

    // Convert base64 to buffer and optimize
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Optimize image for Vision API (max 4MB, reasonable dimensions)
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Analyze with Google Vision
    const visionResult = await analyzeImageWithVision(optimizedBuffer);
    
    // Generate item suggestions
    const suggestions = generateItemSuggestions(visionResult);

    // Return successful response
    return NextResponse.json({
      success: true,
      analysis: visionResult,
      suggestions,
      totalObjects: visionResult.objects.length,
      totalLabels: visionResult.labels.length,
      message: `Detected ${visionResult.objects.length} objects and ${suggestions.length} item suggestions`
    });

  } catch (error) {
    console.error('Analyze Image API Error:', error);
    
    // Return detailed error for development, generic for production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze image',
      details: isDevelopment ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
    }, { status: 500 });
  }
}
