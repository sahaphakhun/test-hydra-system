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
router.post('/send-message', accountController.sendMessageToGroup);

// การจัดการชุดเบอร์โทรศัพท์
router.get('/phone-lists', accountController.getPhoneNumberLists);
router.post('/number-sets', accountController.createPhoneNumberList);

export default router; 