import { GalaxyCreationResponseSchema, type GalaxyCreationResponse } from "./schemas";

// Helper function to validate galaxy creation response
export const validateGalaxyCreationResponse = (response: any): GalaxyCreationResponse => {
  try {
    return GalaxyCreationResponseSchema.parse(response);
  } catch (validationError) {
    throw new Error("Response validation failed");
  }
};
