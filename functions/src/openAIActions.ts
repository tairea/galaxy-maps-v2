import { runWith, logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { storage } from "./_shared.js";
import { STORAGE_BUCKET } from "./_constants.js";
import fetch from "node-fetch";

// Download and upload image
export const downloadAndUploadImageHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB"
}).https.onCall(async (data) => {
  try {
    logger.info("Starting downloadAndUploadImage function", {
      imageUrl: data.imageUrl?.substring(0, 50) + "...",
      fileName: data.fileName,
    });

    const { imageUrl, fileName } = data;
    if (!imageUrl || !fileName) {
      logger.error("Missing required fields", {
        imageUrl: !!imageUrl,
        fileName: !!fileName,
      });
      throw new HttpsError("invalid-argument", "Missing required fields: imageUrl or fileName");
    }

    // Download the image
    logger.info("Fetching image from URL");
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    logger.info("Image downloaded successfully", { size: buffer.length });

    // Upload to Firebase Storage
    logger.info("Starting upload to Firebase Storage");
    const file = storage.bucket(STORAGE_BUCKET).file(fileName);
    await file.save(buffer, {
      metadata: {
        contentType: "image/png",
      },
    });
    logger.info("File uploaded successfully", { fileName });

    // Get the public URL
    logger.info("Generating signed URL");
    const [downloadURL] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });
    logger.info("Signed URL generated successfully");

    return { downloadURL };
  } catch (error) {
    logger.error("Error in downloadAndUploadImage", error);
    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});
