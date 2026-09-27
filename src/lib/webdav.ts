import { createClient, type WebDAVClient } from "webdav";

let client: WebDAVClient | null = null;

function getClient(): WebDAVClient {
  if (client) return client;

  const url = process.env.WEBDAV_URL;
  const username = process.env.WEBDAV_USERNAME;
  const password = process.env.WEBDAV_PASSWORD;

  if (!url || !username || !password) {
    throw new Error(
      "WebDAV is not configured. Set WEBDAV_URL, WEBDAV_USERNAME and WEBDAV_PASSWORD in your .env file."
    );
  }

  client = createClient(url, { username, password });
  return client;
}

const BASE_FOLDER = process.env.WEBDAV_BASE_PATH || "/qualifications-vault";

export function remotePathFor(userId: string, filename: string) {
  return `${BASE_FOLDER}/${userId}/${filename}`;
}

export async function uploadToWebdav(remotePath: string, buffer: Buffer) {
  const dav = getClient();
  const dir = remotePath.substring(0, remotePath.lastIndexOf("/"));
  if (dir) {
    const exists = await dav.exists(dir).catch(() => false);
    if (!exists) {
      await dav.createDirectory(dir, { recursive: true });
    }
  }
  await dav.putFileContents(remotePath, buffer, { overwrite: true });
}

export async function downloadFromWebdav(remotePath: string): Promise<Buffer> {
  const dav = getClient();
  const data = await dav.getFileContents(remotePath);
  return Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
}

export async function deleteFromWebdav(remotePath: string) {
  const dav = getClient();
  await dav.deleteFile(remotePath).catch(() => {
    // Already gone, or the folder was removed some other way — not fatal.
  });
}
