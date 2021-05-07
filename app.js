const requestPromise = require('request-promise');
const notifier = require('node-notifier');

let date = '07-05-2021'; // current date
let timer = 15000;
let beneficiariesId = []; // beneficiaries_reference ids for whome you want to book the vaccine appointment
let userAuthotisationToken = ``; // pass bearer token you ca get from the browser

const scheduleVaccine = async (data) => {
	let dataToSend = {
		"dose": 1,
		"beneficiaries": beneficiariesId,
		...data
	};
	console.log('----dataToSend---', dataToSend);
	return await requestPromise({
		method: 'POST',
		uri: `https://cdn-api.co-vin.in/api/v2/appointment/beneficiaries`,
		headers: {
			'authorization': userAuthotisationToken
		},
		json: true,
		resolveWithFullResponse: true,
		body: dataToSend
	}).then(result => {
		console.log('----dsadsadsadas-----', result.body)
		return true
	}).catch(err => {
		console.log('------scheduleVaccine------', err.message);
		console.log('------scheduleVaccine------', err);
		return false;
	});
}

let checkAppointment = async () => {
	let availableCentres = [];
	return await requestPromise({
		method: 'GET',
		uri: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=294&date=${date}`,
		headers: {
			'authorization': userAuthotisationToken
		},
		json: true,
		resolveWithFullResponse: true
	}).then(result => {
		for (const item of result.body.centers) {
			for (const item2 of item.sessions) {
				if (item2.min_age_limit === 18 && item2.available_capacity > 0 && item2.vaccine == 'COVISHIELD') {
					availableCentres.push({
						session_id: item2.session_id,
						slot: item2.slots[item2.slots.length - 1]
					})
					console.log(item.name, item.pincode);
				}
			}
		}
		console.log('----availableCentres----', availableCentres);
		return availableCentres;

	}).catch(err => {
		console.log(err.statusCode);
		return availableCentres;
	});
}

(
	async function check() {
		let appointsments = await checkAppointment();
		if (appointsments.length > 0) {
			let datatosend = [];
			for (const iterator of appointsments) {
				if (iterator.session_id && iterator.slot) {
					datatosend.push(iterator);
				}
			}
			let secheduleSuccessful = await scheduleVaccine(datatosend[0]);
			console.log('----secheduleSuccessful---', secheduleSuccessful);
			if (secheduleSuccessful) {
				notifier.notify({
					title: done,
					message: JSON.stringify(datatosend[0]),
					sound: "SMS"
				});
				process.exit(1)
			} else {
				setTimeout(() => {
					check();
				}, timer);
			}
		} else {
			setTimeout(() => {
				check();
			}, timer);
		}
	}
)();
