export const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT as string),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};
