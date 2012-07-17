chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(function(resource, content) {
    // CSS or JS was changed, we got the content

    if (resource.type == "document")
        return; // don't bother with this type

    var payload = { "body": content, "url":resource.url, "type":resource.type };

    // send data to background page
    chrome.extension.sendRequest(payload, function(response) {});
});

// create new panel
chrome.devtools.panels.create("Save", "ico-disk.png", "panel.html",
                    function(panel) {
    // reset error msg
    localStorage.error = "";

    panel.onShown.addListener(function(w) {

        w.refreshPage();
    });
});

