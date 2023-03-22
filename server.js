const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(express.static('public'));

require('dotenv').config();

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// Hash the password
const hashedPassword = bcrypt.hashSync(PASSWORD, 10);

app.post('/authenticate', (req, res) => {
  const { username, password } = req.body;

  if (username === USERNAME && bcrypt.compareSync(password, hashedPassword)) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.decoded = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  socket.on('broadcast', (data) => {
    socket.broadcast.emit('broadcast', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


