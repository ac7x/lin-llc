import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from "firebase/remote-config";
import { firebaseApp } from "./firebase-client";
import { getAppCheckToken } from "./firebase-appcheck";

let remoteConfigInstance: RemoteConfig | null = null;

export async function initializeRemoteConfig(): Promise<RemoteConfig | null> {
  if (remoteConfigInstance) return remoteConfigInstance;
  if (typeof window === "undefined") return null;
  const appCheckToken = await getAppCheckToken();
  if (!appCheckToken) {
    throw new Error("App Check token is not available. Remote Config initialization aborted.");
  }
  remoteConfigInstance = getRemoteConfig(firebaseApp);
  return remoteConfigInstance;
}

export { fetchAndActivate, getValue };
