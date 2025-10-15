// Handle available offers
socket.on("availableOffers", (offers) => {
  console.log("Received available offers:", offers);
  createOfferElements(offers);
});
// Handle new incoming offers
socket.on("newOfferAwaiting", (offers) => {
  console.log("Received new offers awaiting:", offers);
  createOfferElements(offers);
});
// Handle answer responses
socket.on("answerResponse", (offerObj) => {
  console.log("Received answer response:", offerObj);
  peerConnection
    .setRemoteDescription(offerObj.answer)
    .catch((err) => console.error("setRemoteDescription failed:", err));
  waitingEl.style.display = "none";
});
// Handle ICE candidates
socket.on("receivedIceCandidateFromServer", (iceCandidate) => {
  console.log("Received ICE candidate:", iceCandidate);
  peerConnection
    .addIceCandidate(iceCandidate)
    .catch((err) => console.error("Error adding ICE candidate:", err));
});
// Handle existing ICE candidates
socket.on("existingIceCandidates", (candidates) => {
  console.log("Receiving existing ICE candidates:", candidates);
  candidates.forEach((c) => {
    peerConnection
      .addIceCandidate(c)
      .catch((err) =>
        console.error("Error adding existing ICE candidate:", err)
      );
  });
});
// Helper function to create offer buttons
function createOfferElements(offers) {
  const answerEl = document.querySelector("#answer");
  answerEl.innerHTML = ""; // Clear existing buttons
  offers.forEach((offer) => {
    const button = document.createElement("button");
    button.className = "btn btn-success";
    button.textContent = `Answer ${offer.offererUserName}`;
    button.onclick = () => answerCall(offer);
    answerEl.appendChild(button);
  });
}
