import {
    app,
    BrowserWindow,
    ipcMain,
    globalShortcut
} from 'electron';
import request from 'request'
import {
    ipaddress,
    scan,
    batchprint
} from './printer'
let printdataqueue = {}
ipcMain.on('printdata', async (event, args) => { //直接推送的可打印的数据
    console.log('args');
    console.log(args);
    if (!args.printdata || args.printdata.length <= 0) {
        return
    }
    for (let p of args.printdata) {
        if (!printdataqueue[p.orderid]) {
            printdataqueue[p.orderid] = p
        }
    }
    batchprint(args.printdata.filter(x => x.printedtimes <= 0), function(data) {
        printdataqueue[data.orderid].printedtimes * 1 + 1
        request({
            url: args.config.url,
            method: 'POST',
            headers: args.config.headers,
            json: Object.assign(args.cbdata, {
                variables: {
                    p: {
                        id: data.id,
                        printedtimes: data.printedtimes * 1 + 1
                    }
                }
            })
        }, function(error1, response1, body1) {
            console.log(body1);
        })
    })
})
ipcMain.on('edupdatemealorder', async (event, args) => {
    console.log(args);
    request({ //1.请求需要打印的数据
        url: args.config.url,
        method: 'POST',
        headers: args.config.headers,
        json: args.data
    }, function(error, response, body) {
        if (body.data.printdata.length <= 0) {
            return false
        }
        for (let p of body.data.printdata) {
            if (!printdataqueue[p.orderid]) {
                printdataqueue[p.orderid] = p
            }
        }
        batchprint(body.data.printdata.filter(x => x.printedtimes <= 0), function(data) {
            printdataqueue[data.orderid].printedtimes * 1 + 1
            request({
                url: args.config.url,
                method: 'POST',
                headers: args.config.headers,
                json: Object.assign(args.cbdata, {
                    variables: {
                        p: {
                            id: data.id,
                            printedtimes: data.printedtimes * 1 + 1
                        }
                    }
                })
            }, function(error1, response1, body1) {
                console.log(body1);
            })
        })
    })
})
ipcMain.on('printer.init', (event, args) => {
    scan(function(result) {
        mainWindow.webContents.send('printer.init', result)
    })
})
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const createWindow = async () => {
    // Create the browser window.
    var windowOptions = {
        width: 1366,
        minWidth: 1024,
        height: 768,
        title: app.getName()
    }
    mainWindow = new BrowserWindow(windowOptions);
    // and load the index.html of the app.
    mainWindow.loadURL(`http://nbw.b.etao.cn`);

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);
app.on('ready', async function() {
    await createWindow()
    //注册快捷键
    let ret = globalShortcut.register('CommandOrControl+K', async () => {
        console.log('CommandOrControl+K');
        mainWindow.toggleDevTools()
    })

    globalShortcut.register('CommandOrControl+Left', () => {
        console.log('CommandOrControl+Left');
        mainWindow.webContents.canGoBack() && mainWindow.webContents.goBack()
    })
    globalShortcut.register('CommandOrControl+Right', () => {
        console.log('CommandOrControl+Right');
        mainWindow.webContents.canGoForward() && mainWindow.webContents.canGoForward()
    })
});
// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
app.on('will-quit', () => {
    // Unregister a shortcut.
    globalShortcut.unregister('CommandOrControl+K')
    globalShortcut.unregister('CommandOrControl+Left')
    globalShortcut.unregister('CommandOrControl+Right')

    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
