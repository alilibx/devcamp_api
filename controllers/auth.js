/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendemail');
const User = require('../models/User');

// @desc     Register User
// @route    POST /api/v1/auth/register
// @access   Public
// eslint-disable-next-line no-unused-vars
exports.register = asyncHandler(async (req, res, next) => {
	const { name, email, password, role } = req.body;

	//Create User
	const user = await User.create({
		name,
		email,
		password,
		role,
	});

	sendTokenResponse(user, 200, res);
});

// @desc     Login User
// @route    POST /api/v1/auth/login
// @access   Public
exports.login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body;

	//Validate email and Password
	if (!email || !password) {
		return next(new ErrorResponse('Please provide an email and password', 400));
	}

	//Check for User
	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		return next(
			new ErrorResponse('The credentials provided are invalid!', 401)
		);
	}

	//Check if password matches
	const isMatch = await user.matchPassword(password);
	if (!isMatch) {
		return next(
			new ErrorResponse('The credentials provided are invalid!', 401)
		);
	}

	sendTokenResponse(user, 200, res);
});

// @desc     Loguser out /clear cookie
// @route    GET /api/v1/auth/logout
// @access   Private
exports.logout = asyncHandler(async (req, res, next) => {
	res.cookie('token', 'none', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	res.status(200).json({ success: true, data: {} });
});

// @desc     Get Current logged in User
// @route    POST /api/v1/auth/me
// @access   Private
exports.getMe = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id);
	res.status(200).json({ success: true, data: user });
});

// @desc     Update User details
// @route    PUT /api/v1/auth/updatedetails
// @access   Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
	const fieldsToUpdate = {
		name: req.body.name,
		email: req.body.email,
	};

	const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
		new: true,
		runValidators: true,
	});
	res.status(200).json({ success: true, data: user });
});

// @desc     Update Password
// @route    PUT /api/v1/auth/updatepassword
// @access   Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('+password');

	//Check Current Password
	if (!(await user.matchPassword(req.body.currentPassword))) {
		return next(new ErrorResponse('Current Password is incorrect!', 401));
	}

	user.password = req.body.newPassword;
	await user.save();

	sendTokenResponse(user, 200, res);
});

// @desc     Forgot Password
// @route    POST /api/v1/auth/forgotpassword
// @access   Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		next(new ErrorResponse('There is no user with the email provided', 404));
	}

	//Get Reset Token
	const resetToken = user.getResetPasswordToken();

	await user.save({ validateBeforeSave: false });

	//Create reset URL
	const resetURL = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/auth/resetpassword/${resetToken}`;

	const message = `You are receiving this email because you (or someone else) has requested the rest
  of a password. Please make a PUT request to :\n\n ${resetURL} `;

	try {
		await sendEmail({
			email: req.body.email,
			subject: 'DevCamper: Forgot Password',
			message,
		});
		res.status(200).json({ success: true, data: 'Email Sent Successfully' });
	} catch (err) {
		console.log(err);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;
		await user.save({ validateBeforeSave: false });
		return next(new ErrorResponse('Email could not be sent', 500));
	}

	//res.status(200).json({ success: true, data: user });
});

// @desc     Reset Password
// @route    POST /api/v1/auth/resetpassword/:resettoken
// @access   Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
	//Get Hashed token
	const resetPasswordToken = crypto
		.createHash('sha256')
		.update(req.params.resettoken)
		.digest('hex');

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() },
	});

	if (!user) {
		return next(new ErrorResponse('Invalid Token', 400));
	}

	//Set the new Password
	user.password = req.body.password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;

	await user.save();

	sendTokenResponse(user, 200, res);
});

//Get Login Token from model and Create cookie and send respose
const sendTokenResponse = (user, statusCode, res) => {
	//Create Token
	const token = user.getSignedJwtToken();

	const options = {
		expires: new Date(
			// eslint-disable-next-line no-undef
			Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') {
		options.secure = true;
	}

	res
		.status(statusCode)
		.cookie('token', token, options)
		.json({ success: true, token });
};
