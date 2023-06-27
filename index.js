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
let messageArchive = [];
io.on('connection', socket => {
    
    io.emit(console.log("user : ", socket.id, "has connected to the server"));
    socket.emit("firstLoginUserlist", usersList);
    socket.on("disconnect", () => {
        let indexOfDisconnectedUser = usersList.map(user => user).indexOf(socket.id)
        usersList.splice(indexOfDisconnectedUser, 1)
        
        console.log("user : ", socket.id, "was disconnected from the server");
        io.emit("newestUserlist", usersList);
    });

    // send msg to general room
    socket.on("sendmessage", (msg) => {
        // store msg
        messageArchive.push(msg)
        // remove conditional because user must login before they could send a message
        socket.to(msg.receiver).emit("privateMessage", msg)
    });

    // digunakan untuk menampilkan user list saat suatu user pertama kali terkonek dengan server
    // tanpa event ini, saat pertama kali konek, userlist box bakal terlihat kosong karena baik client-side maupun server-side, tidak memiliki fungsi yg akan mengirimkan data userlist pada client-side
    // sebagai contoh, text pada userlist box yg memiliki text/value berupa  "currently noone is connected" bakal hilang saat pertama kali client-side running di browser
    
    socket.on("user-login", (user) => {
        let checkAvaiablity = usersList.find(users => users.socketId === socket.id);
        if(checkAvaiablity === undefined) {
            usersList.push({socketId: socket.id, username: user});
            socket.broadcast.emit("user_connect", `${user} was joined the chat room`);
            socket.emit("registeredUsername", user);
            // io.emit allCurrentUser dimodif sehingga mengirimkan username dan socket.id
            io.emit("allCurrentUsers", usersList)
        } else {
            socket.emit("already-registered", "you already registered an username")
            socket.emit("dataAtServer", usersList)
        }
    });

    // broadcasting user is typing to all connected users
    socket.on("userIsTypingText", text => {
        // console.log(text)
        socket.broadcast.emit("receiveUserTypingText", text)
    })
    
    // when userlist got clicked
    socket.on("requestMsgHistory", (userlist) => {
        console.log("when userlist got clicked : ", userlist);
        // console.log("apakah ada id sender : ", messageArchive.some(msg => msg.sender === userlist))
        // kalo targeted user ada pada msg archive, kasih msg yg berhubungan dengan targeted user
        if(messageArchive.some(message => message.sender === userlist)) {
            socket.emit("messageHistory", messageArchive.filter(msg => msg.sender === userlist))    
        } else {
            return 
        }   
    })
})


server.listen(port, console.log("server running at port : ", port))
