/*--------------------------
sometimes this script wont work because of node versions. needs to be run with node v20.
use something like nvm or mise.
eg. mise exec -- node query-scripts/storage-size-query.js
--------------------------*/

// Script to analyze Firebase Storage folders and find largest files per folder
// Optimized version with parallel processing
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

// Load service account key
const serviceAccountPath = resolve(homedir(), "Downloads/galaxy-maps-ac367-781e01bee645.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin with service account
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
});

const storage = getStorage();

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Get the top-level folder from a file path
function getTopLevelFolder(filePath) {
  const parts = filePath.split("/");
  return parts.length > 1 ? parts[0] : "(root)";
}

// Process files in parallel batches
async function processBatch(files, batchSize = 50) {
  const folderData = {};
  let processedCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (file) => {
        try {
          // Try to get size from file metadata first (faster)
          let size = file.metadata?.size;
          let contentType = file.metadata?.contentType;
          let updated = file.metadata?.updated;

          // If not available, fetch metadata
          if (size === undefined) {
            const [metadata] = await file.getMetadata();
            size = parseInt(metadata.size || 0);
            contentType = metadata.contentType || "unknown";
            updated = metadata.updated || "unknown";
          } else {
            size = parseInt(size || 0);
            contentType = contentType || "unknown";
            updated = updated || "unknown";
          }

          const folder = getTopLevelFolder(file.name);

          if (!folderData[folder]) {
            folderData[folder] = {
              totalSize: 0,
              fileCount: 0,
              files: [],
            };
          }

          folderData[folder].totalSize += size;
          folderData[folder].fileCount++;
          folderData[folder].files.push({
            name: file.name,
            size: size,
            contentType: contentType,
            updated: updated,
          });
        } catch (error) {
          console.error(`Error getting metadata for ${file.name}:`, error.message);
        }
      }),
    );

    processedCount += batch.length;

    // Show progress with estimated time remaining
    if (processedCount % 100 === 0 || processedCount === files.length) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processedCount / elapsed;
      const remaining = Math.ceil((files.length - processedCount) / rate);
      const percentage = ((processedCount / files.length) * 100).toFixed(1);

      console.log(
        `Processed ${processedCount}/${files.length} files (${percentage}%)... ` +
          (remaining > 0 ? `~${remaining}s remaining` : "Done!"),
      );
    }
  }

  return folderData;
}

async function analyzeByFolder() {
  try {
    console.log("Analyzing Firebase Storage by folder (optimized)...\n");

    const bucket = storage.bucket();
    console.log(`Analyzing bucket: ${bucket.name}`);
    console.log("Listing all files...\n");

    // List all files in the bucket
    const [files] = await bucket.getFiles();

    if (files.length === 0) {
      console.log("No files found in this bucket.");
      process.exit(0);
    }

    console.log(`Found ${files.length} files`);
    console.log("Processing file metadata in parallel batches...\n");

    // Process files in parallel batches (much faster!)
    const folderData = await processBatch(files, 50);

    console.log("");

    // Sort folders by size (largest first)
    const sortedFolders = Object.entries(folderData).sort(
      ([, a], [, b]) => b.totalSize - a.totalSize,
    );

    // Display results for each folder
    console.log("=".repeat(80));
    console.log("STORAGE ANALYSIS BY FOLDER");
    console.log("=".repeat(80));
    console.log("\nFolder Summary:");
    console.log("-".repeat(80));

    let grandTotal = 0;
    let grandTotalFiles = 0;

    sortedFolders.forEach(([folderName, data], index) => {
      const percentage = files.length > 0 ? ((data.fileCount / files.length) * 100).toFixed(1) : 0;
      console.log(`${(index + 1).toString().padStart(2)}. ${folderName}`);
      console.log(`    Files: ${data.fileCount} (${percentage}%)`);
      console.log(
        `    Size: ${formatBytes(data.totalSize)} (${data.totalSize.toLocaleString()} bytes)`,
      );
      console.log("");

      grandTotal += data.totalSize;
      grandTotalFiles += data.fileCount;
    });

    console.log("-".repeat(80));
    console.log(`Total: ${grandTotalFiles} files, ${formatBytes(grandTotal)}`);
    console.log("");

    // Show top 10 largest files per folder
    sortedFolders.forEach(([folderName, data]) => {
      console.log("\n" + "=".repeat(80));
      console.log(`FOLDER: ${folderName}`);
      console.log("=".repeat(80));
      console.log(`Total: ${data.fileCount} files, ${formatBytes(data.totalSize)}\n`);

      // Sort files by size
      data.files.sort((a, b) => b.size - a.size);
      const top10 = data.files.slice(0, 10);

      console.log("Top 10 Largest Files:");
      console.log("-".repeat(80));

      top10.forEach((file, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${file.name}`);
        console.log(`    Size: ${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`);
        console.log(`    Type: ${file.contentType}`);
        console.log(`    Updated: ${file.updated}`);
        console.log("");
      });

      // Show size distribution for this folder
      if (data.files.length > 0) {
        console.log("Size Distribution:");
        console.log("-".repeat(80));
        const sizeRanges = {
          "0-1 KB": 0,
          "1-10 KB": 0,
          "10-100 KB": 0,
          "100 KB-1 MB": 0,
          "1-10 MB": 0,
          "10-100 MB": 0,
          "100+ MB": 0,
        };

        data.files.forEach((file) => {
          const sizeKB = file.size / 1024;
          const sizeMB = sizeKB / 1024;

          if (file.size < 1024) {
            sizeRanges["0-1 KB"]++;
          } else if (sizeKB < 10) {
            sizeRanges["1-10 KB"]++;
          } else if (sizeKB < 100) {
            sizeRanges["10-100 KB"]++;
          } else if (sizeKB < 1024) {
            sizeRanges["100 KB-1 MB"]++;
          } else if (sizeMB < 10) {
            sizeRanges["1-10 MB"]++;
          } else if (sizeMB < 100) {
            sizeRanges["10-100 MB"]++;
          } else {
            sizeRanges["100+ MB"]++;
          }
        });

        Object.entries(sizeRanges).forEach(([range, count]) => {
          if (count > 0) {
            console.log(`  ${range.padEnd(15)}: ${count} files`);
          }
        });
      }
    });

    process.exit(0);
  } catch (error) {
    console.error("Error analyzing storage:", error.message);
    console.error("\nMake sure you are authenticated with Firebase.");
    console.error("Try running: gcloud auth application-default login");
    process.exit(1);
  }
}

analyzeByFolder();
