const fs = require('fs');
const path = require('path');
const express = require('express');
const {
    emit
} = require('process');
const app = express();
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
// let socket = require('socket.io');
// let io = socket(server);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

app.use(express.static('public'));
app.use(express.json());

let users = [];
let rooms = [];

io.on('connection', socket => {
    console.log(`${socket.id} has joined`);
    // receiver logic
    socket.on("receiver login", (data) => {
        console.log("a receiver");

        //users and room management
        const user = {
            fullname: data.fullname,
            email: data.email,
            id: socket.id
        };
        socket.nickname = user.fullname;
        const room = {
            room: data.roomname,
            cipher: data.cipher
        }
        // console.log(user);
        // console.log(rooms);

        users.push(user);
        rooms.push(room);

        // join room
        socket.join(room.room);
        io.in(room.room).emit('enter', `${user.fullname} has joined ${room.room}`);
        
        // ready to let the signer sign
        // socket.on('receiver ready', (data) => { 
        //     console.log(`data is ${data}`);
        //     io.in(room.room).emit('receiver ready', true);
        // });
        socket.on('allow user', data =>{
            console.log(`allower user ${data}`);
            // io.in(room.room).emit('receiver ready', true);
            io.to(data).emit('receiver ready', true);
        })
        socket.on('disable user', data =>{
            console.log(`disable user ${data}`);
            // io.in(room.room).emit('receiver ready', true);
            io.to(data).emit('got disabled', true);
        })
    });

    // singer logic
    socket.on("signer login", (data) => {
        // console.log(data);
        // user management
        console.log("a signer");
        const user = {
            fullname: data.fullname,
            email: data.email,
            id: socket.id
        };
        socket.nickname = user.fullname;
        let room = {
            room: data.roomname
        }

        console.log(user);
        console.log(rooms);
        
        // login management
        let cipher;
        let targetRoomName;

        // find if the room the signer is looking for exists
        if (rooms.length > 0) {
            rooms.forEach(e => {
                if (e.room === room.room) {
                    targetRoomName = e.room;
                    cipher = e.cipher;
                    console.log("room exist");
                    // send cipher to the signer for decrypting
                    io.to(socket.id).emit("get cipher from server", cipher);
                } else {
                    console.log("room doesn't exist");
                    io.to(socket.id).emit('no room', true);
                }
            });
        } else {
            console.log("room, doesn't exist");
            io.to(socket.id).emit('no room', true);
        }

        // decryption success from the signer, allow signer to join the room
        socket.on("signer login success", logindata => {
            if(!users.some(u => u.id === user.id)){
                if (logindata.room === targetRoomName && logindata.cipher === cipher) {
                    users.push(user);
                    socket.join(targetRoomName);
                    console.log(`${user.fullname} joined`);
                    // io.in(targetRoomName).emit('enter', `${user.fullname} has joined ${targetRoomName}`);
                    // io.sockets.in(targetRoomName).emit('message', 'what is going on, party people?');
                    io.in(targetRoomName).emit('signer logged in', user);
    
                    // forward mouse activity from signer to receiver
                    socket.on('mousedown', (data) => {
                        console.log("pen down");
                        io.in(targetRoomName).emit('pendown', data);
                    });
                    socket.on('mouse', (data) => {
                        io.in(targetRoomName).emit('mouse', data);
                    });
                    socket.on('mouseup', (data) => {
                        console.log("pen up");
                        io.in(targetRoomName).emit('penup', data);
                    });
                }
            }else{
                console.log("signed in alread");
            }
        });
    });
});


io.on("connection", (socket) => {
    socket.on("disconnecting", (reason) => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                console.log(`user ${socket.id} has left ${room}`);
                socket.to(room).emit('signer logged out', socket.id);           
                // socket.to(room).emit(`user ${socket.id} has left ${room}`);
            }
        }
    });
});


// to static pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});


app.get("/signer", (req, res) => {
    res.sendFile(path.join(__dirname, "public/signer.html"));
});

app.get("/receiver", (req, res) => {
    res.sendFile(path.join(__dirname, "public/receiver.html"));
});

app.get("/draw", (req, res) => {
    res.sendFile(path.join(__dirname, "public/draw.html"));
});

// io.sockets.on('connection', newConnection);

// function newConnection(socket) {
//     console.log('new connection: ' + socket.id);
//     console.log(socket);
//     socket.on('mouse', mouseMsg);
// }

// function mouseMsg(data) {
//     // socket.broadcast.emit('mouse', data);
//     io.sockets.emit('mouse', data);
//     console.log(data);
// }

// app.listen(PORT, () => {
    //     console.log("Server listening at http://localhost:8080!")
// });