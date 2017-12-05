const net = require('net');
const os = require('os');
const moment = require('moment');
const portscanner = require('portscanner')
function print({
	ip,
	port = 9100,
	data = {},
	repetition = 1,
}) {
	const client = net.createConnection(port / 1, ip, function() {})
	client.on('connect', function() {
		console.log('connected');
		for (let i = 0; i < repetition; i++) {
			client.write(Buffer.from(data, 'base64'))
		}
		client.end();
	})
	client.on('error', function(err) {
		console.log(err);
	})
	client.on('data', function() {})
	client.on('end', function() {})
	client.on('close', function() {})
}
function scan(cb) {
	let localnetworks = ipaddress()
	for (let localnetwork of localnetworks) {
		for (let i = 1; i <= 255; i++) {
			let arr = (localnetwork.address || '192.168.0.1').split('.');
			arr[3] = i
			let printer_ipaddress = arr.join('.')
			portscanner.checkPortStatus(9100, printer_ipaddress, function(error, status) {
				if ('open' == status) {
					cb && cb({ip: printer_ipaddress, port: 9100, status: status})
				}
			})
		}
	}
}
function ipaddress() {
	var networkInterfaces = os.networkInterfaces();
	let ipaddresses = []
	for (let prop of Object.keys(networkInterfaces)) {
		for (let ipaddress of networkInterfaces[prop]) {
			if (ipaddress.internal || ipaddress.family.toUpperCase() == 'IPV6') {
				continue
			}
			ipaddresses.push(ipaddress)
		}
	}
	return ipaddresses
};
module.exports = {
	ipaddress,
	scan,
	print
};
