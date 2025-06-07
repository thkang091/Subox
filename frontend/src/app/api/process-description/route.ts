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
        - bedrooms: number
        - bathrooms: number  
        - rent: number (monthly rent amount only, exclude utilities)
        - deposit: number (security deposit amount, use 0 if explicitly stated as no deposit)
        - availableFrom: string (date)
        - availableTo: string (date)
        - location: string
        - furnished: boolean
        - utilitiesIncluded: boolean (true if utilities are included in rent or mentioned as additional cost)
        - petFriendly: boolean
        - contactInfo: string
        
        Important extraction rules:
        - For rent: Extract only the base monthly rent, not including utilities
        - For utilities: Set utilitiesIncluded to true if utilities are mentioned as included OR if there's an additional cost for utilities mentioned
        - For deposit: Look for security deposit, damage deposit, or similar terms. If no deposit is mentioned, use null. If "no deposit" is stated, use 0
        - For furnished: true if furniture, beds, desks, etc. are mentioned as included
        - For dates: Extract in readable format (e.g., "January 2025", "Aug 25th")
        - For contact: Extract email addresses, phone numbers, or contact instructions
        
        Return only valid JSON, no other text.`;
          userPrompt = `Extract information from this description:\n\n${description}`;
          break;
          

      case 'questions':
        systemPrompt = `You are a helpful assistant for a subletting platform called Subox. Your job is to:

1. First, provide a friendly summary of what you understood from the rental description
2. Then, list what key information is missing
3. Finally, ask 3-5 conversational questions to get the missing details

Be casual and friendly like texting a friend. Use emojis. Make it feel natural and conversational.

Focus on these key details if missing:
- Monthly rent amount
- Exact location/address  
- Availability dates (start/end)
- Number of bedrooms/bathrooms
- Utilities included or not
- Deposit amount
- Contact information
- Furnished or not
- Parking availability
- Pet policy

Return a JSON object with this structure:
{
  "summary": "Here's what I understood from your description: [summary]",
  "missing": ["List of missing information"],
  "questions": ["Array of 3-5 casual questions"]
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