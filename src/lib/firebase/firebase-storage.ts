import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { firebaseApp } from "./firebase-client";
import { getAppCheckToken } from "./firebase-appcheck";

let storageInstance: ReturnType<typeof getStorage> | null = null;

export async function initializeStorage(): Promise<ReturnType<typeof getStorage> | null> {
  if (storageInstance) return storageInstance;
  if (typeof window === "undefined") return null;
  const appCheckToken = await getAppCheckToken();
  if (!appCheckToken) {
    throw new Error("App Check token is not available. Storage initialization aborted.");
  }
  storageInstance = getStorage(firebaseApp);
  return storageInstance;
}

export { ref, uploadBytes, getDownloadURL, deleteObject };
