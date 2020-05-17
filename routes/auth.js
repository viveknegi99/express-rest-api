const express = require("express");
const { protect } = require("../middleware/auth");
const {
  registerUser,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout
} = require("../controllers/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);
router.put("/resetpassword/:resettoken", resetPassword); 
router.put("/updatedetails", protect, updateDetails);  
router.put("/updatePassword", protect, updatePassword);

module.exports = router;
