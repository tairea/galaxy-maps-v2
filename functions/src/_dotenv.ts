import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of the current file (works in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the functions directory (one level up from lib/)
config({ path: resolve(__dirname, "../.env") });
