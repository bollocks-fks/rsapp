// process.env.NODE_ENV = 'production';
process.env.NODE_ENV = 'development';

const url = require('url');
const path = require('path');
const electron = require('electron');
const {
    app,
    BrowserWindow,
    Menu,
    ipcMain
} = electron;

require('electron-context-menu')();

const Store = require('electron-store');
const store = new Store();


// --- config
var default_config = {
    "nms": {
        "rtmp": {
            "chunk_size": 10000, // 60000
            "gop_cache": false, // true
            "ping": 10,
            "ping_timeout": 5,
            "port": 1935
        },
        "enabled": false
    },
    "rs": {
        "cameraID": "0",
        "robotID": "0",
        "streamKey": "",
        "tts_voice": "Alex",
        "tts_extra": "-ven+m3",
        "tts_speed": "1",
        "tts_enabled": false,
        "tts_pausetime": "1",
        "tts_queuemax": "20",
        "screenWidth": "800",
        "screenHeight": "450",
        "videoBitrate": "700k",
        "audioBitrate": "128k",
        "api_host": "api.robotstreamer.com",
        "api_port": "8080",
        "api_protocol": "http",
        "chat_host": "robotstreamer.com",
        "chat_port": "8765",
        "chat_protocol": "ws",
        "video_host": "",
        "video_port": "",
        "audio_host": "",
        "audio_port": ""
    }
}
// -- reset config
// store.set('config',null)

// --- init config
if (!store.get('config')) {
    console.log('loading default settings')
    store.set('config', default_config)
    console.log('store initalized with config:', store.get('config'))
} else {
    console.log('settings loaded: ', store.get('config'))
    // check all rs configs and set to default if non existant
    var rskeys = Object.keys(default_config.rs)
    for (var i = 0; i < rskeys.length; i++ ){
      let key = rskeys[i]
      if (!store.get('config.rs.'+key) && store.get('config.rs.'+key) != "0") {
        let set_to = default_config.rs[key]
        console.log('setting default value for ' + key + ' to ' + set_to)
        store.set('config.rs.'+key, set_to)
      }
    }
}


// ---- status
var default_status = {
    "tts": {
        "messages": 0
    }
}
// -- reset status
store.set('status',null)
// -- init status
store.set('status', default_status)


let mainWindow;
let addWindow;

// Listen for app to be ready
app.on('ready', function() {
    // Create new window
    mainWindow = new BrowserWindow({
        backgroundColor: '#333',
        width: 350,
        height: 550
    });
    // save mainWindow in app
    app.win = mainWindow;
    // Load html in window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }))

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('config:load', store.get('config'))
    })

    // ipcRenderer.send('config:load', config);
    // Quit app when closed
    mainWindow.on('closed', function() {
        app.quit();
    });

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);
});



// Catch item:add
ipcMain.on('config:save', function(e, conf) {
    console.log('config:save', conf)
    store.set('config', conf)
});

// Create menu template
const mainMenuTemplate = [
    // Each object is a dropdown
    {
        label: 'File',
        submenu: [{
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            },
            {
                label: "Edit",
                submenu: [{
                        label: "Undo",
                        accelerator: "CmdOrCtrl+Z",
                        selector: "undo:"
                    },
                    {
                        label: "Redo",
                        accelerator: "Shift+CmdOrCtrl+Z",
                        selector: "redo:"
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Cut",
                        accelerator: "CmdOrCtrl+X",
                        selector: "cut:"
                    },
                    {
                        label: "Copy",
                        accelerator: "CmdOrCtrl+C",
                        selector: "copy:"
                    },
                    {
                        label: "Paste",
                        accelerator: "CmdOrCtrl+V",
                        selector: "paste:"
                    },
                    {
                        label: "Select All",
                        accelerator: "CmdOrCtrl+A",
                        selector: "selectAll:"
                    }
                ]
            }
        ]
    }
];

// If OSX, add empty object to menu
if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

// Add developer tools option if in dev
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [{
                role: 'reload'
            },
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            }
        ]
    });
}


// Alive Message
const rsAlive = require('./rs-server-alive')
const rsTTS = require('./rs-server-tts')
const rsChat = require('./rs-server-chat')
rsChat.setTTS(rsTTS.tts)
ipcMain.on('chat:restart', function(e, data) {
  console.log('Restarting Chat...'.yellow)
    // rsChat.restart()
});
const rsNMS = require('./rs-server-nms')


setTimeout(function() {
    console.log('___________checking if ready'.yellow)
    if (rsNMS.nms && store.get('config.rs.video_host') && store.get('config.rs.audio_host')) {
        console.log('| READY TO CONNECT:'.magenta)
        console.log('| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.magenta)
        console.log('|       URL: '.green + 'rtmp://localhost/live'.yellow)
        console.log('| STREAMKEY: '.green + 'cam'.yellow)
    }
}, 2000)




// ffmpeg video server

// var encoder = spawn('ffmpeg', args);
// encoder.stderr.pipe(process.stdout);
