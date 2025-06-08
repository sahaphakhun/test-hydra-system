"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountController = __importStar(require("../controllers/accountController"));
const router = express_1.default.Router();
// การจัดการบัญชี
router.get('/accounts', accountController.getAllAccounts);
router.get('/accounts/:id', accountController.getAccountById);
// การจัดการกลุ่ม และเพื่อน
router.get('/accounts/:accountId/groups', accountController.getGroupsByAccountId);
router.post('/add-friends', accountController.addFriends);
router.post('/create-group', accountController.createGroup);
// ส่งข้อความต้องระบุ accountId, groupId และ message ใน body
router.post('/send-message', accountController.sendMessageToGroup);
// การจัดการชุดเบอร์โทรศัพท์
router.get('/phone-lists', accountController.getPhoneNumberLists);
router.post('/number-sets', accountController.createPhoneNumberList);
router.delete('/phone-lists/:id', accountController.deletePhoneNumberList);
exports.default = router;
