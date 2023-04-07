// --> Affichage de la version
document.querySelector("[version]").innerText = "Version " + chrome.runtime.getManifest().version;

/* 

// Auto Login

let usernameValue = "";
let passwordValue = "";

const inputEvent = new Event("input");
const submitEvent = new Event("submit");

let form = document.querySelector("form");

let username = document.getElementById("username");

let password = document.getElementById("password");

username.value = usernameValue;
password.value = passwordValue;

username.dispatchEvent(inputEvent);
password.dispatchEvent(inputEvent);

form.dispatchEvent(submitEvent);
*/
