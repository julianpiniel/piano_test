const fs = require('fs');
const csv = require('fast-csv');
const axios = require('axios');
const { on } = require('events');
require('dotenv').config();

// Set of variables for the procedure
const file1 = 'A.csv',
	file2 = 'B.csv';
const AID = process.env.AID,
	API_TOKEN = process.env.API_TOKEN;
const URL = `https://sandbox.piano.io/api/v3/publisher/user/list?api_token=${API_TOKEN}&aid=${AID}`;
const usersA = [],
	usersB = [];
let apiUsers = [];
let apiEmails = [];

// Declare each async process as a promise

const requestPromise = new Promise((resolve) => {
	axios.get(URL).then((request) => {
		apiUsers = request.data.users;
		apiEmails = request.data.users.map((user) => user.email);
		console.log('USERS', apiUsers.length, typeof apiUsers);
		resolve();
	});
});

const file1Promise = new Promise((resolve) => {
	csv.parseFile(file1, { headers: true })
		.on('data', (data) => {
			const user = {
				user_id: data.user_id,
				email: data.email,
			};
			usersA.push(user);
		})
		.on('end', () => {
			console.log('finish A');
			resolve();
		});
});

const file2Promise = new Promise((resolve) => {
	csv.parseFile(file2, { headers: true })
		.on('data', (data) => {
			const user = {
				user_id: data.user_id,
				first_name: data.first_name,
				last_name: data.last_name,
			};
			usersB.push(user);
		})
		.on('end', () => {
			console.log('finish B');
			resolve();
		});
});

//Resolve all async processes concurrently
Promise.all([file1Promise, file2Promise, requestPromise]).then(() => {
	usersB.forEach((user) => {
		let index = usersA.findIndex((userA) => userA.user_id === user.user_id);
		usersA[index].first_name = user.first_name;
		usersA[index].last_name = user.last_name;
	});

	// Filter users if repeated in API
	usersA.forEach((user) => {
		let index = apiUsers.findIndex(
			(apiUser) => apiUser.email === user.email
		);
		if (index !== -1) {
			let correctId = apiUsers[index].uid;
			user.user_id = correctId;
		}
	});
	console.table(usersA);

	// Write the output file

	const csvStream = csv.format({
		headers: true,
	});
	const writableStream = fs.createWriteStream('C.csv');
	writableStream.on('finish', () => {
		console.log('DONE');
	});

	csvStream.pipe(writableStream);
	usersA.forEach((data) => csvStream.write(data));
	csvStream.end();
});
