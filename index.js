const keys = require('./config/keys');
const server = require('./app');

var port = keys.port;

server.listen(port, function () {
  var port = server.address().port;
  console.log('App running on port ' + port);
});
