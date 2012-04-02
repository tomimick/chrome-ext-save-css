
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// get elem shortcut
function elem(elem) {
    return document.getElementById(elem);
}
// dump debug
function deb(val) {
    if (window.chrome) {
        var d = {"deb":val};
        chrome.extension.sendRequest(d, function(response) {});
    } else
        console.debug(val);
}

// save mappings from the ui to localstorage
function saveMappings() {
    var table = elem("rules");
    var tr = table.firstElementChild;
    var list = [];
    while (tr) {
        var url = tr.firstChild.innerText;
        var fold = tr.firstChild.nextSibling.innerText;
        if (!url.endsWith("/"))
            url += "/";
        if (!fold.endsWith("/"))
            fold += "/";
        var map = {"url":url,"dir":fold};
        list.push(map);
        tr = tr.nextSibling;
    }
    localStorage.mappings = JSON.stringify(list);

    // flash message
    elem("saved").style.opacity = 1;
    setTimeout(function(){
        elem("saved").style.opacity = 0;
    }, 500);
}

// populate ui from localStorage
function loadMappings() {
    var data = localStorage.mappings || "[]";
    var list = JSON.parse(data);
    var table = elem("rules");
    var row = elem("newtr");
    table.innerHTML = "";
    for (var i = 0; i < list.length; i++) {
        var o = list[i];
        var clone = row.cloneNode(true);
        clone.className="";
        clone.children[0].innerText = o.url;
        clone.children[1].innerHTML = o.dir;
        table.appendChild(clone);
    }
}

function agoStr(src) {
    var now = new Date();
    var n = (now.getTime()-src)/1000;
    if (n < 60)
        return ""+parseInt(n)+" secs ago";
    else
        return ""+parseInt(n/60)+" mins ago";
}

function loadSavedList() {
    var d = {"savedlist":"1"};
//    var savedList = [];
    chrome.extension.sendRequest(d, function(savedList) {
        var table = elem("savedlist");
        var row = elem("trsaved");
        table.innerHTML = "";
        for (var i = 0; i < savedList.length; i++) {
            var o = savedList[i];
            var clone = row.cloneNode(true);
            clone.setAttribute("id","");
            if (o.counter)
                clone.className="pending";
            else
                clone.className="";
            clone.children[0].innerText = o.url;
            clone.children[1].innerHTML = "&rarr; "+o.dest;
            clone.children[2].innerText = (o.body || "").length + " bytes";
            clone.children[3].innerText = agoStr(o.time);
            clone.children[4].firstChild.innerText = "Save "+o.counter+ " changes";
            table.appendChild(clone);
        }
    });
}

// show or hide error txt
function toggleError() {
    hideError();

    var p = elem("err");
    var err = localStorage.error;
    if (err && err != "0") {
        p.children[1].innerText = err;
        p.style.display = "block";
    }
}
function hideError() {
    var p = elem("err");
    p.style.display = "none";
}


function refreshPage() {
    deb("refreshPage");

    loadMappings();
    loadSavedList();

    /*
    var d = {"last":"1"};
    chrome.extension.sendRequest(d, function(lasturl) {
        elem("lasturl").firstElementChild.innerText = lasturl;
    });*/

    elem("autosave").checked = !localStorage.autosave;

    toggleError();
}

// add a rule
elem("addnew").addEventListener('click', function(e) {
    var d = {"last":"1"};
    chrome.extension.sendRequest(d, function(lasturl) {
        if (!lasturl)
            lasturl = "http://x/";
        var clone = elem("newtr").cloneNode(true);
        clone.style.display="table-row";
        clone.firstChild.innerHTML = lasturl;
        elem("rules").appendChild(clone);
        clone.firstChild.focus();
    });
    e.preventDefault();
}, false);

// delete rule
elem("rules").addEventListener('click', function(e) {
    var t = e.target;
//    console.debug("d1", t, t.nodeName);
    if (t.nodeName == "A") {
        var tr = t.parentNode.parentNode;
        tr.parentNode.removeChild(tr);
        e.preventDefault();
    }
}, false);

// save all rules
elem("save").addEventListener('click', function(e) {
    saveMappings();
    loadMappings();
}, false);


// manual save CSS file
elem("savedlist").addEventListener('click', function(e) {
    var t = e.target;
    if (t.className == "save but") {
        hideError();

        var tr = t.parentNode.parentNode;
        var url = tr.firstChild.innerText;
        console.debug("save", url);

        var d = {"save":"1", "url":url};
        chrome.extension.sendRequest(d, function(lasturl) {
            // show result, wait for asynch call
            setTimeout(function(){
                loadSavedList();
                toggleError();
            }, 500);
        });

        e.preventDefault();
    }
}, false);


// autosave setting
elem("autosave").addEventListener('change', function(e) {
    localStorage.autosave = elem("autosave").checked ? "" : "1";
}, false);

