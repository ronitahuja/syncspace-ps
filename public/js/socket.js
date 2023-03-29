let socket = io()
socket.on('connect', function () {
    console.log("connected ")
})
socket.on('disconnect', function () {
    console.log("disconnected")
})

document.querySelector('#submit-btn').addEventListener('click', function (e) {
    e.preventDefault()
    socket.emit('newmessage', {
        from: "user",
        text: document.querySelector('input[name="inputmsg"]').value,
    })
})

socket.on('newmessage', (message) => {
    // let li=document.createElement('li')
    // li.innerText=`${message.from}  ${message.text} ${message.time}`
    // document.querySelector('body').append(li)
    console.log(message.from)
    const template = document.querySelector("#msg-template").innerHTML;
    const html = ejs.render(template, {
        from: message.from,
        text: message.text,
        time: message.time,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    // document.querySelector('#messages').appendChild(div)
    socket.emit('printing', {
        from: message.from,
        text: message.text,
        time: message.time,
    })
})