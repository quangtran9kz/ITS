
// Hepler functions
function convertUrlToUri(urlString) {
    try {
        var paraArray = urlString.split("?")[1].split("&");
        var uri = {};
        for (let para = 0; para < paraArray.length; para++) {
            let key = paraArray[para].split("=")[0];
            let value = paraArray[para].split("=")[1];
            uri[key] = value;
        }
        return uri;
    } catch (error) {
        return;
    }

}
(function () {
    const tabStorage = {};
    const networkFilters = {
        urls: [
            "<all_urls>"
        ]
    };
    // Capture HTTP request
    chrome.webRequest.onBeforeRequest.addListener((details) => {
        // var FileSaver = require('file-saver');
        // var blob = new Blob(["Hello, world!"], { type: "text/plain;charset=utf-8" });
        // FileSaver.saveAs(blob, "hello world.txt");
        const { tabId, requestId, url, timeStamp, method, type, frameId, parentFrameId } = details;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }
        // Capture HTTP request, action method = POST
        if (details.method == "POST") {
            var data = details.requestBody.formData;
            console.log("Form Data:");
            console.log(data);
            /*
            if(data) {
                Object.keys(data).forEach(key => {
                    data[key].forEach(value => {
                        console.log(value);
                    });
                });
            }
            */
        }
        // Capture HTTP request, action method = GET
        tabStorage[tabId].requests[requestId] = {
            requestId: requestId,
            method: method,
            type: type,
            frameId: frameId,
            url: url,
            startTime: timeStamp,
            parentFrameId: parentFrameId,
            status: 'pending'
        };
        // split URL
        var urlString = tabStorage[tabId].requests[requestId].url;
        console.log("URL:");
        //console.log(typeof (urlString));
        console.log(urlString);
        var uri = {};
        uri = convertUrlToUri(urlString);
        console.log("Request infomation:");
        console.log(tabStorage[tabId].requests[requestId]);
        //console.log(paraArray);
        console.log("Uri:");
        console.log(uri);

    }, networkFilters, ["requestBody"]);

    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId, timeStamp, responseHeaders } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }
        let responseHeader = { ...responseHeaders };
        console.log("Response:");
        console.log(responseHeader);
        const request = tabStorage[tabId].requests[requestId];

        Object.assign(request, {
            endTime: timeStamp,
            requestDuration: timeStamp - request.startTime,
            status: 'complete'
        });
        console.log(tabStorage[tabId].requests[details.requestId]);
    }, networkFilters, ["responseHeaders"]);

    // When errors
    chrome.webRequest.onErrorOccurred.addListener((details) => {
        const { tabId, requestId, timeStamp } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        const request = tabStorage[tabId].requests[requestId];
        Object.assign(request, {
            endTime: timeStamp,
            status: 'error',
        });
        console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters);

    chrome.tabs.onActivated.addListener((tab) => {
        const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
        if (!tabStorage.hasOwnProperty(tabId)) {
            tabStorage[tabId] = {
                id: tabId,
                requests: {},
                registerTime: new Date().getTime()
            };
        }
    });

    chrome.tabs.onRemoved.addListener((tab) => {
        const tabId = tab.tabId;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }
        tabStorage[tabId] = null;
    });

    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        switch (msg.type) {
            case 'popupInit':
                response(tabStorage[msg.tabId]);
                break;
            default:
                response('unknown request');
                break;
        }
    });
}());

