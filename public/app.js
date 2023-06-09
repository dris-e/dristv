const loginForm = document.getElementById('loginForm');
const login = document.getElementById('login');
const content = document.getElementById('content');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;
  
    try {
      const response = await fetch('/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        const { token } = await response.json();
        login.style.display = 'none';
        content.style.display = 'block';
        socket.auth = { token };
        socket.connect();
        initLiveStreaming();
      } else {
        alert('Invalid username or password.');
      }
    } catch (err) {
      console.error('Error during authentication', err);
    }
  });

const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const pc = new RTCPeerConnection(config);

pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('broadcast', { type: 'candidate', candidate: event.candidate });
  }
};

pc.onaddstream = (event) => {
  remoteVideo.srcObject = event.stream;
};

socket.on('broadcast', (data) => {
  switch (data.type) {
    case 'offer':
      pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      pc.createAnswer().then(answer => {
        pc.setLocalDescription(answer);
        socket.emit('broadcast', { type: 'answer', answer: answer });
      });
      break;
    case 'answer':
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      break;
    case 'candidate':
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
  }
});

function initLiveStreaming() {

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      socket.emit('broadcast', { type: 'offer', offer: offer });
    });
  }).catch(err => {
    console.error('Error accessing media devices.', err);
  });
  
}
