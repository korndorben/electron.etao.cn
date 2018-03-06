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

async function test(ip, port, msg) {
    let printer = checkprinterstatus(ip, port)
    // console.log('printer.client.WritableState');
    // for (let prop in printer.client) {
    //     if (printer.client.hasOwnProperty(prop)) {
    //         console.log(prop);
    //         console.log(printer.client[prop]);
    //     }
    // }
    // console.log(printer.client._writableState);
    let buffer = []
    buffer.push(Buffer.from([0x1b, 0x40, ])) //初始化
    buffer.push(Buffer.from('----------\n'));
    buffer.push(Buffer.from(`${msg}\n\n\n\n\n`));
    buffer.push(Buffer.from('----------\n'));
    buffer.push(Buffer.from([0x1d, 0x56, 0x00, ])); //切纸
    printer.client.write(Buffer.concat(buffer), 'utf8', function() {
        console.log('打印完毕');
    })
}
async function batchprint(datas, cb) {
    for (let data of datas) {
        let printer = checkprinterstatus(data.ip, data.port)
        for (let i = 0; i < data.repetition; i++) {
            printer.client.write(Buffer.from(data.data, 'base64'), 'utf8', function() {
                cb && cb(data)
            })
        }
    }
}

var checkPort = function(port, host, callback) {
    var socket = new Socket(),
        status = null;
    // Socket connection established, port is open
    socket.on('connect', function() {
        status = 'open';
        socket.end();
    });
    socket.setTimeout(1500); // If no response, assume port is not listening
    socket.on('timeout', function() {
        status = 'closed';
        socket.destroy();
    });
    socket.on('error', function(exception) {
        status = 'closed';
    });
    socket.on('close', function(exception) {
        callback(null, status, host, port);
    });
    socket.connect(port, host);
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

function scan(cb) {
    console.log('重新扫描网络.....');
    console.log(ipaddress());
    for (let localnetwork of ipaddress()) {
        for (let i = 1; i <= 255; i++) {
            let arr = (localnetwork.address || '192.168.0.1').split('.');
            arr[3] = i
            let printer_ipaddress = arr.join('.')
            checkPort(9100, printer_ipaddress, function(error, status, host, port) {
                if ('open' == status) {
                    cb && cb({
                        ip: printer_ipaddress,
                        port: 9100,
                        status: status
                    })
                }
            })
        }
    }
}

module.exports = {
    ipaddress,
    scan,
    batchprint,
    test
};
