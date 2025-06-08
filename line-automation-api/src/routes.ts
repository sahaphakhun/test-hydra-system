import { Express } from 'express';
import { lineConfigRoutes } from './routes/lineConfig';
import { lineAccountRoutes } from './routes/lineAccount';
import { messageTemplateRoutes } from './routes/messageTemplate';
import { campaignRoutes } from './routes/campaign';

/**
 * ลงทะเบียนเส้นทาง API ทั้งหมด
 */
export function registerRoutes(app: Express): void {
  // เส้นทางหลัก
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // เส้นทาง API
  app.use('/api/line-configs', lineConfigRoutes);
  app.use('/api/line-accounts', lineAccountRoutes);
  app.use('/api/message-templates', messageTemplateRoutes);
  app.use('/api/campaigns', campaignRoutes);
} 