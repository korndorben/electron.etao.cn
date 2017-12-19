const net = require('net');
const os = require('os');
const moment = require('moment');
const portscanner = require('portscanner')
let printers = {}
function batchprint(datas, cb) {
	//检查打印机
	for (let data of datas) {
		let printerkey = `${data.ip}:${data.port}`
		if (!printers[printerkey]) {
			let sprinter = Object.create(null)
			sprinter.ip = data.ip
			sprinter.port = data.port
			sprinter.client = net.createConnection(data.port / 1, data.ip)
			sprinter.client.setKeepAlive(true, 1000 * 1)
			sprinter.client.on('timeout', function() {
				console.log('timeout');
			})
			sprinter.client.on('error', function(error) {
				console.log(error);
			})
			printers[printerkey] = sprinter
		}
		if (printers[printerkey]['client'].destroyed) {
			printers[printerkey]['client'] = net.createConnection(data.port / 1, data.ip)
			printers[printerkey]['client'].setKeepAlive(true, 1000 * 1)
		}
	}
	for (let data of datas) {
		let printer = printers[`${data.ip}:${data.port}`].client
		for (let i = 0; i < data.repetition; i++) {
			printer.write(Buffer.from(data.data, 'base64'), 'utf8', function() {
				cb && cb(data) //每打印一份都确认一次
			})
		}
	}
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
	batchprint,
};
