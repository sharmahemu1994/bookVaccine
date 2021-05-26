const requestPromise = require('request-promise');
const notifier = require('node-notifier');
const moment = require("moment");
let config = require('../config.json');
const captcha = require('./captcha');

let timer = 15000;

// add beneficiaries id
let beneficiariesId = config.BENEFICIARIES_ID;
const districtId = config.DISTRICT_ID;

const scheduleVaccine = async (data, captchaText) => {
	const { capacity, ...data2 } = data;
	let dataToSend = {
		"dose": 1,
		// "beneficiaries": capacity > 1 ? beneficiariesId : [beneficiariesId[0]],
		"beneficiaries": capacity > 1 ? beneficiariesId : [beneficiariesId[0]],
		"captcha": captchaText,
		...data2
	};
	console.log('----dataToSend---', dataToSend);
	return await requestPromise({
		method: 'POST',
		uri: `https://cdn-api.co-vin.in/api/v2/appointment/schedule`,
		headers: {
			'authorization': process.env.AUTH_TOKEN
		},
		json: true,
		resolveWithFullResponse: true,
		body: dataToSend
	}).then(result => {
		console.log('---------', result.body)
		return true
	}).catch(err => {
		console.log('------scheduleVaccine------', err.message);
		return false;
	});
};

let checkAppointment = async () => {
	let date = moment().format('DD-MM-YYYY');
	let availableCentres = [];
	return await requestPromise({
		method: 'GET',
		uri: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${districtId}&date=${date}`,
		headers: {
			'authorization': process.env.AUTH_TOKEN
		},
		json: true,
		resolveWithFullResponse: true
	}).then(result => {
		for (const item of result.body.centers) {
			for (const item2 of item.sessions) {
				if (item2.min_age_limit === 18 && item2.available_capacity_dose1 > 0 && item2.vaccine == "COVAXIN") {
					availableCentres.push({
						session_id: item2.session_id,
						slot: item2.slots[item2.slots.length - 1],
						center_id: item.center_id,
						capacity: item2.available_capacity
					});
					console.log(item.name, item.pincode);
				}
			}
		}
		console.log('----availableCentres----', availableCentres);
		return availableCentres;
	}).catch(err => {
		console.log(err.statusCode, err.message);
		return availableCentres;
	});
}

async function check() {
	let appointsments = await checkAppointment();
	if (appointsments.length > 0) {
		let datatosend = [];
		for (const iterator of appointsments) {
			if (iterator.session_id && iterator.slot) {
				datatosend.push(iterator);
			}
		}
		let captchaToPass;
		if (!config.CAPTCHA) {
			captchaToPass = await captcha.getAndSolveCaptcha();
		} else {
			captchaToPass = config.CAPTCHA;
		}

		let secheduleSuccessful = await scheduleVaccine(datatosend[0], captchaToPass);
		console.log('----secheduleSuccessful---', secheduleSuccessful);
		if (secheduleSuccessful) {
			notifier.notify({
				title: "done",
				message: JSON.stringify(datatosend[0]),
				sound: "SMS"
			});
			process.exit(1)
		} else {
			setTimeout(() => {
				check();
			}, 5000);
		}
	} else {
		setTimeout(() => {
			check();
		}, timer);
	}
}


module.exports = {
	check
}