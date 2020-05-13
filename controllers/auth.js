const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");

/**
 * @desc Register user
 * @route POST api/v1/auth/register
 * @access Public
 */
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokeResponse(user, 200, res);
});

/**
 * @desc Login user
 * @route POST api/v1/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password", 400));
  }
  // check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid cridentails", 401));
  }
  // check is password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid cridentails", 400));
  }

  sendTokeResponse(user, 200, res);
});

/**
 * @desc Get current loggedin user
 * @route GET api/v1/auth/me
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});
/**
 * @desc Update password
 * @route PUT api/v1/auth/updatepassword
 * @access Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    // check current password
    if(!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('Incorrect password', 401));
    }
    user.password = req.body.newPassword;
    await user.save();

    sendTokeResponse(user, 200, res);
  });
/**
 * @desc Update user details
 * @route PUT api/v1/auth/updateDetails
 * @access Private
 */
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
      success: true,
      data: user,
    });
  });

/**
 * @desc  forgot password
 * @route POST api/v1/auth/forgotpassword
 * @access Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse(`No user with email`, 404));
  }
  // get reset token
  const resetToken = user.getResetPasswordToken();
  

  await user.save({ validateBeforeSave: false });


  // create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to:\n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password reset token`,
      message: message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});
/**
 * @desc Reset password
 * @route PUT api/v1/auth/resetpassword/:resettoken
 * @access Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");
  
  const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
          $gt: Date.now()
      }
  });
 console.log('user: ', user);
 
  if(!user) {
      return next(new ErrorResponse('Invalid token', 400));
  }
  // set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokeResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokeResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const option = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    option.secure = true;
  }

  res.status(statusCode).cookie("token", token, option).json({
    success: true,
    token,
  });
};
