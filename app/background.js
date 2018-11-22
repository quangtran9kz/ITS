(function () {
    const tabStorage = {};
    const networkFilters = {
        urls: [
            "<all_urls>"
        ]
    };
    var bigdata = {};
    var dataarr = [];
    var startRecording = false;
    function exportObjectToJSONFile() {
        // Convert object to a string.
        bigdata.request = dataarr;
        var result = JSON.stringify(bigdata);
        // Save as file
        var url = 'data:application/json;base64,' + btoa(result);
        chrome.downloads.download({
            url: url,
            filename: 'data.json'
        });
        dataarr.length = 0;
    }
    // Capture HTTP request
    chrome.webRequest.onBeforeRequest.addListener((details) => {
        const { url,method,tabId, requestId, timeStamp } = details;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }
        // Capture HTTP request, action method = POST
        if (details.method == "POST") {
            try {
                var data = details.requestBody.formData;

            } catch (error) {
                console.log(error);
            }
        }
        // Capture HTTP request, action method = GET
        tabStorage[tabId].requests[requestId] = {
            startTime: timeStamp,
            requestId: requestId,
            postdata: data !== undefined ? data : "none"
        };
        captureResponse(method,url);
    }, networkFilters, ["requestBody"]);

    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            const { tabId, requestId, requestHeaders } = details;
            try {
                Object.assign(tabStorage[tabId].requests[requestId], {
                    headers: requestHeaders
                })
            } catch (error) {

            }
        },
        networkFilters,
        ["requestHeaders"]);
    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId, timeStamp, url, method, type, frameId, parentFrameId } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }
        let source = { ...details };
        Object.assign(tabStorage[tabId].requests[requestId], {
            url: url,
            method: method,
            type: type,
            frameId: frameId,
            parentFrameId: parentFrameId,
            responseHeader: source.responseHeaders,
            Ip: source.ip,
            initiator: source.initiator,
            statusLine: source.statusLine,
            endTime: timeStamp,
            requestDuration: timeStamp - tabStorage[tabId].requests[requestId].startTime,
            status: 'complete'
        });
        //console.log(tabStorage[tabId].requests[requestId]);
        defineData(tabStorage[tabId].requests[requestId]);
    }, networkFilters, ["responseHeaders"]);
    // When errors
    chrome.webRequest.onErrorOccurred.addListener((details) => {
        const { tabId, requestId, timeStamp, frameId, method, error, parentFrameId, type, ip, initiator, url } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }
        const request = tabStorage[tabId].requests[requestId];
        Object.assign(tabStorage[tabId].requests[requestId], {
            url: url,
            method: method,
            type: type,
            frameId: frameId,
            parentFrameId: parentFrameId,
            Ip: ip,
            initiator: initiator,
            endTime: timeStamp,
            status: 'error',
            error: error
        });
        defineData(tabStorage[tabId].requests[requestId]);
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
    function defineData(data) {
        if (startRecording) {
            dataarr.push(data);
        }
    }
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
        sendResponse("send response!");
        if (msg.action === "startRecording") {
            startRecording = true;
        }
        if (msg.action === "stopRecording") {
            startRecording = false;
        }
        if (msg.action === "save") {
            exportObjectToJSONFile();
        }
    });
}());

