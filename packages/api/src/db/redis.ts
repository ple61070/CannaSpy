import IORedis from 'ioredis'

export const redisCache = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
