const express = require('express');
const authController = require('../controllers/adminAuthController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp);

// Protect all routes after this middleware
router.use(authController.protect);

router.get('/me', authController.getMe);
router.get('/users', adminController.getCombinedUsers);
router.get('/export-users', adminController.exportUsersToCSV);
router.get('/export-csv', adminController.exportMasterCSV);

router.patch('/users/:gigId/status', adminController.updateUserStatus);

router.route('/users/:uniqueId')
  .patch(adminController.updateUser)
  .delete(adminController.deleteUser);

module.exports = router;
