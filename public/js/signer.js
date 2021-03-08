console.log("hello from the signer script");

function preventBehavior(e) {
    e.preventDefault(); 
};

document.addEventListener("touchmove", preventBehavior, {passive: false});

var socket;
let fullname = "";
let email = "";
let roomname = "";
let pw = "";
let cipher = "";
let data = {};
let logindata;

socket = io.connect();

document.querySelector("#joinroom").onclick = () => {
    fullname = document.querySelector("#fullname").value;
    // email = document.querySelector("#email").value;
    roomname = document.querySelector("#roomname").value;
    pw = document.querySelector("#pw").value;
    console.log(fullname, email, roomname, pw);
    cipher = CryptoJS.AES.encrypt(roomname, pw).toString();
    // document.querySelector("#cipher").textContent = cipher;
    data = {
        fullname: fullname,
        email: email,
        roomname: roomname
    }
    socket.emit('signer login', data);
    socket.on('no room', (res) => console.log(res));
    socket.on('get cipher from server', onReceiveCipher);
};



function onReceiveCipher(data){
    console.log(data);
    let ciphertext = data;
    // let logindata;
    bytes = CryptoJS.AES.decrypt(ciphertext, pw);
    originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (roomname === originalText) {
        logindata = {room: roomname, cipher: ciphertext};
        socket.emit("signer login success", logindata);
        document.querySelector("#msg").textContent = "login successful";
        document.querySelector("#sign").style.display = "inline";
        document.querySelector("#waiting_message").textContent = "Waiting for your host's approval to start drawing.";
    }else{
        document.querySelector("#msg").textContent = "wrong pw, try again";
    }
}

socket.on('enter', (res) => console.log(res));
socket.on('no room', (res) => {
    if(res){
        document.querySelector("#msg").textContent = `Room named "${roomname}" is not available yet, check your spellling.`;
    }
});
socket.on('message', (res) => console.log(res));

socket.on('receiver ready', (res) => {
    if(res){
        // display canvas
        document.querySelector("#signingarea").style.display = "inline";
        document.querySelector("#waiting_message").textContent = "Host is ready. Start drawing below";
        document.querySelector("#waiting_message").className = "notification is-success";
    }
});

socket.on('got disabled', (res) => {
    if(res){
        // display canvas
        document.querySelector("#signingarea").style.display = "none";
        document.querySelector("#waiting_message").textContent = "Waiting for your host's approval to start drawing.";
        document.querySelector("#waiting_message").className = "notification is-warning";
    }
});



// document.querySelector("#test").onclick = () => {
//     console.log("test button pressed");
//     socket.emit("test", "hi");
// };