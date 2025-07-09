import {
  GalaxyCreationResponseSchema,
  StarsListSchema,
  FirstStepResponseSchema,
  MissionsSchema,
  type GalaxyCreationResponse,
  type StarsListResponse,
  type FirstStepResponse,
  type MissionsResponse,
} from "./schemas";
import { z } from "zod";

// Helper function to validate galaxy creation response
export const validateGalaxyCreationResponse = (response: any): GalaxyCreationResponse => {
  try {
    return GalaxyCreationResponseSchema.parse(response);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      throw new Error(
        `Galaxy creation response validation failed: ${validationError.errors
          .map((e) => e.message)
          .join(", ")}`,
      );
    }
    throw new Error("Galaxy creation response validation failed");
  }
};

// Helper function to validate stars list response with journey metadata
export const validateStarsListResponse = (response: any): StarsListResponse => {
  try {
    return StarsListSchema.parse(response);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      throw new Error(
        `Stars list validation failed: ${validationError.errors.map((e) => e.message).join(", ")}`,
      );
    }
    throw new Error("Stars list validation failed");
  }
};

// Helper function to validate first step response (stars list or gathering context)
export const validateFirstStepResponse = (response: any): FirstStepResponse => {
  try {
    return FirstStepResponseSchema.parse(response);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      throw new Error(
        `First step response validation failed: ${validationError.errors
          .map((e) => e.message)
          .join(", ")}`,
      );
    }
    throw new Error("First step response validation failed");
  }
};

// Helper function to validate missions response
export const validateMissionsResponse = (response: any): MissionsResponse => {
  try {
    return MissionsSchema.parse(response);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      throw new Error(
        `Missions response validation failed: ${validationError.errors
          .map((e) => e.message)
          .join(", ")}`,
      );
    }
    throw new Error("Missions response validation failed");
  }
};
