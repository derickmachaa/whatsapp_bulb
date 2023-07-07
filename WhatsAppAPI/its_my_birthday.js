// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require('venom-bot');
const https = require('http');
const noemoji = require('./rm-emoji');
const offensive = require('./offensive');
const fs = require('fs');
const contacts = require("./contacts.json");
//require some child process to do adb
const { exec } = require("child_process");

let user = JSON.parse(fs.readFileSync('users.json'));

function randstr(length) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}


function Capture(output) {

}

function Toggle(state) {
}

venom
	.create({
		session: 'automated' //name of session
	})
	.then((client) => start(client))
	.catch((erro) => {
		console.log(erro);
	});
async function start(client) {
	await client.onMessage((message) => {
		var msg = noemoji(message.body.toLowerCase());
		var sender = message.from;
		var no = sender.split('@')[0];


		if (message.isGroupMsg === false && !offensive(msg) && message.broadcast === false && message.from != "status@broadcast") {
			//log some stuff
			talkedto = user.hasOwnProperty(sender);
			if (!talkedto) {
				user[sender] = {
					"turnon_count": 0,
					"turnoff_count": 0,
					"paid": false
				}
				fs.writeFileSync('users.json', JSON.stringify(user));
			}
			//check the intenstions of the sender and evaluate what the user is planning on doing
			const postdata = JSON.stringify({ message: noemoji(message.body.toLowerCase()) });
			const options = {
				socketPath: "/tmp/app.sock",
				path: '/respond',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': postdata.length
				}
			};

			const req = https.request(options, res => {

				let data = '';
				res.on('data', chunk => {
					data += chunk;
				})
				res.on('end', () => {
					var resp = JSON.parse(data);

					if (resp.response.length > 1) {
						//know intension
						var intension = resp.intension;
						if (intension === "turn_on" && user[sender].turnon_count < 10) {
							filename = "/tmp/" + randstr(5) + ".jpg";
							//tell the user what we are doing
							response = resp.response;
							client.startTyping(sender);
							client.reply(sender, response, message.id.toString()).then((result) => {
								console.log('Result: ', result.status); //return object success
							}).catch((erro) => {
								console.error('Error when sending: ', erro); //return object error 
							});

							//turn on the bulb
							https.get(`http://192.168.8.153/gpio/1`, (resp) => {
								let data = '';
								// A chunk of data has been received.
								resp.on('data', (chunk) => { data += chunk; });
								resp.on('end', () => {
									let imageUrl = `http://192.168.8.149/capture?_cb=${Date.now()}`;
									let imageName = filename;

									const file = fs.createWriteStream(imageName);

									https.get(imageUrl, response => {
										response.pipe(file);

										file.on('finish', () => {
											file.close();
											console.log(`Image downloaded as ${imageName}`);
											client.sendImage(sender, filename, `IMG0001.jpg`, "bulb on")
												.then((result) => {
													user[sender].turnon_count += 1;
													fs.writeFileSync('users.json', JSON.stringify(user));

													console.log('Result: ', result.status); //return object succes
												})
												.catch((erro) => {
													console.error('Error when sending: ', erro); //return object error
												});
										});
									}).on('error', err => {
										fs.unlink(imageName);
										console.error(`Error downloading image: ${err.message}`);
									});

								});
							}).on("error", (err) => {
								console.log("Error: " + err.message);
							});
						} else if (intension === "turn_on" && user[sender].turnon_count > 9) {
							//just chat along with user
							response = "You have exhausted your turn ON attempts you are not allowed to turn on the electrical device";
							client.startTyping(sender);
							client.reply(sender, response, message.id.toString()).then((result) => {
								console.log('Result: ', result.status); //return object success
							}).catch((erro) => {
								console.error('Error when sending: ', erro); //return object error
							});
						}

					} if (intension === "turn_off" && user[sender].turnoff_count < 10) {
						filename = "/tmp/" + randstr(5) + ".jpg";
						//tell the user what we are doing
						response = resp.response;
						client.startTyping(sender);
						client.reply(sender, response, message.id.toString()).then((result) => {
							console.log('Result: ', result.status); //return object success
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error 
						});

						//turn on the bulb
						https.get(`http://192.168.8.153/gpio/0`, (resp) => {
							let data = '';
							// A chunk of data has been received.
							resp.on('data', (chunk) => { data += chunk; });
							resp.on('end', () => {
								let imageUrl = `http://192.168.8.149/capture?_cb=${Date.now()}`;
								let imageName = filename;

								const file = fs.createWriteStream(imageName);

								https.get(imageUrl, response => {
									response.pipe(file);

									file.on('finish', () => {
										file.close();
										console.log(`Image downloaded as ${imageName}`);
										client.sendImage(sender, filename, `IMG0001.jpg`, "bulb off")
											.then((result) => {
												user[sender].turnoff_count += 1;
												fs.writeFileSync('users.json', JSON.stringify(user));

												console.log('Result: ', result.status); //return object succes
											})
											.catch((erro) => {
												console.error('Error when sending: ', erro); //return object error
											});
									}); 
								}).on('error', err => {
									fs.unlink(imageName);
									console.error(`Error downloading image: ${err.message}`);
								});

							});
						}).on("error", (err) => {
							console.log("Error: " + err.message);
						});

					} else if (intension === "turn_off" && user[sender].turnoff_count > 9) {
						response = "You have exhausted your turn OFF attempts you are not allowed to turn OFF the electrical device";
						client.startTyping(sender);
						client.reply(sender, response, message.id.toString()).then((result) => {
							console.log('Result: ', result.status); //return object success
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
						});
					}
					else if (intension === "pay") {
						var amount=50;
						if (user[sender].turnoff_count > 0 && user[sender].turnon_count > 0 && !user[sender].paid && contacts.phonenumber.includes(no)) {
							response = resp.response;
							//pay here
							user[sender].paid = true;
							var numb = "0"+no.substring(3,);
							if(msg.includes("double")){
								cmd=`adb shell am start -a android.intent.action.CALL -d tel:"*140*${amount*2}*${numb}%23"`
							}else if(msg.includes("tripple")){
								cmd=`adb shell am start -a android.intent.action.CALL -d tel:"*140*${amount*3}*${numb}%23"`
							}else{
								cmd=`adb shell am start -a android.intent.action.CALL -d tel:"*140*${amount}*${numb}%23"`
							}
							exec(cmd, (error, stdout, stderr) => {
								if (error) {
									console.log(`error: ${error.message}`);
									return;
								}
								if (stderr) {
									console.log(`stderr: ${stderr}`);
									return;
								}
								console.log(`stdout: ${stdout}`);
							});
							console.log("can pay");
						}
						else if (intension === "pay" && user[sender].paid) {
							//just chat along with user
							response = "sorry, I have already paid you";
						} else if (intension === "pay" && !contacts.phonenumber.includes(no)) {
							response = "Thank you for participating, however, I am only allowed to send to Derick's Contacts"
						}
						else {
							response = "Make sure you have successfully turned on and off before requesting for a pay";
						}
						client.startTyping(sender);
						client.reply(sender, response, message.id.toString()).then((result) => {
							console.log('Result: ', result.status); //return object success
						}).catch((erro) => {
							console.error('Error when sending: ', erro); //return object error
						});
						fs.writeFileSync('users.json', JSON.stringify(user));

					}
					else
						if (intension != "turn_on" && intension != "turn_off" && intension != "pay" && intension) {
							response = resp.response;
							client.startTyping(sender);
							client.reply(sender, response, message.id.toString()).then((result) => {
								console.log('Result: ', result.status); //return object success
							}).catch((erro) => {
								console.error('Error when sending: ', erro); //return object error
							});
						}
				})
			})
			req.write(postdata);
			req.end();
		}
	});
}
