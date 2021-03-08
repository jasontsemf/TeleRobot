const {
  app,
  BrowserWindow
} = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');

const express = require('express');
const e = express();

const SerialPort = require('serialport');
let port;
let aPorts = [];

let localhostPort = 8081;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}
let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipc.on('scan', (event, arg) => {
  console.log("on scan in server");
  console.log(aPorts);
  scanPort(event);
});

ipc.on('connect', (event, arg) => {
  console.log("on connect in server");
  // console.log(arg);
  port = new SerialPort(arg);
  event.reply('portConnected', true);
});

ipc.on('sendCmd', (event, arg) => {
  console.log("the arg: ", arg);
  if (port) {
    port.write(arg, function (err) {
      if (err) {
        return console.log('Error on write: ', err.message)
      }
      console.log('message written', arg);
    });
  }
});

ipc.on('penUp', (event, arg) => {
  if (port) {
    let cmd = "SP,0\r";
    mainWindow.webContents.send('cmdWrite', cmd);
    port.write(cmd, function (err) {
      if (err) {
        return console.log('Error on write: ', err.message)
      }
      console.log('message written', cmd);
    });
  }
});

ipc.on('penDown', (event, arg) => {
  if (port) {
    let cmd = "SP,1\r";
    mainWindow.webContents.send('cmdWrite', cmd);
    port.write(cmd, function (err) {
      if (err) {
        return console.log('Error on write: ', err.message)
      }
      console.log('message written', cmd);
    });
  }
});

//XM,1000,1000,1000

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// actual API calls
e.get("/move/:sxy", async (req, res) => {
  let temp = req.params.sxy.split(',');
  console.log(temp);
  s = temp[0];
  x = temp[1];
  y = temp[2];
  if (port) {
    let cmd = `XM,${s},${x},${y}\r`;
    mainWindow.webContents.send('cmdWrite', cmd);
    port.write(cmd, function (err) {
      if (err) {
        return console.log('Error on write: ', err.message)
      }
      console.log('message written', s, x, y);
    });
  }
  res.send("OK");
});

e.get("/down", async (req, res) => {
  if (port) {
    let cmd = "SP,1\r";
    mainWindow.webContents.send('cmdWrite', cmd);
    port.write(cmd, function (err) {
      if (err) {
        return console.log('Error on write: ', err.message)
      }
      console.log('message written', cmd);
    });
  }
  res.send("OK");
});

e.get("/up", async (req, res) => {
  if (port) {
    let cmd = "SP,0\r";
    mainWindow.webContents.send('cmdWrite', cmd);
    port.write(cmd, function (err) {
      if (err) {
        return console.log('Error on write: ', err.message)
      }
      console.log('message written', cmd);
    });
  }
  res.send("OK");
});

e.listen(localhostPort, () => {
  console.log(`Server listening at http://localhost:${localhostPort}!`);

});


scanPort = (e)=>{
  SerialPort.list().then(function (ports) {
    // console.log(ports);
    aPorts = [];
    ports.forEach(port => {
      if (port.path.includes("usb")) {
        aPorts.push(port.path);
      }
    });
    e.reply('aPorts', aPorts);
    console.log(aPorts, "in the function");
  }).catch(function (error) {
    console.log(error);
  });
}
