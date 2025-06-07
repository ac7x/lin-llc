import { getFunctions, httpsCallable, Functions } from "firebase/functions";
import { firebaseApp } from "./firebase-client";
import { getAppCheckToken } from "./firebase-appcheck";

let functionsInstance: Functions | null = null;

export async function initializeFunctions(): Promise<Functions | null> {
  if (functionsInstance) return functionsInstance;
  if (typeof window === "undefined") return null;
  const appCheckToken = await getAppCheckToken();
  if (!appCheckToken) {
    throw new Error("App Check token is not available. Functions initialization aborted.");
  }
  functionsInstance = getFunctions(firebaseApp);
  return functionsInstance;
}

export { httpsCallable };
