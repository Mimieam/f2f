'use strict';

var chokidar = require('chokidar');
var fse = require('fs-extra');
var watcher = null;
var showInLogFlag = false;
var sync = require('./syncfile');
var p = require('path'); // dude clean up path variable misused below

var Store = window.localStorage
Notification.requestPermission();

var _store = {}

var srcDir = ""
var destDir = ""

if ("mimiSync" in Store) {
    _store = JSON.parse(Store.getItem('mimiSync'));
    document.querySelector('#location1+label').innerHTML = srcDir =_store['srcDir']
    document.querySelector('#location2+label').innerHTML = destDir =  _store['destDir']

}

function NotificationFactory(msg) {
    var options = [
        {
            title: "mimiSync Notification",
            body: "file updated"
        },
        {
            title: "mimiSync Notification",
            body: msg,
            icon: p.join(__dirname, 'icon.png')
        }
    ]
    return new Notification(options[1].title, options[1]);
}


function StartWatcher(path){
    if (path === "") { return}  
    document.querySelector(".messageLogger").innerHTML = "Scanning the path, please wait ...";
    watcher = chokidar.watch(path, {
        ignored:  /(node_modules|.\git|bower_components|\.meteor)/,
        persistent: true
    });

    function onWatcherReady(){
        console.info('From here can you check for real changes, the initial scan has been completed.');
        showInLogFlag = true;
        document.querySelector(".messageLogger").innerHTML = "The path is now being watched";
    }

    watcher
    .on('add', function(path) {
        console.log('File', path, 'has been added');
        var newPath = sync.prep_sync_file_path(path, srcDir, destDir)
        sync.syncfile(path, newPath)
        if(showInLogFlag){
            addLog("File added : "+path,"new");
        }
    })
    .on('addDir', function(path) {
            console.log('Directory', path, 'has been added');
            if(showInLogFlag){
                addLog("Folder added : "+path,"new");
            }
        })
    .on('change', function(path) {
        console.log('File', path, 'has been changed');

        var newPath = sync.prep_sync_file_path(path, srcDir, destDir)
        sync.syncfile(path, newPath)
        if(showInLogFlag){
            addLog("A change ocurred : " + newPath + "change");
            NotificationFactory("A change ocurred : " + newPath + "change")
        }
    })
    .on('unlink', function(path) {
       var _path = sync.prep_sync_file_path(path, srcDir, destDir)
        fse.remove(_path, function (err, _path) { 
            if (err){ console.log(err)}
            console.log('File', _path, 'has been removed');
        })
        if(showInLogFlag){
            addLog("A file was deleted : "+_path,"delete");
        }
    })
    .on('unlinkDir', function(path) {
        console.log('Directory', path, 'has been removed');

        if(showInLogFlag){
            addLog("A folder was deleted : "+path,"delete");
        }
    })
    .on('error', function(error) {
        console.log('Error happened', error);

        if(showInLogFlag){
            addLog("An error ocurred: ","delete");
            console.log(error);
        }
    })
    .on('ready', onWatcherReady)
    .on('raw', function(event, path, details) {
        // This event should be triggered everytime something happens.
        console.log('Raw event info:', event, path, details);
    });
}

document.querySelector("#location1+label").addEventListener("click",function(e){
    e.preventDefault = true;
    const {dialog} = require('electron').remote;
    dialog.showOpenDialog({
        properties: ['openDirectory']
    },function(path){
        _store['srcDir'] = srcDir = path[0]
        if (path) {
            if (watcher) {
                console.log(watcher.getWatched())
                watcher.close();
            }
            // StartWatcher(path);
            document.querySelector('#location1+label').innerHTML = path
            document.querySelector("#location1").disabled = true;
        }else {
            console.log("No path selected");
            document.querySelector('#location1').blur()
        }
        document.querySelector('#location1').blur()
    });
}, false);


document.querySelector("#location2+label").addEventListener("click",function(e){
    e.preventDefault = true;
    const {dialog} = require('electron').remote;
    dialog.showOpenDialog({
        properties: ['openDirectory']
    },function(path){
        _store['destDir'] = destDir = path[0]
        if (path) {
            if (watcher) {
                console.log(watcher.getWatched())
                watcher.close();
            }
            // StartWatcher(path);
            document.querySelector('#location2+label').innerHTML = path
            document.querySelector("#location2").disabled = true;
        }else {
            console.log("No path selected");
            document.querySelector('#location2').blur()
        }
        document.querySelector('#location2').blur()
    });
}, false);


// document.querySelector("#srcFolder").addEventListener("click",function(e){
//     e.preventDefault = true;
//     const {dialog} = require('electron').remote;
//     dialog.showOpenDialog({
//         properties: ['openDirectory']
//     },function(path){
//         srcDir = path
//         if (path) {
//             if (watcher) {
//                 console.log(watcher.getWatched())
//                 watcher.close();
//             }
//             // StartWatcher(path);
//             document.querySelector('#srcFolder+label').innerHTML = path
//             document.querySelector("#srcFolder").disabled = true;
//         }else {
//             console.log("No path selected");
//             document.querySelector('#srcFolder').blur()
//         }
//         document.querySelector('#srcFolder').blur()
//     });
// }, false);

// document.querySelector("#destFolder").addEventListener("click",function (e) {
//     e.preventDefault = true;
//     const {dialog} = require('electron').remote;
//     dialog.showOpenDialog({
//         properties: ['openDirectory']
//     }, function (path) {
//         if (path) {
//             if (watcher) {
//                 console.log(watcher.getWatched())
//                 watcher.close();
//             }
//             StartWatcher(path);
//             document.querySelector('#destFolder+label').innerHTML = path
//             document.querySelector("#destFolder").disabled = true;
//         } else {
//             console.log("No path selected");
//             document.querySelector('#destFolder').blur()
//         }
//         document.querySelector('#destFolder').blur()
//     });  
// }, false)

document.querySelector("[type=checkbox]").addEventListener("change", function (e) {
    Store.setItem("mimiSync", JSON.stringify(_store))
    var checked = (this.checked) ? true : false;
        if (checked) {
            StartWatcher(srcDir||_store['srcDir']);
            document.querySelector('.sync-icon i').innerHTML = "keyboard_tab"
        } else {
            document.querySelector('.sync-icon i').innerHTML = "close"
            
        }
    }, false);

    function resetLog(){
        return document.querySelector(".log-container").innerHTML = "";
    }

    function addLog(message,type){
        var el = document.querySelector(".log-container");
        var newItem = document.createElement("LI");       // Create a <li> node
        var textnode = document.createTextNode(message);  // Create a text node
        if(type == "delete"){
            newItem.style.color = "tomato";
        }else if(type == "change"){
            newItem.style.color = "#2CA5EF";
        }else{
            newItem.style.color = "#2bbc8a";
        }

        newItem.appendChild(textnode);                    // Append the text to <li>
        el.appendChild(newItem);
        // el.insertBefore(newItem, el.firstChild);
        // el.insertBefore(document.createElement("LI"), el.firstChild);

    }
