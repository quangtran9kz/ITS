/**************************************************************/
// User story: 
/**************************************************************/
/*
// As a developer, 
// I want to capture HTTP request. 
// So that export parameters of http request 
//  into JSON file follow structure define by myself.
*/

// **********************************************************//
// ****************** Helper functions **********************//
// **********************************************************//

// Export objects {key: "value"} to JSON file
/*
* Input: Object with format JSON {key: "value", key: "value"}
* Parameters: None
* Output: JSON file
*    
*/


var bigData = {};
var DataArr=[];
var startRecording = false;
chrome.storage.local.set({"imageSrc": "stop-icon.png"});
function exportObjectToJSONFile() {
    // Convert object to a string.
    bigData.request=DataArr;
    var result = JSON.stringify(bigData);
    // Save as file
    var url = 'data:application/json;base64,' + btoa(result);
    chrome.downloads.download({
        url: url,
        filename: 'data.json'
    });
    DataArr.length=0;
}
// Convert URL String to URI Object {key : "value"} 
/*
* Input: URL
* Parameters: URL string
* Output: Object JSON {key1: "value1", key2: "value2"}
*
*/
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
        const { tabId, requestId, timeStamp } = details;
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
    }, networkFilters, ["requestBody"]);

    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            const { tabId, requestId, requestHeaders } = details;
            try {
                Object.assign(tabStorage[tabId].requests[requestId], {
                    Headers: requestHeaders
                })
            } catch (error) {

            }
        },
        networkFilters,
        ["requestHeaders"]);
        chrome.webRequest.onSendHeaders.addListener((details)=>{
            let a={...details};
            console.log(a);
        },networkFilters,["requestHeaders"])
    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId, timeStamp, responseHeaders, url, method, type, frameId, parentFrameId } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }
        let source = { ...details };
        let response = { ...responseHeaders };
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
        console.log(tabStorage[tabId].requests[requestId]);
        defineData(tabStorage[tabId].requests[requestId]);
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
    function defineData(data) {
        if (startRecording) {
            DataArr.push(data);
        }
    }
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
        sendResponse("send response!");
        if (msg.action === "startRecording") {
            startRecording = true;
            chrome.storage.local.set({"imageSrc": "Record-Pressed-icon.png"});
        }
        if (msg.action === "stopRecording") {
            startRecording = false;
            chrome.storage.local.set({"imageSrc": "stop-icon.png"});
        }
        if (msg.action === "save") {
           // console.log(bigData);
             exportObjectToJSONFile();
        }
    });
}());

