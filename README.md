# racer-socket.io
A [Socket.io](http://socket.io/) transport for racer. Socket.io will
start a connection with ajax polling, and later upgrade to websockets
where possible.

## Usage
`racer-socket.io` needs your racer store, as well as your express
[cookieParser](cookie-parser) and [session](session) middlewares in
order to fetch your user's sessions:

```javascript
var racerSocketIo = require('racer-socket.io'),
  store = racer.createStore(),
  cookieParser = require('cookie-parser')(...),
  session = require('express-session')(...);

var attach = racerSocketIo(store, {
  cookieParser: cookieParser,
  session: session
});
```

Use the returned `attach` function to attach socket.io to your server:

```javascript
var server = http.createServer(expressApp);
attach(server);
```

[cookie-parser]: https://github.com/expressjs/cookie-parser
[session]: https://github.com/expressjs/session

## License
The MIT License (MIT)

Copyright (c) 2014 Decoded Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

