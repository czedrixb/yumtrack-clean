import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface NutritionAnalysis {
  foodName: string;
  confidence: number;
  calories: number;
  servingSize: string;
  macronutrients: {
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  vitamins: Array<{
    name: string;
    amount: string;
    dailyValue: string;
  }>;
  minerals: Array<{
    name: string;
    amount: string;
    dailyValue: string;
  }>;
  healthInsights: string[];
}

export async function analyzeFoodImage(base64Image: string): Promise<NutritionAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional nutritionist and food recognition expert. Analyze the food image and provide detailed nutrition information. 
          
          Respond with JSON in this exact format:
          {
            "foodName": "string",
            "confidence": number (0-1),
            "calories": number,
            "servingSize": "string (e.g., '1 serving (150g)')",
            "macronutrients": {
              "protein": number,
              "carbohydrates": number,
              "fat": number,
              "fiber": number,
              "sugar": number,
              "sodium": number
            },
            "vitamins": [
              {
                "name": "string",
                "amount": "string",
                "dailyValue": "string"
              }
            ],
            "minerals": [
              {
                "name": "string", 
                "amount": "string",
                "dailyValue": "string"
              }
            ],
            "healthInsights": ["string"]
          }
          
          Be accurate with nutritional values. If you cannot identify the food clearly, set confidence below 0.7.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and provide detailed nutrition information including calories, macronutrients, vitamins, minerals, and health insights."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate the response has required fields
    if (!result.foodName || !result.calories || !result.macronutrients) {
      throw new Error("Invalid response from OpenAI - missing required nutrition data");
    }

    return result;
  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze food image: " + (error as Error).message);
  }
}
