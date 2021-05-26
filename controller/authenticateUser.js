'use strict';

const crypto = require("crypto-js");
const fs = require('fs');
const requestPromise = require("request-promise");
const { SHA256, enc } = crypto;

const bookVaccine = require('./bookVaccine');
const captcha = require('./captcha');
let config = require('../config.json');

const logOut = async () => {
	return await requestPromise({
		method: 'GET',
		uri: `https://cdn-api.co-vin.in/api/v2/auth/logout`,
		headers: {
			'authorization': process.env.AUTH_TOKEN
		},
		json: true,
		resolveWithFullResponse: true
	}).then((result) => {
		return true;
	}).catch((err) => {
		return true;
	});
}


const generateOtp = async (req, res) => {
	console.log("Sending OTP to Mobile", config.API_SECRET);
	await logOut();
	return await requestPromise({
		method: "POST",
		uri: `https://cdn-api.co-vin.in/api/v2/auth/generateMobileOTP`,
		json: true,
		resolveWithFullResponse: true,
		headers: {
			"Origin": "https://selfregistration.cowin.gov.in"
		},
		body: {
			mobile: config.MOBILE_NUMBER,
			secret: config.API_SECRET,
		},
	}).then((result) => {
		console.log("OTP Sent Successfully: ", result.body.txnId);
		res.render('index', { title: 'Express', txnId: result.body.txnId });
	}).catch((err) => {
		console.log("OTP Sent Error: ", err.message);
		res.render('index', { title: 'Express', txnId: '' });
	});
};

const updateAuthToken = async (token, txnId) => {
	console.log("Fetching Auth Token", token, txnId);
	return await requestPromise({
		method: "POST",
		uri: `https://cdn-api.co-vin.in/api/v2/auth/validateMobileOtp`,
		json: true,
		headers: {
			"Origin": "https://selfregistration.cowin.gov.in"
		},
		resolveWithFullResponse: true,
		body: {
			otp: token,
			txnId: txnId,
		},
	}).then((response) => {
		console.log('------response.body.token-----', response.body.token);
		process.env.AUTH_TOKEN = `Bearer ${response.body.token}`;
		return true;
	}).catch((err) => {
		console.log("Fetch Auth Token Error: ", err.message);
		return false;
	});
};

const authenticateOtp = async (req, res) => {
	let otpHashKey = SHA256(req.body.otp).toString(enc.Hex);
	console.log('----otpHashKey----', otpHashKey);
	await updateAuthToken(otpHashKey, req.body.txnId);
	console.log('----------', process.env.AUTH_TOKEN);
	let captchaValue = await captcha.getAndSolveCaptcha();
	let content = JSON.parse(fs.readFileSync('config.json', 'utf8'));
	content.CAPTCHA = captchaValue;
	fs.writeFileSync('config.json', JSON.stringify(content));
	bookVaccine.check();
	res.render('index', { title: 'Express', txnId: req.body.txnId });
}


module.exports = {
	generateOtp,
	authenticateOtp
}