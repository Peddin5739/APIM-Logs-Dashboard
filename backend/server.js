require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: '*', // Adjust for production
});

// Import services
const logsService = require('./src/services/logs-service');

// In-memory telemetry storage for mock APIs
const mockTelemetry = [];

// Helper to backfill some historical data for better graphs
const backfillMockData = () => {
  const now = new Date();
  const endpointPool = [
    { method: 'POST', url: '/erebor/1.0/quotes' },
    { method: 'POST', url: '/elevate-mgu/1.0/submissions' },
    { method: 'POST', url: '/kafka/1.0/topics/EREBOR_pas_quotes/records' }
  ];

  for (let i = 0; i < 200; i++) {
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now - hoursAgo * 60 * 60 * 1000 - Math.random() * 60 * 60 * 1000);
    const route = endpointPool[Math.floor(Math.random() * endpointPool.length)];
    const isError = Math.random() < 0.1;

    mockTelemetry.push({
      timestamp: timestamp.toISOString(),
      name: route.url,
      success: isError ? 'False' : 'True',
      resultCode: isError ? (Math.random() < 0.5 ? 400 : 500) : 200,
      duration: Math.floor(Math.random() * 200) + 50,
      url: route.url,
      method: route.method
    });
  }
  mockTelemetry.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

backfillMockData();

const logMockTelemetry = (request, reply) => {
  const telemetry = {
    timestamp: new Date().toISOString(),
    name: request.routeOptions.url,
    success: reply.statusCode < 400 ? 'True' : 'False',
    resultCode: reply.statusCode,
    duration: Math.floor(Math.random() * 200) + 50,
    url: request.url,
    method: request.method
  };
  mockTelemetry.push(telemetry);
  if (mockTelemetry.length > 1000) mockTelemetry.shift();
};

// Export telemetry for the logs service
module.exports = { mockTelemetry };

// Mock Endpoints
const mockRoutes = [
  { method: 'POST', url: '/erebor/1.0/quotes' },
  { method: 'GET', url: '/erebor/1.0/quotes/:id/status' },
  { method: 'PUT', url: '/erebor/1.0/quotes/:id' },
  { method: 'POST', url: '/shrimagerightdocument/1.0/v1.0/Upload' },
  { method: 'POST', url: '/elevate-mgu/1.0/submissions' },
  { method: 'PUT', url: '/elevate-mgu/1.0/submissions' },
  { method: 'POST', url: '/elevate-mgu/1.0/quotes' },
  { method: 'POST', url: '/kafka/1.0/topics/:topic/records' }
];

mockRoutes.forEach(route => {
  fastify.route({
    method: route.method,
    url: route.url,
    handler: async (request, reply) => {
      // Simulate random errors (~15% rate)
      const isError = Math.random() < 0.15;
      if (isError) {
        reply.status(Math.random() < 0.5 ? 400 : 500);
      }
      logMockTelemetry(request, reply);
      if (isError) return { status: 'error', message: 'Simulated error' };
      return { status: 'success', message: `Mock ${route.method} successful` };
    }
  });
});

// Get logs endpoint
fastify.get('/api/logs', async (request, reply) => {
  let { startTime, endTime, range } = request.query;

  if (!startTime && range) {
    const now = new Date();
    if (range === '1h') startTime = new Date(now - 60 * 60 * 1000).toISOString();
    else if (range === '24h') startTime = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    else if (range === '7d') startTime = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  try {
    const logs = await logsService.getAPIMLogs(startTime, endTime, mockTelemetry);
    return logs;
  } catch (error) {
    fastify.log.error(error);
    // Fallback if Azure fails, return mock data
    return {
      stats: [], // You might want to process stats for mock data too
      raw: mockTelemetry.slice().reverse()
    };
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
