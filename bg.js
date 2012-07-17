
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}

// uploads file via AJAX to external local server
function uploadToExternalServer(serverurl, type, origurl, fpath, body, forced) {
//    console.debug("uploadToExternalServer", serverurl, type, origurl, fpath);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', serverurl, true);

    // remove possible query string
    fpath = fpath.split("?")[0];

    xhr.setRequestHeader("X-origtype", type);
    xhr.setRequestHeader("X-origurl", origurl);
    xhr.setRequestHeader("X-filepath", fpath);

    xhr.onreadystatechange = function(event) {
        if (xhr.readyState == 4) {
            if (xhr.status === 200) {
                if (!xhr.responseText.startsWith("OK")) {
                    // server error
                    setError(xhr.responseText, origurl, forced);
                } else {
                    // success!
                    setError("0");
                    markFileSaved(origurl);
                }
            } else {
                // error in http call
                setError("Local server not running?", origurl, forced);
            }
        }
    };
    xhr.send(body);
}


// set an error to be shown in panel
function setError(s, url, forced) {
    localStorage.error = s;

    if (url && !forced) {
        var obj = _findFile(url);
        obj.counter += 1;
    }
}

// return a mapping (dest folder) for this url
function getDestFilePath(url) {
    var data = localStorage.mappings || "[]";
    var list = JSON.parse(data);
    for (var i = 0; i < list.length; i++) {
        var mapping = list[i];

        var urlprefix = mapping.url;
        var prelen = urlprefix.length;
        var destprefix = mapping.dir;
        if (url.startsWith(urlprefix)) {
            var fname = url.slice(prelen, 1000);
            fname = destprefix + fname;
            // remove accidental line breaks, break stuff!
            return fname.replace(/(\r\n|\n|\r)/gm,"");
        }
    }

    return null;
}

// save this url and content
function saveFile(url, type, body, forced) {
    console.log('saveFile', url, type, body.length);

    // clear error
    setError("");

    /*
    var b = {text:""+count};
    chrome.browserAction.setBadgeText(b);
    count += 1;
    */

    // get dest file path
    var fpath = getDestFilePath(url);
    if (fpath) {
        if (forced || !localStorage.autosave) {
            // save automatically
            if (!forced)
                addSaveFile(url, type, fpath, body, false);
            // send to python server
            var serverurl = 'http://127.0.0.1:8080/save';
            uploadToExternalServer(serverurl, type, url, fpath, body, forced);
        } else {
            // set to cache
            addSaveFile(url, type, fpath, body, true);
        }
    } else {
        // no mapping for this file, remember it
        if (!lastUrlNoMapping.startsWith("chrome")) {
            lastUrlNoMapping = url;
            setError("No mapping for "+url);
        }
    }
}

// msg from devtools or panel:
function onRequest(req, sender, sendResponse) {
    if (req.deb) {
        // debug
        console.log(req.deb);
        sendResponse({});
    } else if (req.savedlist) {
        // send list of saved files
        sendResponse(savedList);
    } else if (req.save) {
        // manual save
        // find from cache
        var obj = _findFile(req.url);
        if (obj) {
            saveFile(obj.url, obj.type, obj.body, true);
//            markFileSaved(obj.url);
        }
        sendResponse({});
    } else if (req.last) {
        // ask last url
        sendResponse(lastUrlNoMapping);
/*    } else if (req.load) {
        // page reload: clear
        chrome.tabs.getSelected(null, function(tab) {
            console.debug("load, tab:", tab.id);
//            console.debug("d1", chrome.experimental.devtools.panels.elements);
        });
        sendResponse({});*/
    } else {
        // CSS or JS was modified
        saveFile(req.url, req.type, req.body);
        sendResponse({});
    }
}
chrome.extension.onRequest.addListener(onRequest);


//--------------------------------------------------------------------------

// list of saved files objects
var savedList = [];
var lastUrlNoMapping = "";


// add saved file to savedList, move file to the top
function addSaveFile(url, type, dest, body, isPending) {

    console.debug("addSaveFile", url);

    // find the file
    var obj = null;
    for (var i = 0; i < savedList.length; i++) {
        var o = savedList[i];
        if (o.url == url) {
            obj = o;
            savedList.splice(i, 1);
            break;
        }
    }

    if (!obj) {
        obj = {};
        obj.counter = 0;
    }

    if (isPending || obj.counter) {
        obj.counter += 1;
    }
    obj.url  = url;
    obj.type = type;
    obj.dest = dest;
    obj.body = body;
    obj.time = (new Date()).getTime();
    savedList.unshift(obj);
}

// find the file
function _findFile(url) {
    for (var i = 0; i < savedList.length; i++) {
        var o = savedList[i];
        if (o.url == url) {
            return o;
        }
    }
    return null;
}

// mark file as saved
function markFileSaved(url) {
    var obj = _findFile(url);
    if (obj) {
        obj.counter = 0;
    }
}

console.log('bg loaded');

