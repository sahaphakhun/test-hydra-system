// @ts-nocheck
import express from 'express';
import * as automationController from '../controllers/automationController';

const router = express.Router();

// ตรวจสอบการเชื่อมต่อกับ API
router.get('/', automationController.testConnection);

// API สำหรับ LINE Automation
router.post('/automation/register', automationController.registerLine);
router.post('/automation/submit-otp', automationController.submitOtp);
router.post('/automation/check-proxy', automationController.checkProxy);
router.post('/automation/status', automationController.receiveStatus);
router.post('/logout', automationController.logout);

export default router; 