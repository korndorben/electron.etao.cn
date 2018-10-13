var net = require('net'),
    Socket = net.Socket;
const os = require('os');
const moment = require('moment');

let printers = {}

function checkprinterstatus(ip, port) {
    let printerkey = `${ip}:${port}`
    if (!printers[printerkey] || !printers[printerkey]['client'] || printers[printerkey]['client'].destroyed) {
        let sprinter = Object.create(null)
        sprinter.ip = ip
        sprinter.port = port
        sprinter.client = net.createConnection(port / 1, ip)
        sprinter.client.setKeepAlive(true, 1000 * 1)
        sprinter.client.setTimeout(1000 * 60)
        sprinter.client.on('close', function(had_error) {
            console.log('had_error');
            console.log(had_error);
            console.log('打印机连接已关闭close');
        })
        sprinter.client.on('connect', function() {
            console.log('打印机连接成功connect');
        })
        sprinter.client.on('data', (data) => {
            console.log('接收到打印数据');
            console.log(data.toString());
        });
        sprinter.client.on('drain', function() {
            console.log('打印机休息中drain...请打扰');
        })
        sprinter.client.on('end', function() {
            console.log('打印机连接已关闭end');
        })
        sprinter.client.on('error', function(error) {
            console.log('打印机连接异常error');
            console.log(error);
            sprinter.client.end()
        })
        sprinter.client.on('lookup', function(err, address, family, host) {
            console.log('loopup事件');
            console.log(address);
            console.log(family);
            console.log(host);
        })
        sprinter.client.on('timeout', function() {
            console.log('打印机连接超时timeout');
            sprinter.client.end()
        })

        printers[printerkey] = sprinter
        return printers[printerkey]
    }
    return printers[printerkey]
}

async function batchprint(datas, cb) {
    for (let data of datas || []) {
        let printer = checkprinterstatus(data.ip, data.port)
        for (let i = 0; i < data.repetition; i++) {
            printer.client.write(Buffer.from(data.data, 'base64'), 'utf8', function() {
                cb && cb(data)
            })
        }
    }
}

module.exports = {
    batchprint,
};