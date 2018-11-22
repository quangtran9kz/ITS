window.onload=()=>{
    var Save = document.getElementById("save");
    var startRecording = document.getElementById("startRecording");
    var stopRecording = document.getElementById("stopRecording");
    var statusImage = document.getElementById("statusImage");
    try {
        // Export JSON file
        Save.onclick=()=>{
            chrome.runtime.sendMessage({action:"save"})
        };
        // Start Recording
        startRecording.onclick=()=>{
            statusImage.src = "image/Record-Pressed-icon.png";
            chrome.runtime.sendMessage({action:"startRecording"})
        };
        // Stop Recording
        stopRecording.onclick=()=>{
            statusImage.src = "image/stop-icon.jpg";
            chrome.runtime.sendMessage({action:"stopRecording"})
        };
    } catch (error) {   
    }
}