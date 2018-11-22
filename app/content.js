var doc = document.body.innerHTML
console.log(doc);
//var result = JSON.stringify(x);
chrome.runtime.sendMessage({dom: doc}, function(response) {
    console.log("Response: ", response);
});
