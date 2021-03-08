console.log("hello from the receiver script");

function preventBehavior(e) {
    e.preventDefault();
};

document.addEventListener("touchmove", preventBehavior, {
    passive: false
});

var socket;
let fullname = "";
let email = "";
let roomname = "";
let pw = "";
let cipher = "";
let data = {};

socket = io.connect();

document.querySelector("#createroom").onclick = () => {
    fullname = document.querySelector("#fullname").value;
    // email = document.querySelector("#email").value;
    roomname = document.querySelector("#roomname").value;
    pw = document.querySelector("#pw").value;
    // console.log(fullname, email, roomname, pw);
    cipher = CryptoJS.AES.encrypt(roomname, pw).toString();
    document.querySelector("#cipher").textContent = cipher;
    data = {
        fullname: fullname,
        email: email,
        roomname: roomname,
        cipher: cipher
    }
    socket.emit('receiver login', data);
    document.querySelector('#msg').textContent = "login successful";
    document.querySelector('#receive').style.display = "inline";
};

// document.querySelector("#ready").onclick = () => {
//     // console.log("ready is clicked");
//     let ready = true;
//     socket.emit('receiver ready', ready);
//     document.querySelector("#signingarea").style.display = 'inline-block';
//     document.querySelector("#ready_message").style.display = 'none';
//     // app name here
// }

// document.querySelector(".guess-btn").onclick = (e) => {
//     console.log("guess button is clicked");
//     console.log(e);
//     // let guest = e;
//     // socket.emit('allow user', ready);
//     document.querySelector("#signingarea").style.display = 'inline-block';
//     document.querySelector("#ready_message").style.display = 'none';
//     // app name here
// }

socket.on('enter', (res) => console.log(res));

socket.on('message', (res) => console.log(res));

socket.on('signer logged in', (res) => {
    if (res) {
        document.querySelector("#waiting_message").style.display = "none";

        // let div = document.createElement("div");
        // div.className = "guest";
        // div.id = `${res.fullname}${res.id}`;
        // let btn = document.createElement("a");
        // btn.className = "button is-pulled-right";
        // btn.textContent = "Allow";
        // let panel = document.createElement("a");

        // let inner = `<div class="guest" id="${res.fullname}${res.id}"><button value="${res.id}" class="button is-pulled-right guess-btn" onclick="allow(this)">Allow</button><a class="panel-block"><span class="panel-icon"><i class="fas fa-user" aria-hidden="true"></i></span>${res.fullname}</a></div>`;
        let inner = `<div class="guest" id="${res.id}">
                        <label class="panel-block">
                            <input type="checkbox" value="${res.id}" onchange="allow(this);">
                            ${res.fullname}
                        </label>
                    </div>`;

        document.querySelector("#guest-list").innerHTML += inner;
        document.querySelector("#signer_found").style.display = "inline";
    }
});

socket.on('signer logged out', (res) => {
    if (res) {
        console.log(`${res} has left the room`);
        document.getElementById(res).remove();
    }
});

function allow(e) {
    console.log(e.checked);
    if (e.checked) {
        socket.emit('allow user', e.value);
    }else{
        socket.emit('disable user', e.value);
    }
    document.querySelector("#signingarea").style.display = 'inline-block';
    document.querySelector("#ready_message").style.display = 'none';
}