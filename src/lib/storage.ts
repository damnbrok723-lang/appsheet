import { createClient } from "@supabase/supabase-js";

const storageUrl = process.env.SUPABASE_URL;
const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "documents";

function getStorageConfig() {
  if (!storageUrl || !storageKey) throw new Error("Supabase Storage is not configured");
  return { storageUrl, storageKey, storageBucket };
}

export async function uploadStorageFile(path: string, file: File) {
  const { storageUrl, storageKey, storageBucket } = getStorageConfig();
  const response = await fetch(`${storageUrl}/storage/v1/object/${storageBucket}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${storageKey}`, apikey: storageKey, "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
    body: await file.arrayBuffer(),
  });
  if (!response.ok) throw new Error(`Storage upload failed: ${await response.text()}`);
  return { bucket: storageBucket, path };
}

export async function downloadStorageFile(path: string) {
  const { storageUrl, storageKey, storageBucket } = getStorageConfig();
  const response = await fetch(`${storageUrl}/storage/v1/object/${storageBucket}/${path}`, { headers: { Authorization: `Bearer ${storageKey}`, apikey: storageKey } });
  if (!response.ok) throw new Error(`Storage download failed: ${await response.text()}`);
  return response;
}

export async function createStorageUploadUrl(path: string) {
  const { storageUrl, storageKey, storageBucket } = getStorageConfig();
  const client = createClient(storageUrl, storageKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.storage.from(storageBucket).createSignedUploadUrl(path);
  if (error || !data?.token) throw new Error(error?.message || "Unable to create storage upload URL");
  return { bucket: storageBucket, path, token: data.token };
}