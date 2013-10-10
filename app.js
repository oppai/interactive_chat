var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

app.listen(8001);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var clients = new Object();;
var new_id = 0;

function makeClient(){
  var client = {
    id:++new_id,
    x:0,y:0,
    img_num:0,
    timeout_count:300,
    hitpoint:100
  };

  return client;
};

io.sockets.on('connection', function (socket) {
  var c = makeClient();
  clients[c.id] = c;

  //初期化
  socket.emit('init',{id:c.id,clients:clients});
  socket.on('init', function (data) {
    clients[data.id].x = data.x;
    clients[data.id].y = data.y;
    clients[data.id].img_num = data.img_num;
    clients[data.id].hitpoint = data.hitpoint;

    socket.broadcast.emit('add',data);
  });

  //タイムアウト
  socket.on('timeout', function (data) {
    if(clients[data.id]){
      clients[data.id].timeout_count = 50;
    }
  });

  //移動
  socket.on('move', function (data) {
    clients[data.id].x = data.x;
    clients[data.id].y = data.y;
    socket.broadcast.emit('move',data);
  });

  //メッセージ
  socket.on('message', function (data) {
    socket.broadcast.emit('message',data);
  });

  //生存確認
  setInterval(function(){
    if(clients[c.id] && --clients[c.id].timeout_count < 0){
      console.log({id:c.id})
      socket.broadcast.emit('remove',{id:c.id});
      delete clients[c.id];
    }
  }, 100);
});

//debug
setInterval(function(){
  console.log(clients);
}, 1000);