// OpenAI model pricing per million tokens (as of 2024)
export const OPENAI_MODEL_PRICING = {
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "dall-e-3": { input: 0.04, output: 0 }, // DALL-E pricing is per image, not per token
} as const;

export type OpenAIModel = keyof typeof OPENAI_MODEL_PRICING;

/**
 * Calculates the estimated cost for a model's token usage
 * @param model - The OpenAI model used
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Estimated cost in USD
 */
export function calculateModelCost(
  model: OpenAIModel,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = OPENAI_MODEL_PRICING[model];
  if (!pricing) {
    console.warn(`Unknown model pricing for: ${model}`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Interface for token usage tracking per model
 */
export interface ModelTokenUsage {
  model: OpenAIModel;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Interface for combined token usage across multiple models
 */
export interface CombinedTokenUsage {
  modelsUsed: ModelTokenUsage[];
  combinedEstimatedCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
}

/**
 * Creates a combined token usage object from multiple model usages
 * @param modelUsages - Array of model token usage objects
 * @returns Combined token usage with totals and estimated cost
 */
export function createCombinedTokenUsage(modelUsages: ModelTokenUsage[]): CombinedTokenUsage {
  const totalInputTokens = modelUsages.reduce((sum, usage) => sum + usage.inputTokens, 0);
  const totalOutputTokens = modelUsages.reduce((sum, usage) => sum + usage.outputTokens, 0);
  const totalTokens = modelUsages.reduce((sum, usage) => sum + usage.totalTokens, 0);
  const combinedEstimatedCost = modelUsages.reduce((sum, usage) => sum + usage.estimatedCost, 0);

  return {
    modelsUsed: modelUsages,
    combinedEstimatedCost,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
  };
}

/**
 * Creates a model token usage object from OpenAI response
 * @param model - The model used
 * @param usage - OpenAI usage object
 * @returns Model token usage with estimated cost
 */
export function createModelTokenUsage(
  model: OpenAIModel,
  usage: { input_tokens?: number; output_tokens?: number; total_tokens?: number },
): ModelTokenUsage {
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const totalTokens = usage.total_tokens || 0;
  const estimatedCost = calculateModelCost(model, inputTokens, outputTokens);

  return {
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost,
  };
}
