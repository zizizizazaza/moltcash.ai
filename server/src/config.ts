import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'loka-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  lokaAi: {
    apiKey: process.env.LOKA_AI_API_KEY || '',
    baseUrl: process.env.LOKA_AI_BASE_URL || '',
    model: process.env.LOKA_AI_MODEL || 'deepseek-v3',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;
