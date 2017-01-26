'use strict';

var fse = require('fs-extra');
var path = require('path');


function  removeSrcPath(pathStr, srcStr) {
    return pathStr.substring(pathStr.indexOf(srcStr) + srcStr.length);
}

function prep_sync_file_path(file, srcDir, destDir) {
    var newfilename = removeSrcPath(file, srcDir)
    file = path.join(destDir, newfilename)
    return file
}

function syncfile(srcfile, destfile, timeTreshold) {
    // timeTreshold  is in milliseconds because Date() is in milliseconds
    timeTreshold = (timeTreshold == undefined || timeTreshold < 100 ) ? 1000: timeTreshold
    // get date and time from src and dest files
    var statSrc = fse.statSync(srcfile);
    
    // if the destination file exist - check if it's younger than the src before syncing
    if (fse.existsSync(destfile)){
        var statDest = fse.statSync(destfile);
        // add threshold to destination time    
        var expectedSyncTime = new Date(statSrc.mtime.getTime() + timeTreshold)
        console.log(statDest, statSrc)
        // if (statDest.mtime <  expectedSyncTime || statDest.size < statSrc.size) {
        if (1){
            // sync file to new location
            fse.copy(srcfile, destfile, {preserveTimestamps:true} ,function (err) {
                if (err) return console.error(err)
                // change modified time to match that of source file
                fse.utimesSync(destfile, statSrc.atime, statSrc.mtime)
                console.log(destfile + " was updated")
                return true;
            })
        } else {

            console.log(destfile + " was NOT updated", statDest.mtime ,  expectedSyncTime ,  statDest.mtime.getTime() <  expectedSyncTime.getTime() )
            console.log("Destination file too new for syncing... - threshold = "+ timeTreshold + "ms ... reduce it to sync faster")
        }
    } else {
        // destination file doesn't exist
        fse.copy(srcfile, destfile, {preserveTimestamps:true}, function (err) {
            if (err) return console.error(err)
            // change modified time to match that of source file
            fse.utimesSync(destfile, statSrc.atime, statSrc.mtime);
            console.log(destfile + " was synced")
            return true;
        })

    }
    return false;
}

function post_sync_task(srcDir, destDir) {

    fse.walk(srcDir)
        .on('readable', function () {
            var item
            while ((item = this.read())) {
                // if (fse.utimesSync(destfile, item.stats.atime, item.stats.mtime))
                console.log(item.path, item.stats.mtime)
            }
        })
}



// var srcDir = "./src"
// var destDir = "./dest"
// // var file = "./src/views/layout.jade"
// var file = "./src/node_modules/ms/LICENSE"
// var newfile = ""


// syncfile(file, prep_sync_file_path(file, srcDir, destDir));
// syncfile(srcDir, destDir, 200)

module.exports = exports = {
    syncfile: syncfile,
    prep_sync_file_path: prep_sync_file_path
}
