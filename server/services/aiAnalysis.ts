import { invokeLLM } from "../_core/llm";

export interface AIAnalysis {
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-100
  reasoning: string;
  marketImpact: string;
  suggestedAction: string;
  keyFactors: string[];
  riskLevel: "low" | "medium" | "high";
}

export interface MarketPrediction {
  direction: "up" | "down" | "sideways";
  magnitude: "small" | "medium" | "large";
  timeframe: string;
  entryPoint: string;
  exitPoint: string;
  stopLoss: string;
}

/**
 * Analyze news event and predict market impact
 */
export async function analyzeNewsImpact(
  newsTitle: string,
  newsDescription: string,
  relatedMarkets?: Array<{ question: string; venue: string; probability?: number }>
): Promise<AIAnalysis> {
  const marketsContext = relatedMarkets && relatedMarkets.length > 0
    ? `\n\nRelated prediction markets:\n${relatedMarkets.map((m, i) => 
        `${i + 1}. [${m.venue}] ${m.question}${m.probability ? ` (Current: ${(m.probability * 100).toFixed(1)}%)` : ""}`
      ).join("\n")}`
    : "";

  const prompt = `You are an expert market analyst specializing in prediction markets and event-driven trading.

Analyze this news event and predict its impact on related prediction markets:

**News**: ${newsTitle}
**Details**: ${newsDescription}${marketsContext}

Provide a comprehensive analysis in the following JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence explanation of why this news matters>",
  "marketImpact": "<specific prediction of how markets will react>",
  "suggestedAction": "<actionable trading advice>",
  "keyFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "riskLevel": "low" | "medium" | "high"
}

Focus on:
1. How this news changes market probabilities
2. Which direction prices are likely to move
3. Timing considerations (immediate vs delayed impact)
4. Risk factors that could invalidate the thesis`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a prediction market analyst. Always respond with valid JSON only, no markdown formatting." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "market_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: { 
                type: "string",
                enum: ["bullish", "bearish", "neutral"]
              },
              confidence: { 
                type: "number",
                description: "Confidence level from 0 to 100"
              },
              reasoning: { 
                type: "string",
                description: "2-3 sentence explanation"
              },
              marketImpact: { 
                type: "string",
                description: "Specific prediction of market reaction"
              },
              suggestedAction: { 
                type: "string",
                description: "Actionable trading advice"
              },
              keyFactors: { 
                type: "array",
                items: { type: "string" },
                description: "3-5 key factors driving the analysis"
              },
              riskLevel: { 
                type: "string",
                enum: ["low", "medium", "high"]
              }
            },
            required: ["sentiment", "confidence", "reasoning", "marketImpact", "suggestedAction", "keyFactors", "riskLevel"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from LLM");
    }

    const analysis = JSON.parse(content);
    return analysis;
  } catch (error) {
    console.error("[AIAnalysis] Failed to analyze news:", error);
    throw error;
  }
}

/**
 * Generate market movement prediction with entry/exit points
 */
export async function predictMarketMovement(
  marketQuestion: string,
  currentProbability: number,
  newsContext: string
): Promise<MarketPrediction> {
  const prompt = `You are a prediction market trader analyzing a specific market.

**Market**: ${marketQuestion}
**Current Probability**: ${(currentProbability * 100).toFixed(1)}%
**News Context**: ${newsContext}

Based on this information, predict how the market will move and provide trading recommendations in JSON format:
{
  "direction": "up" | "down" | "sideways",
  "magnitude": "small" | "medium" | "large",
  "timeframe": "<when the move is likely to happen>",
  "entryPoint": "<suggested probability to enter>",
  "exitPoint": "<suggested probability to exit>",
  "stopLoss": "<suggested stop loss level>"
}

Consider:
1. Current market pricing vs news impact
2. Time decay and resolution date
3. Market liquidity and spread
4. Potential catalysts or counter-events`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a prediction market trader. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "market_prediction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              direction: { 
                type: "string",
                enum: ["up", "down", "sideways"]
              },
              magnitude: { 
                type: "string",
                enum: ["small", "medium", "large"]
              },
              timeframe: { type: "string" },
              entryPoint: { type: "string" },
              exitPoint: { type: "string" },
              stopLoss: { type: "string" }
            },
            required: ["direction", "magnitude", "timeframe", "entryPoint", "exitPoint", "stopLoss"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from LLM");
    }

    const prediction = JSON.parse(content);
    return prediction;
  } catch (error) {
    console.error("[AIAnalysis] Failed to predict movement:", error);
    throw error;
  }
}
