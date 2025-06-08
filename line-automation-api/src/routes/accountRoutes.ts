import express from 'express';
import * as accountController from '../controllers/accountController';

const router = express.Router();

// การจัดการบัญชี
router.get('/accounts', accountController.getAllAccounts);
router.get('/accounts/:id', accountController.getAccountById);

// การจัดการกลุ่ม และเพื่อน
router.get('/accounts/:accountId/groups', accountController.getGroupsByAccountId);
router.post('/add-friends', accountController.addFriends);
router.post('/create-group', accountController.createGroup);
router.delete('/groups/:id', accountController.deleteGroup);
// ส่งข้อความต้องระบุ accountId, groupId และ message ใน body
router.post('/send-message', accountController.sendMessageToGroup);

// การจัดการชุดเบอร์โทรศัพท์
router.get('/phone-lists', accountController.getPhoneNumberLists);
router.post('/number-sets', accountController.createPhoneNumberList);
router.delete('/phone-lists/:id', accountController.deletePhoneNumberList);

// การจัดการงาน (Jobs)
router.get('/jobs', accountController.getJobs);
router.get('/jobs/:id', accountController.getJobById);
router.put('/jobs/:id/status', accountController.updateJobStatus);

export default router; 
