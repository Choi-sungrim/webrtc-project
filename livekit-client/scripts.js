// scripts.js
import {
  Room,
  RoomEvent,
  VideoPresets,
  createLocalTracks,
} from "livekit-client";

// =========================================================
// 1. 설정 및 변수
// =========================================================
// const LIVEKIT_URL = "wss://webrtctest-hdcsqoeo.livekit.cloud"; // cloudService
const LIVEKIT_URL = "http://127.0.0.1:7880";
const NESTJS_BASE_URL = "https://192.168.100.56:8181";

const userName = "User-" + Math.floor(Math.random() * 1000);

// DOM 요소를 담을 변수 (DOMContentLoaded에서 초기화)
let waitingEl;
let messageContainerEl, messageInput, sendButton;
let tracksContainerEl;

// LiveKit Room 객체
let room;

// =========================================================
// 2. 핵심 함수: LiveKit 연결 및 미디어/데이터 관리
// =========================================================

const fetchAccessToken = async (roomName) => {
  const url = `${NESTJS_BASE_URL}/livekit/token?room=${roomName}&username=${userName}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    if (data.token) {
      return data.token;
    }
    throw new Error(data.error || "토큰 획득 실패");
  } catch (error) {
    console.error("토큰 획득 오류:", error);
    alert(
      "액세스 토큰을 가져오는 데 실패했습니다. NestJS 서버 주소와 포트를 확인하세요."
    );
    throw error;
  }
};

/**
 * LiveKit 룸에 연결하고 미디어를 퍼블리싱합니다.
 */
async function startCall(roomName) {
  try {
    waitingEl.textContent = "액세스 토큰을 가져오는 중...";

    // 1. 토큰 획득
    const token = await fetchAccessToken(roomName);

    // 2. Room 객체 생성 및 리스너 설정
    room = new Room();
    setupRoomListeners(room);

    waitingEl.textContent = "LiveKit Room에 연결 중...";

    // 3. Room 연결
    await room.connect(LIVEKIT_URL, token);
    console.log("LiveKit Room에 연결되었습니다:", room.name);

    waitingEl.textContent = "로컬 미디어를 퍼블리싱하는 중...";

    // 4. 로컬 미디어 트랙 생성 및 퍼블리싱
    await publishLocalMedia(room);

    waitingEl.textContent = "다른 참가자를 기다리는 중...";
  } catch (err) {
    console.error("LiveKit 연결 오류:", err);
    alert("LiveKit 연결 중 오류가 발생했습니다: " + err.message);
    if (room) {
      room.disconnect();
    }
    waitingEl.textContent = "연결 실패. 콘솔을 확인하세요.";
  }
}

const publishLocalMedia = async (room) => {
  try {
    const tracks = await createLocalTracks({
      audio: true,
      video: {
        facingMode: "user",
        ...VideoPresets.h720,
      },
    });

    for (const track of tracks) {
      attachTrackToParticipantBox(track, room.localParticipant);

      await room.localParticipant.publishTrack(track);
      console.log("로컬 트랙 퍼블리싱 완료:", track.kind);
    }
  } catch (e) {
    alert("카메라/마이크 접근 권한이 필요합니다: " + e.message);
    throw e;
  }
};

/**
 * LiveKit Room을 통해 데이터를 전송합니다.
 * @param {string} message 전송할 텍스트 메시지
 */
const sendDataMessage = (message) => {
  if (!room || room.state !== "connected") {
    console.warn("Room에 연결되어 있지 않아 데이터를 보낼 수 없습니다.");
    return;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // Reliable: true (데이터 전송 보장)
  room.localParticipant
    .publishData(data, {
      kind: "reliable",
    })
    .catch((e) => {
      console.error("데이터 전송 실패:", e);
    });

  displayMessage(`나: ${message}`, "local");
};

/**
 * 메시지를 UI에 표시하는 헬퍼 함수
 */
const displayMessage = (text, type) => {
  if (!messageContainerEl) return;

  const p = document.createElement("p");
  p.textContent = text;
  // Bootstrap 클래스를 사용하여 메시지 정렬
  p.className = `my-1 p-1 rounded ${
    type === "local"
      ? "text-end bg-primary text-white"
      : "text-start bg-light text-dark"
  }`;
  messageContainerEl.appendChild(p);
  // 스크롤을 최신 메시지로 이동
  messageContainerEl.scrollTop = messageContainerEl.scrollHeight;
};

/**
 * LiveKit Room 이벤트 리스너를 설정합니다.
 */
const setupRoomListeners = (room) => {
  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    console.log(`트랙 구독됨: ${track.kind} from ${participant.identity}`);
    attachTrackToParticipantBox(track, participant);
  });

  room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
    console.log(`트랙 구독 해제됨: ${track.kind} from ${participant.identity}`);
    detachTrackFromParticipantBox(track, participant);
  });

  room.on(RoomEvent.DataReceived, (payload, participant) => {
    const decoder = new TextDecoder();
    const message = decoder.decode(payload);

    console.log(`[DATA] ${participant.identity}로부터 메시지 수신: ${message}`);
    displayMessage(`${participant.identity}: ${message}`, "remote");
  });

  room.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log(`새 참가자 입장: ${participant.identity}`);
    waitingEl.textContent = `새 참가자(${participant.identity}) 입장! 미디어를 기다리는 중...`;
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    console.log(`참가자 퇴장: ${participant.identity}`);
    const box = document.getElementById(`participant-${participant.identity}`);
    if (box) {
      box.remove();
    }
    waitingEl.textContent = "다른 참가자를 기다리는 중...";
  });

  room.on(RoomEvent.Disconnected, () => {
    console.log("LiveKit Room에서 연결 해제됨");
    alert("LiveKit 연결이 종료되었습니다.");
    waitingEl.textContent = "연결 해제됨";
  });

  room.on(RoomEvent.Connected, () => {
    console.log("LiveKit Room 연결 완료 및 기존 참가자 확인 시작");

    // 1. ⭐️ 로컬 참가자 트랙 처리 (안전한 순회) ⭐️
    const localParticipant = room.localParticipant;

    if (localParticipant && localParticipant.publishedTracks) {
      // publishedTracks는 Map 객체이므로 values()를 사용하여 순회
      for (const pub of localParticipant.publishedTracks.values()) {
        if (pub.track) {
          // localParticipant도 attachTrackToParticipantBox를 통해 화면에 추가
          attachTrackToParticipantBox(pub.track, localParticipant);
        }
      }
    }

    // 2. ⭐️ 리모트 참가자 Map 순회 (안전한 순회) ⭐️
    // room.participants가 Map 객체이고 values() 메서드가 있는지 확인
    if (room.participants && typeof room.participants.values === "function") {
      for (const p of room.participants.values()) {
        if (
          p.publishedTracks &&
          typeof p.publishedTracks.values === "function"
        ) {
          for (const pub of p.publishedTracks.values()) {
            if (pub.track) {
              attachTrackToParticipantBox(pub.track, p);
            }
          }
        }
      }
    }
  });
};

// =========================================================
// 3. 이벤트 리스너 및 초기화 (DOMContentLoaded 내부에서 실행)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. DOM Elements 변수 초기화 (전역 변수로 사용되는 요소 포함)
  // *전역 변수(예: localVideoEl)는 이미 파일 상단에 정의되어 있다고 가정합니다.*
  const userNameEl = document.querySelector("#user-name");

  // ⭐️ LiveKit 통화 UI 요소 (전역 변수에 할당) ⭐️
  waitingEl = document.querySelector("#waiting");
  tracksContainerEl = document.querySelector("#participant-tracks-container");

  messageContainerEl = document.querySelector("#messages-container");
  messageInput = document.querySelector("#message-input");
  sendButton = document.querySelector("#send-message");

  // ⭐️ 룸 관리 UI 요소 (지역 변수로 정의) ⭐️
  const listRoomsBtn = document.querySelector("#list-rooms-btn");
  const joinRoomBtn = document.querySelector("#join-room-btn");
  const roomListUl = document.querySelector("#room-list");
  const joinRoomNameInput = document.querySelector("#join-room-name");
  const statusMessage = document.querySelector("#status-message");

  // 통화 화면 표시 제어용 섹션
  const roomManagementSection = document.querySelector(
    "#room-management-section"
  );
  const callActiveSection = document.querySelector("#call-active-section");

  // 2. UI 초기 설정 (이전에 오류가 발생했던 부분)
  if (userNameEl) {
    userNameEl.textContent = `사용자: ${userName}`;
  }

  // 3. 룸 관리 로직 함수 정의

  // 룸 참여 로직
  async function handleJoinRoom(roomNameFromClick = null) {
    const roomName = roomNameFromClick || joinRoomNameInput.value.trim();
    if (!roomName) {
      statusMessage.textContent = "참여할 방 이름을 입력해 주세요.";
      return;
    }

    // UI 상태 업데이트
    joinRoomBtn.disabled = true;
    listRoomsBtn.disabled = true;
    statusMessage.textContent = `"${roomName}" 룸 연결 중...`;

    try {
      await startCall(roomName); // ⭐️ startCall 함수는 이제 roomName을 인수로 받습니다. ⭐️

      statusMessage.textContent = `"${roomName}" 룸에 성공적으로 연결되었습니다.`;

      // UI 전환: 룸 관리 숨김, 통화 화면 표시
      roomManagementSection.style.display = "none";
      callActiveSection.style.display = "block";

      // 연결 성공 후 사용자 이름 업데이트
      userNameEl.textContent = `사용자: ${userName} (방: ${roomName})`;
    } catch (error) {
      console.error("연결 실패:", error);
      statusMessage.textContent = `연결 실패: ${error.message}`;

      // 실패 시 버튼 활성화
      joinRoomBtn.disabled = false;
      listRoomsBtn.disabled = false;
    }
  }

  // 룸 목록 조회 및 표시 함수
  async function listAndDisplayRooms() {
    roomListUl.innerHTML =
      '<li class="list-group-item text-center">로딩 중...</li>';
    listRoomsBtn.disabled = true;

    try {
      const response = await fetch(`${NESTJS_BASE_URL}/livekit/rooms`);
      const rooms = await response.json();
      console.log(rooms);
      console.log(rooms.length);

      roomListUl.innerHTML = "";
      if (rooms.length === 0) {
        roomListUl.innerHTML =
          '<li class="list-group-item text-muted">현재 활성화된 룸이 없습니다.</li>';
        return;
      }

      rooms.forEach((room) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            ${room.name} (${room.numParticipants}명)
            <button class="btn btn-sm btn-primary" data-room-name="${room.name}">참가</button>
        `;

        // 룸 이름 버튼을 클릭하면 해당 룸에 참여
        li.querySelector("button").addEventListener("click", (e) => {
          handleJoinRoom(e.target.dataset.roomName);
        });
        roomListUl.appendChild(li);
      });
    } catch (error) {
      console.error("룸 목록 조회 실패:", error);
      roomListUl.innerHTML = `<li class="list-group-item list-group-item-danger">룸 목록 조회에 실패했습니다: ${error.message}</li>`;
    } finally {
      listRoomsBtn.disabled = false;
    }
  }

  // 4. 이벤트 리스너 설정 (새로 찾은 지역 변수를 사용)

  if (listRoomsBtn) {
    listRoomsBtn.addEventListener("click", listAndDisplayRooms);
  }

  if (joinRoomBtn) {
    // 입력 필드 버튼 클릭 시 로직
    joinRoomBtn.addEventListener("click", () => {
      handleJoinRoom(); // 인자 없이 호출하면 input 값을 사용
    });
  }

  // 5. 데이터 전송 리스너 설정 (기존 로직 유지)
  if (sendButton && messageInput) {
    const sendMessageHandler = () => {
      const message = messageInput.value.trim();
      // room 변수는 파일 상단에 전역으로 정의되어 있다고 가정합니다.
      if (message && room && room.state === "connected") {
        sendDataMessage(message);
        messageInput.value = "";
      } else if (!room || room.state !== "connected") {
        alert("연결된 상태에서만 메시지를 보낼 수 있습니다.");
      }
    };

    sendButton.addEventListener("click", sendMessageHandler);
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // 기본 폼 제출 방지
        sendMessageHandler();
      }
    });
  }

  // ⭐️ 초기 룸 목록 조회 (페이지 로드 시) ⭐️
  listAndDisplayRooms();
});

/** 트랙을 DOM 요소와 참가자 이름 오버레이를 포함한 새 박스에 연결합니다. */
function attachTrackToParticipantBox(track, participant) {
  // 1. 해당 참가자의 기존 박스를 찾거나 새로 생성
  let box = document.getElementById(`participant-${participant.identity}`);
  if (!box) {
    box = document.createElement("div");
    box.id = `participant-${participant.identity}`;
    box.className = "participant-box";

    // 2. 사용자 이름 오버레이 추가
    const nameOverlay = document.createElement("div");
    nameOverlay.className = "participant-name-overlay";
    nameOverlay.textContent = participant.identity;

    box.appendChild(nameOverlay);
    // tracksContainerEl 변수는 전역에 정의되어 있어야 합니다.
    tracksContainerEl.appendChild(box);
  }

  // 3. 트랙을 박스에 연결
  const mediaEl = track.attach();
  box.appendChild(mediaEl);

  if (participant.isLocal) {
    mediaEl.muted = true;
  }

  if (waitingEl) waitingEl.style.display = "none";
}

/** 트랙을 DOM에서 제거하고, 참가자의 박스에 트랙이 남아있지 않으면 박스 전체를 제거합니다. */
function detachTrackFromParticipantBox(track, participant) {
  const box = document.getElementById(`participant-${participant.identity}`);
  if (!box) return;

  track.detach().forEach((el) => el.remove());

  // 트랙 제거 후, 해당 참가자에게 다른 트랙이 남아있는지 확인
  const hasRemainingTracks = participant.getTracks().some((pub) => pub.track);

  if (!hasRemainingTracks) {
    box.remove();
  }

  // 모든 참가자가 나갔는지 확인하여 #waiting 메시지 다시 표시
  if (
    room &&
    room.participants.size === 0 &&
    !room.localParticipant.isPublishing
  ) {
    if (waitingEl) waitingEl.style.display = "block";
  }
}
