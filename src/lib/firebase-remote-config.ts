// src/lib/firebase-remote-config.ts
import { getRemoteConfig, fetchAndActivate } from "@firebase/remote-config";
import { firebaseApp } from "./firebase-client";

const remoteConfig = getRemoteConfig(firebaseApp);

export async function fetchRemoteConfig() {
  try {
    await fetchAndActivate(remoteConfig);
    return remoteConfig;
  } catch (error) {
    console.error("Failed to fetch remote config:", error);
    throw error;
  }
}
