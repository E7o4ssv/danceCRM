const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Информация об API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Информация об API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Dance School API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups', 
      students: '/api/students',
      attendance: '/api/attendance',
      health: '/api/health',
      metrics: '/api/metrics',
      docs: '/api-docs'
    },
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Проверка здоровья сервера
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Сервер работает нормально
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Время работы сервера в секундах
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Метрики сервера
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Метрики сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 memory:
 *                   type: object
 *                 cpu:
 *                   type: object
 */
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100 // MB
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000 * 100) / 100, // ms
      system: Math.round(cpuUsage.system / 1000 * 100) / 100 // ms
    },
    uptime: process.uptime(),
    version: process.version,
    platform: process.platform
  });
});

module.exports = router; 