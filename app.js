const mongoose = require('mongoose');
const keys = require('./config/keys');
const stoppable = require('stoppable');
const redisAdapter = require('socket.io-redis');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();

const server = stoppable(require('http').Server(app));
const io = require('socket.io')(server, {path: '/ws'});

app.use(bodyParser.json());

cache = require('./services/cache');

if (process.env.NODE_ENV !== 'test') {
  mongoose.Promise = global.Promise;
  const mongoUrl = `mongodb://${keys.mongoHost}:${keys.mongoPort}/${keys.mongoDbName}?authSource=admin`;
  const mongoOptions = {
    user: keys.mongoUsername,
    pass: keys.mongoPassword,
    useMongoClient: true
  }
  mongoose.connect(mongoUrl, mongoOptions);

  const redis = require('redis');
  const pub = redis.createClient({host:keys.redisHost, port:keys.redisPort, password: keys.redisPassword});
  const sub = redis.createClient({host:keys.redisHost, port:keys.redisPort, password: keys.redisPassword});
  io.adapter(redisAdapter({ pubClient: pub, subClient: sub }));

}else{
  mongoose.Promise = global.Promise;
  const Mockgoose = require('mockgoose').Mockgoose;
  const mockgoose = new Mockgoose(mongoose);
  
    mockgoose.prepareStorage().then(() => {
      mongoose.connect('mongodb://test.com/test');
      mongoose.connection.on('connected', () => {  
        console.log('db connection is now open');
      }); 
  });
  
  const redis = require("redis-mock");
  const pub = redis.createClient();
  const sub = redis.createClient();
  io.adapter(redisAdapter({ pubClient: pub, subClient: sub }));
}

require('./routes/authRoutes')(app);
require('./routes/blogRoutes')(app);
require('./routes/userRoutes')(app);

app.get('/healthcheck', function (req, res) {
  res.status(200).send('I am happy and healthy\n');
});

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', function onSigint () {
    console.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ', new Date().toISOString());
  shutdown();
});

// quit properly on docker stop
process.on('SIGTERM', function onSigterm () {
  console.info('Got SIGTERM (docker container stop). Graceful shutdown ', new Date().toISOString());
  shutdown();
})

// shut down server
function shutdown() {
  console.info('starting stoppable');
  server.stop(); // this might take a while depending on connections
  console.info('disconnect db');
  mongoose.disconnect();
  console.info('disconnect redis');
  cache.shutdown();
  //TODO socket.io graceful shutdown
  console.info('exiting');
  process.exit();
}

io.sockets.on('connection', function (socket) {
    console.info('a user connected');
    
    require('./sockets/message')(socket);
});

module.exports = server