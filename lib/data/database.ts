export interface ConnectionInfo {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export function parseConnectionUrl(connectionString: string): ConnectionInfo | null {
  try {
    const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (!match) return null;

    const [, username, password, host, port, database] = match;
    return { host, port, database, username, password };
  } catch {
    return null;
  }
}
