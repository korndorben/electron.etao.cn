import {
    app,
    BrowserWindow,
    ipcMain,
    globalShortcut
} from 'electron';
import request from 'request'
import { batchprint, } from './printer'
ipcMain.on('printdata', async (event, args) => { //直接推送的可打印的数据
    batchprint(args.printdata, function(data) {
        console.log('打印完毕')
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
    mainWindow.loadURL(`http://moon.asqy.net`);

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
    //
    // globalShortcut.register('CommandOrControl+Left', () => {
    //     console.log('CommandOrControl+Left');
    //     mainWindow.webContents.canGoBack() && mainWindow.webContents.goBack()
    // })
    // globalShortcut.register('CommandOrControl+Right', () => {
    //     console.log('CommandOrControl+Right');
    //     mainWindow.webContents.canGoForward() && mainWindow.webContents.canGoForward()
    // })
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
    // globalShortcut.unregister('CommandOrControl+Left')
    // globalShortcut.unregister('CommandOrControl+Right')

    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.