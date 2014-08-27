var racer = require('racer'),
  io = require('socket.io-client');

function noop() {
  return null;
}

function Socket(options) {
  var self = this,
    socket = io(options.base || '/channel');

  this.socket = socket;

  self.onopen = self.onclose = self.onmessage = self.onerror = noop;
  self.readyState = Socket.CONNECTING;

  socket.on('connect', function(data) {
    self.readyState = Socket.OPEN;
    self.onopen();
  });

  socket.on('disconnect', function(data) {
    self.readyState = Socket.CLOSED;
    self.onclose();
  });

  socket.on('error', function() {
    self.readyState = Socket.CLOSED;
    self.onerror();
  });

  socket.on('reconnect', function() {
    self.readyState = Socket.OPEN;
    self.onopen();
  });

  socket.on('reconnecting', function() {
    self.readyState = Socket.CONNECTING;
    self.onopen();
  });

  socket.on('msg', function(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    self.onmessage({data: data});
  });
}

Socket.prototype.send = function(data) {
  this.socket.emit('msg', data);
};

Socket.prototype.open = function() {
  this.socket.connect();
};

Socket.prototype.close = function() {
  this.socket.disconnect();
};

Socket.prototype.canSendWhileConnecting = false;
Socket.prototype.canSendJSON = true;

Socket.CONNECTING = 0;
Socket.OPEN = 1;
Socket.CLOSING = 2;
Socket.CLOSED = 3;

racer.Model.prototype._createSocket = function() {
  return new Socket(JSON.parse('{{clientOptions}}'));
};
