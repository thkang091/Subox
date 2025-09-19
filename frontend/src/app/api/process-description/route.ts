import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { step, description, itemData } = await request.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (step) {
      case 'generate':
  systemPrompt = `You are a helpful assistant that creates engaging, detailed listing descriptions for a student marketplace app. Your job is to:

1. Write appealing, multi-sentence descriptions that tell a story about the item
2. Include ALL key details: item name, condition, price, and pickup/delivery info
3. Make it highly appealing to college students with specific benefits
4. Use an enthusiastic but authentic tone
5. Mention why it's perfect for student life
6. Include condition details and any selling points
7. End with clear logistics (price, pickup/delivery, location)

Write 2-4 sentences that make the buyer excited about the item. Be specific about why a student would want this item.

Examples:
- "This IKEA Malm desk has been my study companion through two semesters and it's in amazing condition! The spacious surface easily fits a laptop, textbooks, and coffee mug - perfect for those late-night study sessions. The clean white finish will match any dorm aesthetic and the sturdy build means it'll last through graduation. Asking $45, pickup only in Dinkytown!"

- "Barely used Hamilton Beach microwave that's been a lifesaver for quick meals between classes! Works perfectly with all the preset functions, and the compact size is ideal for dorm rooms or small apartments. No more expensive campus food when you can heat up leftovers in seconds. Selling for $30 and I can deliver within 2 miles!"

Return only the description, nothing else.`;

  const { itemName, condition, price, priceType, delivery, location, minPrice, maxPrice } = itemData;
  
  let priceText = `$${price}`;
  if (priceType === 'negotiable' && minPrice && maxPrice) {
    priceText = `$${minPrice}-${maxPrice} (asking $${price})`;
  } else if (priceType === 'negotiable') {
    priceText = `$${price} OBO`;
  }
  
  const deliveryText = delivery === 'pickup' ? 'pickup only' : 
                   delivery === 'delivery' ? 'delivery available' : 
                   'pickup or delivery available';
  
  userPrompt = `Write an engaging, detailed description for:
- Item: ${itemName}
- Condition: ${condition}
- Price: ${priceText}
- ${deliveryText}
- Location: ${location}

Make it sound appealing to college students and explain why they'd want this item.`;
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
        systemPrompt = `You are a helpful assistant for a subletting platform called Subox. Your job is to:

1. First, provide a friendly summary of what you understood from the rental description
2. Then, list what key information is missing
3. Finally, ask 3-8 conversational questions to get the missing details

Be casual and friendly like texting a friend. Use emojis. Make it feel natural and conversational.

Focus on these key details if missing:
- Monthly rent amount and if it's negotiable
- Listing type (sublet, takeover, roommate search)
- Exact location/address or campus area
- Availability dates (both start AND end dates)
- Number of bedrooms/bathrooms
- Utilities included or not
- Deposit amount
- Contact information and preferred contact method
- Furnished status and what's left behind if unfurnished
- Roommate situation and preferences
- General amenities
- Tour availability vs photos only
- Flexible dates policy
- Reason for subletting/leaving

Return a JSON object with this structure:
{
  "summary": "Here's what I understood from your description: [summary]",
  "missing": ["List of missing information"],
  "questions": ["Array of 3-8 casual questions focusing on missing info"]
}`;
        userPrompt = `Analyze this rental listing description and provide a summary, missing info, and follow-up questions:\n\n${description}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid step' },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
        try {
          const parsedResult = JSON.parse(result);
          return NextResponse.json({ [step]: parsedResult });
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          return NextResponse.json(
            { error: 'Invalid JSON response from AI' },
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