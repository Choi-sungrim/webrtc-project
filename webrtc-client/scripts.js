const userName = "User-" + Math.floor(Math.random() * 1000);
const password = "x";
document.querySelector("#user-name").textContent = userName;
const localIp = "192.168.100.23";
const socket = io(`http://${localIp}:8181`, {
  auth: { userName, password },
  transports: ["websocket"],
  secure: false,
  rejectUnauthorized: false,
});
// DOM Elements
const localVideoEl = document.querySelector("#local-video");
const remoteVideoEl = document.querySelector("#remote-video");
const waitingEl = document.querySelector("#waiting");
// WebRTC Configuration
const peerConfiguration = {
  iceServers: [{ urls: "livekit.host.com", turn: "livekit.host-turn.com" }],
  iceTransportPolicy: "all",
};
// WebRTC Variables
let localStream;
let remoteStream;
let peerConnection;
let didIOffer = false;

// Core Functions
const startCall = async () => {
  try {
    await getLocalStream();
    await createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    didIOffer = true;
    socket.emit("newOffer", offer);
    waitingEl.style.display = "block";
  } catch (err) {
    console.error("Call error:", err);
  }
};
const answerCall = async (offerObj) => {
  try {
    await getLocalStream();
    await createPeerConnection(offerObj);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    // Get existing ICE candidates from server
    const offerIceCandidates = await new Promise((resolve) => {
      socket.emit(
        "newAnswer",
        {
          ...offerObj,
          answer,
          answererUserName: userName,
        },
        resolve
      );
    });
    // Add pre-existing ICE candidates
    offerIceCandidates.forEach((c) => {
      peerConnection
        .addIceCandidate(c)
        .catch((err) => console.error("Error adding ICE candidate:", err));
    });
  } catch (err) {
    console.error("Answer error:", err);
  }
};
const getLocalStream = async () => {
  const constraints = {
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideoEl.srcObject = localStream;
    localVideoEl.play().catch((e) => console.log("Video play error:", e));
  } catch (err) {
    alert("Camera error: " + err.message);
    throw err;
  }
};
const createPeerConnection = async (offerObj) => {
  peerConnection = new RTCPeerConnection(peerConfiguration);
  remoteStream = new MediaStream();
  remoteVideoEl.srcObject = remoteStream;
  // Add local tracks
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  // ICE Candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("sendIceCandidateToSignalingServer", {
        iceCandidate: event.candidate,
        iceUserName: userName,
        didIOffer,
      });
    }
  };
  // Track handling
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
        remoteStream.addTrack(track);
      }
    });
    waitingEl.style.display = "none";
  };
  // Connection state handling
  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);
    if (peerConnection.connectionState === "failed") {
      alert("Connection failed! Please try again.");
    }
  };
  // Set remote description if answering
  if (offerObj) {
    await peerConnection
      .setRemoteDescription(offerObj.offer)
      .catch((err) => console.error("setRemoteDescription error:", err));
  }
};
// Event Listeners
document.querySelector("#call").addEventListener("click", startCall);
