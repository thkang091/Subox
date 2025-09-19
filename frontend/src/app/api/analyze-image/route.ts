import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Comprehensive criteria list based on your chat form

export async function POST(request: NextRequest) {
  try {
    const { step, description, itemData } = await request.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (step) {
      case 'generate':
        systemPrompt = `You are a helpful assistant that creates casual, engaging listing descriptions for a student marketplace app. Your job is to:

1. Write casual, one-line descriptions that sound natural and friendly
2. Include key details: item name, condition, price, and pickup/delivery info
3. Make it appealing to college students
4. Keep it concise but engaging
5. Use a conversational tone like you're texting a friend

Examples:
- "Great condition IKEA desk for $45 - perfect for studying, pickup only in Dinkytown!"
- "Selling my barely used microwave for $30 OBO, works perfectly and can deliver!"
- "Like new textbook for $25, saved me through calculus - pickup available!"

Return only the description, nothing else.`;

        const { itemName, condition, price, priceType, delivery, location } = itemData;
        userPrompt = `Write a casual one-line listing description for:
- Item: ${itemName}
- Condition: ${condition}
- Price: $${price} ${priceType === 'obo' ? '(OBO)' : ''}
- ${delivery === 'pickup' ? 'Pickup only' : delivery === 'delivery' ? 'Delivery available' : 'Pickup or delivery'}
- Location: ${location}`;
        break;

      case 'cleanup':
        systemPrompt = `You are a helpful assistant that cleans up rental listing descriptions. Your job is to:
1. Fix grammar and typos
2. Translate any non-English text to English
3. Improve clarity and readability
4. Maintain the original meaning and tone
5. Format the text nicely

Return only the cleaned description, nothing else.`;
        userPrompt = `Clean up this rental listing description:\n\n${description}`;
        break;

        case 'extract':
            systemPrompt = `You are a helpful assistant that extracts key information from rental listings. 
          Extract and return a JSON object with the following fields (use null if not found):
          
          ESSENTIAL INFORMATION:
          - listingType: string ("Sublet", "Lease Takeover", "Room in Shared Unit", or null)
          - rent: number (monthly rent amount)
          - bedrooms: number
          - bathrooms: number  
          - location: string (neighborhood or address)
          - availableFrom: string (start date)
          - availableTo: string (end date)
          - utilitiesIncluded: boolean
          - contactInfo: string
          
          IMPORTANT DETAILS:
          - deposit: number (security deposit amount)
          - furnished: boolean
          - isPrivateRoom: boolean (true if private room, false if shared)
          - rentNegotiable: boolean
          - priceRange: object with min/max if negotiable mentioned
          
          ROOMMATE INFORMATION:
          - hasRoommates: boolean (will there be roommates)
          - roommateGender: string (gender preference if mentioned)
          - currentOccupantQuiet: boolean (if current person describes themselves)
          - currentOccupantSmokes: boolean
          - currentOccupantPets: boolean
          - petsAllowed: boolean
          - smokingAllowed: boolean
          
          ADDITIONAL FEATURES:
          - amenities: array of strings (parking, gym, wifi, etc.)
          - includedItems: array of strings (desk, chair, etc.)
          - subleaseReason: string (reason for subletting)
          - partialDatesOk: boolean (flexible with dates)
          - roomToursAvailable: boolean
          - additionalDetails: string (extra info about place/neighborhood)
          
          CRITICAL RULE: Only extract information that is EXPLICITLY mentioned in the text. 
          Do NOT assume or infer information. If something is not clearly stated, use null.
          For booleans, only use true/false if explicitly mentioned, otherwise use null.
          
          Return only valid JSON, no other text.`;
            userPrompt = `Extract information from this description:\n\n${description}`;
            break;
            

      case 'questions':
        systemPrompt = `You are a helpful assistant for a subletting platform called Subox. Your job is to analyze a rental description against comprehensive listing criteria and provide intelligent follow-up questions.

COMPREHENSIVE LISTING CRITERIA TO CHECK:

ESSENTIAL (must have):
1. Listing Type: Sublet, Lease Takeover, or Room in Shared Unit
2. Availability: Specific start and end dates
3. Location: Address or neighborhood
4. Monthly rent: Exact amount
5. Utilities: Included or separate
6. Space details: Number of bedrooms and bathrooms
7. Contact information: How to reach the person

IMPORTANT:
8. Room type: Private room or shared room
9. Furnished status: Furnished, partially furnished, or unfurnished
10. Security deposit: Amount required
11. Rent negotiability: Fixed price or negotiable (with range)
12. Amenities: Parking, WiFi, gym, laundry, etc.
13. Photos: Visual representation of the space
14. Date flexibility: Open to partial rental periods

ROOMMATE-RELATED:
15. Roommate situation: Will there be roommates
16. Current occupant info: Personality (quiet/social), smoking, pets
17. Roommate preferences: Gender, pets allowed, smoking allowed
18. Lifestyle preferences: Noise level, cleanliness expectations

ADDITIONAL DETAILS:
19. Sublease reason: Why they're subletting
20. Included items: Furniture or items staying with place
21. Additional features: Special amenities, neighborhood highlights
22. Room tours: Available for in-person visits
23. Address visibility: Show exact address or just neighborhood
24. Price range: If negotiable, what's acceptable range

Your response should be a JSON object with:
{
  "summary": "Brief summary of what you understood",
  "foundCriteria": ["List of criteria that were clearly mentioned"],
  "missingEssential": ["Essential criteria that are missing"],
  "missingImportant": ["Important criteria that are missing"],
  "missingRoommate": ["Roommate-related criteria that are missing"],
  "missingAdditional": ["Additional criteria that are missing"],
  "questions": ["Array of 5-8 conversational questions to get missing info"],
  "priorityLevel": "high/medium/low based on how much essential info is missing"
}

Be thorough in your analysis and ask questions in a casual, friendly tone with emojis.`;
        
        userPrompt = `Analyze this rental listing description against the comprehensive criteria and identify what's missing:\n\n${description}`;
        break;

      case 'analyze':
        systemPrompt = `You are an expert rental listing analyzer. Analyze the given description against comprehensive listing criteria and provide a detailed assessment.

CRITERIA CATEGORIES:
1. ESSENTIAL: listingType, availability, location, rent, utilities, bedrooms, bathrooms, contactInfo
2. IMPORTANT: roomType, furnished, deposit, rentNegotiable, amenities, photos, partialDates
3. ROOMMATE: hasRoommates, roommatePreferences, currentOccupantInfo
4. ADDITIONAL: subleaseReason, includedItems, additionalDetails, roomTours

Return a JSON object with:
{
  "completenessScore": number (0-100),
  "foundInformation": {
    "essential": ["criteria found"],
    "important": ["criteria found"],
    "roommate": ["criteria found"],
    "additional": ["criteria found"]
  },
  "missingInformation": {
    "essential": ["criteria missing"],
    "important": ["criteria missing"], 
    "roommate": ["criteria missing"],
    "additional": ["criteria missing"]
  },
  "recommendations": ["suggestions for improvement"],
  "readinessLevel": "ready/needs-work/incomplete"
}`;
        
        userPrompt = `Analyze this listing description comprehensively:\n\n${description}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid step' },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using GPT-4 for better analysis
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      throw new Error('No response from OpenAI');
    }

    // Handle different response formats based on step
    switch (step) {
      case 'generate':
        return NextResponse.json({ description: result.trim() });
      
      case 'extract':
      case 'questions':
      case 'analyze':
        try {
          const parsedResult = JSON.parse(result);
          return NextResponse.json({ [step]: parsedResult });
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          console.error('Raw result:', result);
          return NextResponse.json(
            { error: 'Invalid JSON response from AI', rawResponse: result },
            { status: 500 }
          );
        }
      
      case 'cleanup':
        return NextResponse.json({ cleaned: result });
      
      default:
        return NextResponse.json({ result });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}