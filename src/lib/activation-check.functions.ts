import { createServerFn } from "@tanstack/react-start";

export interface LocalActivation {
  email: string;
  plan: string;
  activationDate: string;
  expiryDate: string;
}

// Browser-safe dynamic Node fs/path helper
export async function getFS() {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    return { fs, path };
  } catch (err) {
    console.error("Failed to load node fs components:", err);
    return null;
  }
}

export const ACTIVATIONS_FILE_NAME = "supabase_activations_fallback.json";

export async function readLocalActivations(): Promise<LocalActivation[]> {
  const node = await getFS();
  if (!node) return [];
  const { fs, path } = node;
  const filePath = path.join(process.cwd(), ACTIVATIONS_FILE_NAME);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Local activations read failed:", err);
  }
  return [];
}

export async function writeLocalActivation(activation: LocalActivation): Promise<void> {
  const node = await getFS();
  if (!node) return;
  const { fs, path } = node;
  const filePath = path.join(process.cwd(), ACTIVATIONS_FILE_NAME);
  try {
    const list = await readLocalActivations();
    const filtered = list.filter((a) => a.email.toLowerCase() !== activation.email.toLowerCase());
    filtered.push(activation);
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
    console.log(
      `[Backup Activation] Saved activation for ${activation.email} in fallback database file`,
    );
  } catch (err) {
    console.error("Local activations write failed:", err);
  }
}

export const checkActivationForUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (typeof input === "string") return input;
    if (input && typeof input === "object" && "data" in input) {
      const innerData = (input as { data?: unknown }).data;
      if (innerData && typeof innerData === "object" && "email" in innerData) {
        return String((innerData as { email?: unknown }).email || "");
      }
      return String(innerData || "");
    }
    return String(input || "");
  })
  .handler(async ({ data: email }) => {
    const emailStr = String(email || "")
      .toLowerCase()
      .trim();
    if (!emailStr) return null;

    const list = await readLocalActivations();
    const found = list.find((a) => a.email.toLowerCase() === emailStr);

    if (found) {
      const hasExpired = new Date(found.expiryDate) <= new Date();
      if (!hasExpired) {
        return found;
      }
    }
    return null;
  });
