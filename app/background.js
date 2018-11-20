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

var requestHeader = [];
var bigData = {};
var responseHeader = [];
var startRecording = false;
function exportObjectToJSONFile() {
    // Convert object to a string.
    var result = JSON.stringify(bigData);

    // Save as file
    var url = 'data:application/json;base64,' + btoa(result);
    chrome.downloads.download({
        url: url,
        filename: 'data.json'
    });
    // requestHeader.length = 0;
    // responseHeader.length = 0;
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
function filterResponseHeader(data) {
     var filterData = {};
    // for (x in data) {
    //     console.log(x);
    //     let key = data[x].name;
    //     let value = data[x].value;
    //     filterData[key] = value;
    //     console.log(filterData);
    // }
  var arr=Array.from(Object.keys(data),k=>data[k]);
  arr.forEach((e)=>{
     filterData[e.name]=e.value;
    })
    console.log(filterData);
    if(startRecording){
        responseHeader.push(filterData);
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
        const { tabId, requestId, url, timeStamp, method, type, frameId, parentFrameId } = details;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }
        // Capture HTTP request, action method = POST
        if (details.method == "POST") {
            try {
                var data = details.requestBody.formData;
                // console.log("Form Data:");
                // console.log(data);

            } catch (error) {
                console.log(error);
            }

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
            status: 'pending',
            postdata: data
        };
        // split URL
        var urlString = tabStorage[tabId].requests[requestId].url;
        //console.log("URL:");
        // console.log(typeof (urlString));
        //console.log(urlString);
        //var parameters = {};
        //parameters = convertUrlToUri(urlString)!=undefined?convertUrlToUri(urlString):"none";
        //console.log("Request infomation:");
        //console.log(tabStorage[tabId].requests[requestId]);
        //console.log(paraArray);
        //console.log("Parameters:");
        //console.log(parameters);
        //var items = { "key": "1", "key2":"2"};
        // exportObjectToJSONFile(items);
        defineData(tabStorage[tabId].requests[requestId], "request");

    }, networkFilters, ["requestBody"]);

    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId, timeStamp, responseHeaders } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }
        let response = { ...responseHeaders };
        //console.log("Response Header:");
        //console.log(response);
        const request = tabStorage[tabId].requests[requestId];

        Object.assign(request, {
            endTime: timeStamp,
            requestDuration: timeStamp - request.startTime,
            status: 'complete'
        });
        //console.log(tabStorage[tabId].requests[details.requestId]);
        filterResponseHeader(response);
        defineData(response, "response");
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

    // chrome.runtime.onMessage.addListener((msg, sender, response) => {
    //     switch (msg.type) {
    //         case 'popupInit':
    //             response(tabStorage[msg.tabId]);
    //             break;
    //         default:
    //             response('unknown request');
    //             break;
    //     }
    // });
    function defineData(data, type) {
        if (type === "request") {
            if(startRecording){
                requestHeader.push(data);
            }            
            bigData.request = requestHeader;
        }
        else if (type === "response") {
            bigData.response = responseHeader;
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

