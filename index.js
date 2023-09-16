const express = require('express');
const http = require('http')
const app = express();
const server = http.createServer(app)
const socketio = require('socket.io')
const io = socketio(server)
const multer = require('multer')
const bodyParser = require('body-parser')
const model = require("./modules/login-info");
const teacher_model = require("./modules/teacher-uploads")
const path = require('path');
const moment = require('moment')
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true
});
app.use('/peerjs', peerServer)
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs');
app.set('views', 'personal projects/virtual reality/public/views')
app.use('/uploads',express.static(__dirname+'/uploads'))

const port = 3000;

console.log(__dirname)

let from1, text1, time1
let logindata
io.on('connect', (socket) => {
    socket.on('newmessage', (message) => {
        let time = moment().valueOf()
        time = moment(time).format('LT')
        io.emit('newmessage', {
            from: message.from,
            text: message.text,
            time: time
        })
    })
    io.on('printing', (message) => {
        from1 = message.from,
            text1 = message.text,
            time1 = message.time
    })
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(() => {
            socket.to(roomId).emit("user-connected", userId);
        }, 1000)
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
})

model.find({}, (err, data) => {
    if (err) throw err
    else {
        logindata = data
    }
})


// allocating storage for uploaded docs

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, __dirname + '/uploads')
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({
    storage: storage,
})

// getting login page

app.get('/', async (req, res) => {
    res.render('login')
})

// login page data getting posted

app.post('/', async (req, res) => {
    var details = new model({
        name: (req.body.name).toLowerCase(),
        password: req.body.password,
    })
    try {
        const user = await model.findOne({ name: details.name });
        if (user.password == details.password && user.role == "student") {
            res.redirect('/student/' + details.name)
        }
        else if (user.password == details.password && user.role == "teacher") {
            res.redirect('/teacher/' + details.name)
        }
        else {
            res.send("wrong info")
        }
    }
    catch (err) {
        res.redirect('/signup')
    }
})

// getting signup page

app.get('/signup', (req, res) => {
    res.render('login')
})

// signup page data gtting posted

app.post('/signup', async (req, res) => {
    var details = new model({
        name: (req.body.name1).toLowerCase(),
        email: req.body.email,
        role: (req.body.role).toLowerCase(),
        password: req.body.password1,
    })
    if (details.role == "teacher" || details.role == "student") {
        const user = await model.findOneAndDelete({ email: details.email });
        details.save(res.render('login'))
    }
    else {
        res.send("Enter correct role")
    }
})

// uploading docs

app.post('/uploads/:name?', upload.single("document"), (req, res) => {
    const file1 = req.file.filename
    const name = req.params.name
    var details = new teacher_model({
        name: name,
        image: file1,
    })
    details.save((err, data) => {
        if (err) throw err
        else {
            res.redirect(302, '/teacher/' + name)
        }
    })
})

// opening teachers dashboard

app.get('/teacher/:name?', async (req, res) => {
    let details = await model.findOne({ name: req.params.name, role: "teacher" })

    if (details) {
        await teacher_model.find({ name: req.params.name }, (err, data) => {
            if (err) throw err
            else {
                let name = details.name
                name1 = name.charAt(0).toUpperCase() + name.slice(1);
                res.render('teacher-dashboard', {
                    teachername: name1,//big
                    teacherrole: "Teacher",
                    teacheremail: details.email,
                    teachername1: name,//small
                    name1: name,
                    rows: data,//images data of particular teacher
                    rows2: logindata
                })
            }
        }).clone().catch(function (err) { console.log(err) })
    }
    else {
        res.redirect('/')
    }
})

// opening students dashboard

app.get('/student/:name?', async (req, res) => {
    let details = await model.findOne({ name: req.params.name, role: "student" })

    if (details) {
        await teacher_model.find({}, (err, data) => {
            if (err) throw err
            else {
                let name = req.params.name
                name1 = name.charAt(0).toUpperCase() + name.slice(1);
                res.render('student-dashboard', {
                    studentname: name1,//big
                    studentrole: "Student",
                    studentemail: details.email,
                    studentname1: name,//small
                    name1: name,
                    rows: data//images data of particular teacher
                })
            }
        }).clone().catch(function (err) { console.log(err) })
    }
    else {
        res.redirect('/')
    }
})


app.get('/delete/:name?/:filenme?', (req, res) => {
    var details = teacher_model.findOneAndRemove({ name: req.params.name, image: req.params.filenme }, (err) => {
        if (err) throw err
        else {
            res.redirect(302, '/teacher/' + req.params.name)
        }
    })
})

app.get('/contact/:name?', (req, res) => {
    model.findOne({ name: req.params.name }, (err, data) => {
        if (err) throw err
        else {
            let name = req.params.name
            name1 = name.charAt(0).toUpperCase() + name.slice(1);
            res.render('pages-contact', {
                contname: name1,//big
                controle: data.role,
                contmail: data.email,
                name1: name,
                rows2: logindata,
                from: from1,
                text: text1,
                time: time1,
            })
        }
    })
})

app.post('/contact/:name?', (req, res) => {
    res.send("done")
})

app.get('/videocall/:room', (req, res) => {
    res.render('room', {
        roomId: req.params.room,
    })
})

app.get('/videocall', (req, res) => {
    res.redirect(`/videocall/${uuidv4()}`)
})

server.listen(port, () => {
    console.log(`app listen at port http://localhost:${port}`)
})