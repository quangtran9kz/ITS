window.onload = () => {
    var Save = document.getElementById("save");
    var startRecording = document.getElementById("startRecording");
    var stopRecording = document.getElementById("stopRecording");
    var statusImage = document.getElementById("statusImage");
    var body = document.getElementById("body");
    var table = document.getElementById("datatable");
    var timer;
   
    function createDataTable(data) {
        var row = table.insertRow(0);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        try {
            // document.getElementsByTagName("td").style.width="150px";
            // document.getElementsByTagName("td").style.height="50px";
            cell1.innerHTML = data.url;
            cell2.innerHTML = data.status;
        } catch (error) {
        }
    }
    function changeColor(){
    timer= setInterval( ()=>{ try {
        if (body.style.border == "") {
            body.style.border = "3px solid red";
        }
        else if (body.style.border == "3px solid red") {
            body.style.border = "3px solid blue";
        }
        else if (body.style.border == "3px solid blue") {
            body.style.border = "3px solid green";
        }
        else if (body.style.border == "3px solid green") {
            body.style.border = "3px solid red";
        }
    } catch (error) {
    }},1000);
    return(timer);
}
    chrome.storage.local.get(['imageSrc'], function (result) {
        statusImage.src = result.imageSrc;
    });
    try {
        // Export JSON file
        Save.onclick = () => {
            chrome.runtime.sendMessage({ action: "save" })
        };
        // Start Recording
        startRecording.onclick = () => {
            changeColor();
            statusImage.src = "image/Record-Pressed-icon.png";
            chrome.runtime.sendMessage({ action: "startRecording" })
        };
        // Stop Recording
        stopRecording.onclick = () => {
            clearInterval(timer);
            statusImage.src = "image/stop-icon.png";
            chrome.runtime.sendMessage({ action: "stopRecording" })
        };
    } catch (error) {
    }
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        createDataTable(msg.data);
    })
}
