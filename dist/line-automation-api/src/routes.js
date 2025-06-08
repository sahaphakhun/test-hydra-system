"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const lineConfig_1 = require("./routes/lineConfig");
const lineAccount_1 = require("./routes/lineAccount");
const messageTemplate_1 = require("./routes/messageTemplate");
const campaign_1 = require("./routes/campaign");
/**
 * ลงทะเบียนเส้นทาง API ทั้งหมด
 */
function registerRoutes(app) {
    // เส้นทางหลัก
    app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // เส้นทาง API
    app.use('/api/line-configs', lineConfig_1.lineConfigRoutes);
    app.use('/api/line-accounts', lineAccount_1.lineAccountRoutes);
    app.use('/api/message-templates', messageTemplate_1.messageTemplateRoutes);
    app.use('/api/campaigns', campaign_1.campaignRoutes);
}
exports.registerRoutes = registerRoutes;
