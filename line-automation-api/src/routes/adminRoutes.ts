import express from 'express';
import * as adminController from '../controllers/adminController';

const router = express.Router();

// จัดการคำขอลงทะเบียน
router.get('/admin/registration-requests', adminController.getAllRegistrationRequests);
router.get('/admin/registration-requests/:id', adminController.getRegistrationRequestById);
router.put('/admin/registration-requests/:id/status', adminController.updateRegistrationRequestStatus);
router.post('/admin/registration-requests/:id/create-account', adminController.createAccountFromRequest);
router.delete('/admin/registration-requests/:id', adminController.deleteRegistrationRequest);

// จัดการงาน (Jobs)
router.get('/admin/jobs', adminController.getAllJobs);
router.put('/admin/jobs/:id/status', adminController.updateJobStatus);

export default router;
