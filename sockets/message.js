
module.exports = socket => {
    socket.emit('message', { text : 'Welcome!' });
  };
  