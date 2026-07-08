const express = require('express');
const router = express.Router();
// 1. Destructure the exact function name from your controller
const  authController  = require("../controllers/authController");

// 2. Use it here. Now when you hit /signup, it runs registerUser!
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);

//update:
router.post("/forgetPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.route("/logout").get(authController.logout);

router.route("/me").get(authController.protect, authController.getUserProfile);
router
  .route("/password/update")
  .put(authController.protect, authController.updatePassword);
router
  .route("/me/update")
  .put(authController.protect, authController.updateProfile);

module.exports = router;