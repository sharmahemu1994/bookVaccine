const requestPromise = require('request-promise');
const notifier = require('node-notifier');

// secret: 

let date = '10-05-2021';
let timer = 15000;
let beneficiariesId = [
]; // add beneficiaries id

let userAuthotisationToken = ``;
 // add authentication bearer token can get


const scheduleVaccine = async (data) => {
	const {capacity, ...data2} = data;
	let dataToSend = {
		"dose": 1,
		"beneficiaries": capacity > 1 ? beneficiariesId : [beneficiariesId[1]],
		"captcha": 'Vfqbv', // tWy2p, RGcxH, r6Pzx
		// "session_id": "b4e8e3aa-e398-4572-8385-09f7ede40c3c",
		// "center_id": 572920,
		// "slot": "05:26PM-05:56PM"
		...data2
	};
	console.log('----dataToSend---', dataToSend);
	return  await requestPromise({
		method: 'POST',
		uri: `https://cdn-api.co-vin.in/api/v2/appointment/schedule`,
		headers: {
			'authorization': userAuthotisationToken
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
}

const dummyRequestData = {
	"session_id": "b4e8e3aa-e398-4572-8385-09f7ede40c3c",
	"center_id": 572920,
	"slot": "05:26PM-05:56PM",
	capacity: 2
};


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
				if (item2.min_age_limit === 18 && item2.available_capacity > 0) {
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
		console.log(err.statusCode);
		return availableCentres;
	});
}

(
	async function check() {
		// try {
		// 	await scheduleVaccine(dummyRequestData);
		// }catch(error){
		// 	console.error("error scheduling dummy request", error);
		// }
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
				process.exit(1)
				check();
			}
		} else {
			setTimeout(() => {
				check();
			}, timer);
		}
	}
)();


// api to get captcha
const getCaptcha = async () =>{
	let availableCentres = [];
	return await requestPromise({
		method: 'GET',
		uri: `https://cdn-api.co-vin.in/api/v2/auth/getRecaptcha`,
		headers: {
			'authorization': userAuthotisationToken
		},
		json: true,
		resolveWithFullResponse: true
	}).then(result => {
		console.log('----availableCentres----', result.body);
	}).catch(err => {
		console.log(err.statusCode);
		return availableCentres;
	});
}
