import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key_2026',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_food_db',
  corsOrigin: process.env.CLIENT_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;
