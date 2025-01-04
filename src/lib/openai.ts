import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateDishDescription(dishName: string, ingredients: string[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional food writer who creates engaging and appetizing descriptions of dishes."
        },
        {
          role: "user",
          content: `Write a short, appetizing description (max 100 words) for a dish named "${dishName}" with the following ingredients: ${ingredients.join(", ")}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Description not available";
  } catch (error) {
    console.error('Error generating dish description:', error);
    throw error;
  }
}

export async function suggestDishPairings(dishName: string, cuisine: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a culinary expert who suggests perfect dish pairings."
        },
        {
          role: "user",
          content: `Suggest 3 dishes that would pair well with "${dishName}" (${cuisine} cuisine). Return only the dish names separated by commas, no explanations.`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const suggestions = response.choices[0]?.message?.content?.split(',').map(s => s.trim()) || [];
    return suggestions;
  } catch (error) {
    console.error('Error generating dish pairings:', error);
    throw error;
  }
}

export async function generateCookingTips(dishName: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional chef providing cooking tips and tricks."
        },
        {
          role: "user",
          content: `Provide 3 professional cooking tips for preparing "${dishName}". Keep each tip concise.`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const tips = response.choices[0]?.message?.content?.split('\n').filter(tip => tip.trim()) || [];
    return tips;
  } catch (error) {
    console.error('Error generating cooking tips:', error);
    throw error;
  }
}

export async function generateCustomerResponse(customerQuery: string, context: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful customer service representative for a food delivery service. Provide friendly and professional responses."
        },
        {
          role: "user",
          content: `Context: ${context}\nCustomer Query: ${customerQuery}\nProvide a helpful response:`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Response not available";
  } catch (error) {
    console.error('Error generating customer response:', error);
    throw error;
  }
} 