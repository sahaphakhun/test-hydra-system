import express from 'express';
import * as accountController from '../controllers/accountController';

const router = express.Router();

// การจัดการบัญชี LINE
router.get('/accounts', accountController.getAllAccounts);
router.get('/accounts/:id', accountController.getAccountById);

// การจัดการกลุ่ม LINE
router.get('/accounts/:accountId/groups', accountController.getGroupsByAccountId);

// API สำหรับเพิ่มเพื่อน สร้างกลุ่ม และส่งข้อความ
router.post('/automation/add-friends', accountController.addFriends);
router.post('/automation/create-group', accountController.createGroup);
router.post('/automation/send-message', accountController.sendMessageToGroup);

// การจัดการชุดเบอร์โทรศัพท์
router.get('/phone-lists', accountController.getPhoneNumberLists);
router.post('/phone-lists', accountController.createPhoneNumberList);

export default router; 