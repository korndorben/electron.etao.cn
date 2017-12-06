const net = require('net');
const os = require('os');
const moment = require('moment');
const portscanner = require('portscanner')
function batchprint(datas) {
	let printers = {}
	for (let data of datas) {
		if (printers[data.ip]) {
			printers[data.ip].push(data)
		} else {
			printers[data.ip] = [data]
		}
	}
	console.log(printers);
	for (let key of Object.keys(printers)) {
		let printer = printers[key][0]
		console.log(printer);
		let client = net.createConnection(printer.port / 1, printer.ip, function() {})
		client.on('connect', function() {
			console.log('connected');
			for (let data of printers[key]) {
				for (let i = 0; i < data.repetition; i++) {
					client.write(Buffer.from(data.data, 'base64'))
				}
			}
			client.end();
		})
	}
}
//打印
function print({
	ip,
	port = 9100,
	data = {},
	repetition = 1
}) {
	let client = net.createConnection(port / 1, ip, function() {})
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
					cb && cb({ip: printer_ipaddress, port: 9100, status: status,})
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
	print,
	batchprint
};
