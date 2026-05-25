// Google Drive Auth and Upload utility with Firebase Integration
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { toast } from "sonner";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App lazily to ensure robust startup and no side-effects on load
const getFirebaseApp = () => {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

let gdriveAccessToken: string | null = null;

// Standard Client ID injected by AI Studio setup or configured in .env
const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function getCachedToken(): string | null {
  if (gdriveAccessToken) return gdriveAccessToken;

  // Check if there is a temp token saved in localStorage
  const tempToken = localStorage.getItem("temp_gdrive_token");
  if (tempToken) {
    gdriveAccessToken = tempToken;
    localStorage.removeItem("temp_gdrive_token");
    return tempToken;
  }
  return null;
}

export function setCachedToken(token: string) {
  gdriveAccessToken = token;
}

export function logoutGoogle() {
  gdriveAccessToken = null;
  localStorage.removeItem("temp_gdrive_token");

  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    auth.signOut();
  } catch (err) {
    console.warn("Sign out from Firebase failed or not configured yet:", err);
  }

  toast.success("تم تسجيل الخروج من Google Drive بنجاح");
}

export function getGoogleClientId(): string {
  // Check localStorage first for custom user override, then local env
  const saved = localStorage.getItem("qadeyti_google_client_id");
  if (saved) return saved;
  return DEFAULT_CLIENT_ID;
}

export function saveGoogleClientId(clientId: string) {
  localStorage.setItem("qadeyti_google_client_id", clientId);
}

/**
 * Fallback to standard Google Implicit OAuth Flow using standard popup.
 */
function fallbackImplicitFlow(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const redirectUri = `${window.location.origin}/oauth-callback.html`;
    const scope = "https://www.googleapis.com/auth/drive.file";
    const state = `google_drive_${Date.now()}`;

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scope)}` +
      `&include_granted_scopes=true` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=consent`;

    // Calculate center screen coordinates for popup
    const width = 600;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      "google_drive_oauth",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`,
    );

    if (!popup) {
      reject(new Error("POPUP_BLOCKED"));
      return;
    }

    // Set a safety timeout
    const timeoutId = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      reject(new Error("TIMEOUT"));
    }, 120000); // 2 minutes

    const handleMessage = (event: MessageEvent) => {
      // Basic safety checks for origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_DRIVE_AUTH_SUCCESS") {
        clearTimeout(timeoutId);
        window.removeEventListener("message", handleMessage);

        const token = event.data.token;
        setCachedToken(token);
        resolve(token);
      } else if (event.data?.type === "GOOGLE_DRIVE_AUTH_FAILURE") {
        clearTimeout(timeoutId);
        window.removeEventListener("message", handleMessage);
        reject(new Error(event.data.error || "AUTHORIZATION_FAILED"));
      }
    };

    window.addEventListener("message", handleMessage);

    // Watch for window closure
    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosedInterval);
        // Give a tiny buffer for postMessage to win
        setTimeout(() => {
          clearTimeout(timeoutId);
          window.removeEventListener("message", handleMessage);

          // Check if resolved via on-disk token fallback
          const finalToken = getCachedToken();
          if (finalToken) {
            resolve(finalToken);
          } else {
            reject(new Error("WINDOW_CLOSED"));
          }
        }, 300);
      }
    }, 1000);
  });
}

/**
 * Initiates either Google OAuth Implicit Flow or the direct unified Firebase auth popup.
 * Returns a promise that resolves with the access token or rejects with an error.
 */
export function authenticateGoogleDrive(customClientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // If a custom Client ID was configured by the developer/user, we let them use the standard implicit flow
    const clientId = customClientId || getGoogleClientId();
    if (clientId) {
      return fallbackImplicitFlow(clientId).then(resolve).catch(reject);
    }

    // Always open `/gdrive-auth` on the active origin, so the route loads from our actual hosted Vercel or local app
    const authUrl = `${window.location.origin}/gdrive-auth`;

    // Calculate center coordinates for popup
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      "google_drive_popup_auth",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`,
    );

    if (!popup) {
      reject(new Error("POPUP_BLOCKED"));
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      reject(new Error("TIMEOUT"));
    }, 180000); // 3 minutes

    const handleMessage = (event: MessageEvent) => {
      // Security check: allow messages from the current parent origin or our default firebaseapp domain
      const allowedOrigins = [
        window.location.origin,
        firebaseConfig.authDomain
          ? `https://${firebaseConfig.authDomain}`
          : "https://qadeyati-844c7.firebaseapp.com",
        "https://gen-lang-client-0226596636.firebaseapp.com", // Keep backward compatibility
      ];
      if (!allowedOrigins.includes(event.origin)) return;

      if (event.data?.type === "GOOGLE_DRIVE_AUTH_SUCCESS") {
        clearTimeout(timeoutId);
        window.removeEventListener("message", handleMessage);

        const token = event.data.token;
        setCachedToken(token);
        resolve(token);
      } else if (event.data?.type === "GOOGLE_DRIVE_AUTH_FAILURE") {
        clearTimeout(timeoutId);
        window.removeEventListener("message", handleMessage);
        reject(new Error(event.data.error || "AUTHORIZATION_FAILED"));
      }
    };

    window.addEventListener("message", handleMessage);

    // Watch for window closure
    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosedInterval);
        setTimeout(() => {
          clearTimeout(timeoutId);
          window.removeEventListener("message", handleMessage);

          // Check if resolved via on-disk token fallback
          const finalToken = getCachedToken();
          if (finalToken) {
            resolve(finalToken);
          } else {
            reject(new Error("WINDOW_CLOSED"));
          }
        }, 500);
      }
    }, 1000);
  });
}

/**
 * Uploads a file blob to Google Drive to the root of drive.file area.
 */
export async function uploadFileToGoogleDrive(
  token: string,
  fileName: string,
  fileType: string | null,
  fileBlob: Blob,
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const boundary = "qadeyti_gdrive_boundary";
  const metadata = {
    name: fileName,
    mimeType: fileType || "application/octet-stream",
  };

  const multipartBody = new Blob(
    [
      `--${boundary}\r\n`,
      "Content-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${fileType || "application/octet-stream"}\r\n\r\n`,
      fileBlob,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Google Drive Upload Error Response:", errorText);
    throw new Error(`خطأ في الرفع إلى جودل درايف: ${res.statusText}`);
  }

  const data = await res.json();

  // Try to retrieve webViewLink if available
  let webViewLink: string | undefined;
  try {
    const fileId = data.id;
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      webViewLink = metaData.webViewLink;
    }
  } catch (e) {
    console.warn("Failed to retrieve file webViewLink, but upload succeeded:", e);
  }

  return {
    id: data.id,
    name: data.name,
    webViewLink,
  };
}
