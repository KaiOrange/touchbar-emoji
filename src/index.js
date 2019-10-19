const electron = require('electron');
const { app, BrowserWindow, TouchBar, ipcMain } = electron;
const { TouchBarSpacer, TouchBarScrubber, TouchBarButton, TouchBarSegmentedControl, TouchBarGroup
} = TouchBar;
const EMOJIS = require('./lib/emojis.json');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let controlWindow;
const isDev = process.env.NODE_ENV === "development";
let touchBarSelectIndex = 0;
let controlWidth = 383;
let minLeft = -controlWidth + 6;
let maxLeft = 0;

let touchBarScrubber = new TouchBarScrubber({
  items: EMOJIS[touchBarSelectIndex].emojis.map(item=>{
    return {label:item};
  }),
  selectedStyle: 'background',
  overlayStyle: 'null',
  showArrowButtons:true,
  mode:'free',
  continuous:false,
  highlight:(highlightedIndex)=>{
    if (mainWindow) {
      mainWindow.webContents.send('play-emoji', EMOJIS[touchBarSelectIndex].emojis[highlightedIndex])
    }
  }
})

function touchBarSegmentedControlChange(selectedIndex,isInPage){
  touchBarSelectIndex = selectedIndex;
  touchBarSegmentedControl.selectedIndex = touchBarSelectIndex
  touchBarScrubber.items = EMOJIS[touchBarSelectIndex].emojis.map(item=>{
    return {label:item};
  })
  if(!isInPage && controlWindow){
    controlWindow.webContents.send('tab-selected', selectedIndex+1)
  }
}

const touchBarSegmentedControl = new TouchBarSegmentedControl({
  segments:EMOJIS.map(item=>{
    return {label:item.title};
  }),
  segmentStyle:'rounded',
  mode: 'single',// single multiple buttons
  selectedIndex : touchBarSelectIndex,
  change: function (selectedIndex){
    touchBarSegmentedControlChange(selectedIndex,false)
  }
});

const touchBar = new TouchBar({
  items: [
    touchBarSegmentedControl,
    new TouchBarSpacer({ size: 'small' }),
    touchBarScrubber
  ],
  escapeItem: new TouchBarButton({
    label: '退出',
    backgroundColor: '#ff9800',
    click: () => {
      app && app.quit();
    }
  })
})

ipcMain.on('touchbar-segmented-control-selected', (event, arg) => {
  touchBarSegmentedControlChange(arg,true)
})

ipcMain.on('app-quit', (event, arg) => {
  app && app.quit();
})

ipcMain.on('set-ignore-mouse-events', (event, arg) => {
  mainWindow && mainWindow.setIgnoreMouseEvents(arg);
})

ipcMain.on('play-emoji', (event, arg) => {
  mainWindow.webContents.send('play-emoji', arg);
})

ipcMain.on('persistent-float', (event, arg) => {
  mainWindow.webContents.send('persistent-float', arg);
})

ipcMain.on('random-float', (event, arg) => {
  mainWindow.webContents.send('random-float', arg);
})

if (!isDev) {
  ipcMain.on('control-slide', (event, isLeft) => {
    controlWindow.setBounds({ x: isLeft ? minLeft : maxLeft,width: controlWidth, },true)
  })
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    fullscreen: true,
    fullscreenable:true,
    simpleFullscreen:true, 
    transparent: true, 
    frame: false,
    resizable:false,
    alwaysOnTop:true,
    icon: path.join(__dirname,'lib','emoji-logo.png'),
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.setVisibleOnAllWorkspaces(true);

  controlWindow = new BrowserWindow({
    width: controlWidth,
    x: maxLeft,
    y: 120,
    frame: false,
    minWidth: controlWidth,
    maxWidth: controlWidth,
    useContentSize: true,
    transparent: true, 
    resizable: false,
    alwaysOnTop: true,
    parent: mainWindow,
    maximizable: false,
    icon: path.join(__dirname,'lib','emoji-logo.png'),
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  const { height } = electron.screen.getPrimaryDisplay().workAreaSize;
  let controlWindowY = (height - controlWindow.getSize()[1]) / 2
  controlWindow.setBounds({ y: controlWindowY,width: controlWidth },false)
  controlWindow.focus();
  controlWindow.loadURL(`file://${__dirname}/control.html`);
  controlWindow.setTouchBar(touchBar);
  controlWindow.setVisibleOnAllWorkspaces(true);
  if (isDev) {
    controlWindow.webContents.openDevTools();
  } else {
    // 移动到最右边
    setTimeout(()=>{
      controlWindow.setBounds({ x: minLeft,width: controlWidth },true)
    },800)
  }

  // Emitted when the window is closed.
  controlWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    controlWindow = null;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    controlWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

if (app.dock) {
  app.dock.setIcon(path.join(__dirname,'lib','emoji-logo.png'))
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
