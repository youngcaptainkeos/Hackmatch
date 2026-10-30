import mysql from 'mysql2/promise';
// A small reusable pool. Queries stay visible in the route files.
const globalDatabase = globalThis;
export function getMySQL() {
  if (!process.env.MYSQL_URL) throw new Error('MySQL is not configured');
  if (!globalDatabase.mysqlPool) {
    const url = new URL(process.env.MYSQL_URL);
    globalDatabase.mysqlPool = mysql.createPool({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      connectionLimit: 5,
      waitForConnections: true,
      socketPath: process.env.MYSQL_SOCKET || undefined,
      ssl:
        process.env.MYSQL_SSL === 'true'
          ? {
              rejectUnauthorized: true,
              ...(process.env.MYSQL_SSL_CA
                ? { ca: process.env.MYSQL_SSL_CA.replace(/\\n/g, '\n') }
                : {}),
            }
          : undefined,
      timezone: 'Z',
      decimalNumbers: true,
    });
  }
  return globalDatabase.mysqlPool;
}
