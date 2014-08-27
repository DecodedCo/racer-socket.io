var Duplex = require('stream').Duplex,
  EventEmitter = require('events').EventEmitter,
  through = require('through'),
  path = require('path'),
  io = require('socket.io');

function getClient(socket) {
  var client = new EventEmitter();

  client.send = function(data) {
    socket.emit('msg', data);
  };

  socket.on('msg', function(data) {
    client.emit('message', data);
  });

  socket.on('disconnect', function() {
    client.state = 'closed';
    client.emit('close');
  });

  return client;
}

function createStream(client, logger) {
  var stream = new Duplex({objectMode: true});

  stream._write = function _write(chunk, encoding, cb) {
    // Drop messages when session closed;
    if (client.state !== 'closed') {
      client.send(chunk);

      if (logger) {
        logger.write({type: 'S->C', chunk: chunk, client: client});
      }
    }

    cb();
  };

  stream._read = function() { return null; };

  stream.on('error', function onError() {
    client.stop();
  });

  client.on('message', function onMessage(data) {
    if (data && data.racer) {
      return;
    }

    stream.push(data);

    if (logger) {
      logger.write({type: 'C->S', chunk: data, client: client});
    }
  });

  client.on('close', function() {
    stream.end();
    stream.emit('close');
    stream.emit('end');
    stream.emit('finish');
  });

  return stream;
}

function loadSession(cookieParser, sessionStore, sid) {
  return function(data, callback) {
    if (!data.headers.cookie) {
      return callback('No cookie', false);
    }

    // Parse the cookie:
    cookieParser(data, {}, function(err) {
      if (err) {
        return callback('Error parsing cookies', false);
      }

      var sidCookie = (data.secureCookies && data.secureCookies[sid]) ||
                      (data.signedCookies && data.signedCookies[sid]) ||
                      (data.cookies && data.cookies[sid]);

      sessionStore.load(sidCookie, function(err, session) {
        if (err) {
          return callback('Error loading session', false);
        }

        data.session = session;
        callback(null, true);
      });
    });
  };
}

module.exports = function(store, serverOptions, clientOptions) {
  var options = serverOptions || {};

  clientOptions = clientOptions || {};
  clientOptions.base = clientOptions.base || options.base || '/channel';

  store.on('bundle', function(bundle) {
    var browserFilename = path.join(__dirname, 'browser.js');
    bundle.transform(function(filename) {
      if (filename !== browserFilename) {
        return through();
      }
      var file = '';
      return through(function write(data) {
        file += data;
      }, function end() {
        this.queue(file.replace('{{clientOptions}}', JSON.stringify(clientOptions)));
        this.queue(null);
      });
    });

    bundle.add(path.join(__dirname, 'browser.js'));
  });

  return function attach(server) {
    var socket = io(server),
      channel = socket.of(options.base || '/channel');

    // Use the socket.io auth hook for pulling out the session
    socket.set('authorization', loadSession(options.cookieParser, options.sessionStore, options.expressSessionId || 'express.sid'));

    channel.on('connection', function(socket) {
      var client = getClient(socket),
        rejected = false,
        stream, agent;

      function reject() {
        rejected = true;
      }

      store.emit('client', client, reject);
      if (rejected) {
        store.disconnect();
      }

      stream = createStream(client, store.logger);
      agent = store.shareClient.listen(stream, socket.handshake);
      store.emit('share agent', agent, stream);
    });
  };
};
