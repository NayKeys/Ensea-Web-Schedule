import { Server } from 'socket.io'
import loadScheduleDataFromString from '../../components/LoadScheduleData'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    io.on('connection', function(socket) {
    
      console.log('Client connected to socket { %s }', socket.id); // x8WIv7-mJelg7on_ALbx
    
      socket.conn.once("upgrade", () => {
          // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
      });
    
      socket.conn.on("packet", ({ type, data }) => {
          // called for each packet received
          console.log('packet recieved type: %s, data: %s', type, data)
          if (data.includes('uwu-ade-weekly-shcedule')) {
            loadScheduleDataFromString(data)
          }
          io.emit('data was loaded correctly. %s', msg);
      });
    
      socket.conn.on("packetCreate", ({ type, data }) => {
          // called for each packet sent
      });
    
      socket.conn.on("drain", () => {
          // called when the write buffer is drained
      });
    
      socket.conn.on("close", (reason) => {
          // called when the underlying connection is closed
      });
      socket.on('disconnect', () => {
          console.log('Client disconnected');
      });
    
      socket.on('chat message', function(msg) {
          console.log("Received a chat message");
          console.log(msg)
          io.emit(msg);
      });
    })
  }
  res.end()
}


export default SocketHandler