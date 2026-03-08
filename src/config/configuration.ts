export default () => ({
  service: {
    port: parseInt(process.env.SERVICE_PORT ?? '3000', 10),
    grpcPort: parseInt(process.env.GRPC_PORT ?? '50051', 10),
    environment: process.env.ENVIRONMENT ?? 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/auth-db',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://lyxa_user:lyxa_password@localhost:5672',
    queue: process.env.RABBITMQ_QUEUE ?? 'auth_queue',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-change-me',
    accessExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN ?? '900', 10),   // 15 min
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN ?? '604800', 10), // 7 days
  },
});
