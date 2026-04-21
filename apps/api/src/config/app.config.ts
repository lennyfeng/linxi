export interface AppConfig {
  appName: string;
  port: number;
  nodeEnv: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}

export function getAppConfig(): AppConfig {
  return {
    appName: process.env.APP_NAME || 'internal-platform-api',
    port: Number(process.env.PORT || 3100),
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      name: process.env.DB_NAME || 'internal_platform',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
    },
  };
}
