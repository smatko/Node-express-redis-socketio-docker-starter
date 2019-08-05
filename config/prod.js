module.exports = {
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: process.env.REDIS_PORT || '6379',
  redisPassword: process.env.REDIS_PASSWORD || 'password',
  jwtSecret: process.env.JWT_SECRET || "secret",
  port: process.env.PORT || 5000,
  mongoHost: process.env.MONGO_HOSTNAME || 'localhost',
  mongoUsername: process.env.MONGO_USERNAME || 'root',
  mongoPassword: process.env.MONGO_PASSWORD || 'password',
  mongoPort: process.env.MONGO_PORT || '27017',
  mongoDbName: process.env.MONGO_DATABASE_NAME || 'app-database'
};