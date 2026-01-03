require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: '*', // Adjust for production
});

// Import services
const logsService = require('./src/services/logs-service');

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Get logs endpoint
fastify.get('/api/logs', async (request, reply) => {
  const { startTime, endTime } = request.query;
  try {
    const logs = await logsService.getAPIMLogs(startTime, endTime);
    return logs;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch logs' });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
