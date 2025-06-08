import express from 'express';
import * as automationController from '../controllers/automationController';

const router = express.Router();

// ทดสอบการเชื่อมต่อ
router.get('/', automationController.testConnection);

// Automation registration flow
router.post('/automation/register', automationController.registerLine);
router.post('/automation/request-otp', automationController.requestOtp);
router.post('/automation/submit-otp', automationController.submitOtp);
router.post('/automation/check-proxy', automationController.checkProxy);
router.post('/automation/status', automationController.receiveStatus);

// Logout สำหรับ LINE app data
router.post('/logout', automationController.logout);

export default router; 