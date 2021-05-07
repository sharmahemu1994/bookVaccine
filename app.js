const requestPromise = require('request-promise');
const notifier = require('node-notifier');

let date = '07-05-2021';
let timer = 15000;
let beneficiariesId = [
	'31385917350530', // tanya
	'73837591305550' // joohi
]
let userAuthotisationToken = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiIxY2IzMThmNC1kNDY4LTQ0OWEtYTYyNS1jODg4NDZiZWI2YWIiLCJ1c2VyX2lkIjoiMWNiMzE4ZjQtZDQ2OC00NDlhLWE2MjUtYzg4ODQ2YmViNmFiIiwidXNlcl90eXBlIjoiQkVORUZJQ0lBUlkiLCJtb2JpbGVfbnVtYmVyIjo5OTAwMzA1Mzk4LCJiZW5lZmljaWFyeV9yZWZlcmVuY2VfaWQiOjg2NDIzNDM0NDQ2NjkwLCJzZWNyZXRfa2V5IjoiYjVjYWIxNjctNzk3Ny00ZGYxLTgwMjctYTYzYWExNDRmMDRlIiwidWEiOiJNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTAuMC40NDMwLjkzIFNhZmFyaS81MzcuMzYgRWRnLzkwLjAuODE4LjUxIiwiZGF0ZV9tb2RpZmllZCI6IjIwMjEtMDUtMDdUMTY6MDQ6NTMuNTQxWiIsImlhdCI6MTYyMDQwMzQ5MywiZXhwIjoxNjIwNDA0MzkzfQ.Ld1zPonLNfLXGNDnj0LVyS8VPA8tE_bbcC2d0imJMq4`;
// let userAgent = `Mozilla/5.0`;

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
