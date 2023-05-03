const express = require('express');
const app = express();
const port = 3000;
const htpp = require('http');
const server = htpp.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server)

app.get("/", (req,res) => {
    res.sendFile(__dirname + '/index.html')
})

let usersList = [];
io.on('connection', socket => {
    
    io.emit(console.log("user : ", socket.id, "has connected to the server"))
    socket.on("disconnect", () => {
        io.emit(console.log("user : ", socket.id, "was disconnected from the server"))
    });
    socket.on("sendmessage", (msg) => {
        let checkAvaiablity = usersList.find(users => users.socketId === socket.id);
        // all connected user except original sender should receive message
        if(checkAvaiablity === undefined) {
            socket.broadcast.emit("broadcastMessage",msg)
        } else {
            console.log("target usersList value : ", `${checkAvaiablity.username} : ${msg}`)
            socket.broadcast.emit("broadcastMessage", `${checkAvaiablity.username} : ${msg}`)
        }
    });

    socket.on("user-login", (user) => {
        let checkAvaiablity = usersList.find(users => users.socketId === socket.id);
        if(checkAvaiablity === undefined) {
            // console.log(checkAvaiablity)
            usersList.push({socketId: socket.id, username: user});
            socket.broadcast.emit("user_connect", `${user} was joined the chat room`);
            socket.emit("registeredUsername", user);
            // console.log(usersList)
        } else {
            // console.log("user list : ", usersList)
            socket.emit("already-registered", "you already registered an username")
            socket.emit("dataAtServer", usersList)
        }
    });

    // broadcasting user is typing to all connected users
    socket.on("userIsTypingText", text => {
        // console.log(text)
        socket.broadcast.emit("receiveUserTypingText", text)
    })
    
    
})


server.listen(port, console.log("server running at port : ", port))
