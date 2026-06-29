import { initializeApp } from "firebase/app";
import { initializeFirestore, Firestore } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { Logger } from "../utils/logger";

let dbInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      throw new Error(`Firebase applet config not found at: ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent);

    Logger.info(`Initializing Firebase App for Project: ${config.projectId}`);
    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    // Custom databaseId is required since the workspace uses custom-named Firestore databases
    const databaseId = config.firestoreDatabaseId || "(default)";
    Logger.info(`Initializing Firestore with Database ID: ${databaseId}`);

    dbInstance = initializeFirestore(app, {}, databaseId);

    return dbInstance;
  } catch (error) {
    Logger.error("Failed to initialize Firestore database connection", error);
    throw error;
  }
}
