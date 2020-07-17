const Koa = require('koa')
const app = new Koa()
const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

io.use((socket, next) => {
  let room = socket.handshake.query.room
  if (room) {
    return next()
  }
  return next(new Error('authentication error'))
})

io.on('connection', (client) => {
  console.log('******************', client.id)
  const room = client.handshake.query.room
  const clientsInRoom = io.sockets.adapter.rooms[room]
  const numClients = clientsInRoom
    ? Object.keys(clientsInRoom.sockets).length
    : 0 //房间里的人数

  if (numClients < 2) {
    client.join(room, () => {
      let rooms = Object.keys(client.rooms)
      console.log(rooms) // [ <socket.id>, 'room 237' ]
      io.to(client.id).emit('priority', numClients + 1 )
      io.to(room).emit(
        'broadcast',
        {msg: `a new user has joined the room, 现在房间${numClients + 1}个人`, count: numClients + 1 }
      ) // broadcast to everyone in the room
    })
  } else {
    io.to(room).emit('full', '房间已满')
  }

  client.on('disconnect', () => {
    console.log('用户已经下车!')
  })
})

app.use(async (ctx) => {
  ctx.body = 'Hello World'
})

server.listen(3000)
