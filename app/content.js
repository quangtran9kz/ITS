var doc = document.body.innerHTML
console.log(doc);
//var result = JSON.stringify(x);
chrome.runtime.sendMessage({dom: doc}, function(response) {
    console.log("Response: ", response);
});
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
            statusImage.src = "Record-Pressed-icon.png";
            chrome.runtime.sendMessage({action:"startRecording"})
        };
        // Stop Recording
        stopRecording.onclick=()=>{
            statusImage.src = "stop-icon.png";
            chrome.runtime.sendMessage({action:"stopRecording"})
        };
    } catch (error) {   
    }
}