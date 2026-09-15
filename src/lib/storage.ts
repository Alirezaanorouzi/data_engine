import { createHash } from "crypto";
import { mkdir, writeFile, readFile, unlink, access } from "fs/promises";
import path from "path";

export function storageRoot() {
  return path.resolve(process.env.STORAGE_ROOT || "./storage");
}

export function uploadDir(projectId: string) {
  return path.join(storageRoot(), "uploads", projectId);
}

export function exportDir(projectId: string) {
  return path.join(storageRoot(), "exports", projectId);
}

export async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export function hashBuffer(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

export function hashText(text: string) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function saveUpload(
  projectId: string,
  contentHash: string,
  ext: string,
  data: Buffer,
) {
  const dir = uploadDir(projectId);
  await ensureDir(dir);
  const filename = `${contentHash}${ext.startsWith(".") ? ext : `.${ext}`}`;
  const fullPath = path.join(dir, filename);
  const relative = path.posix.join("uploads", projectId, filename);
  try {
    await access(fullPath);
  } catch {
    await writeFile(fullPath, data);
  }
  return { fullPath, relative, filename };
}

export function resolveStoragePath(relativePath: string) {
  const root = storageRoot();
  const full = path.resolve(root, relativePath);
  if (!full.startsWith(root)) {
    throw new Error("Invalid storage path");
  }
  return full;
}

export async function readStorageFile(relativePath: string) {
  return readFile(resolveStoragePath(relativePath));
}

export async function writeExportFile(
  projectId: string,
  filename: string,
  data: Buffer | string,
) {
  const dir = exportDir(projectId);
  await ensureDir(dir);
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, data);
  const relative = path.posix.join("exports", projectId, filename);
  return { fullPath, relative };
}

export async function deleteStorageFile(relativePath: string) {
  try {
    await unlink(resolveStoragePath(relativePath));
  } catch {
    // ignore missing
  }
}
