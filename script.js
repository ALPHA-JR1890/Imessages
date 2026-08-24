const authPortal = document.getElementById('authPortal');
const chatRoom = document.getElementById('chatRoom');
const joinChatBtn = document.getElementById('joinChatBtn');
const userNameInput = document.getElementById('userNameInput');
const userPhoneInput = document.getElementById('userPhoneInput');
const activeUserName = document.getElementById('activeUserName');
const chatMessageFeed = document.getElementById('chatMessageFeed');
const chatMessageInput = document.getElementById('chatMessageInput');
const sendTransmissionBtn = document.getElementById('sendTransmissionBtn');
const imageUpload = document.getElementById('imageUpload');
const statusMessage = document.getElementById('statusMessage');

let currentUser = { name: "", phone: "", clientId: "" };
let realtimeChannel = null;

// Built-in free developer keys cluster link mapping
const FREE_DEMO_KEY = "xVw9_A.9A1b2c:3d4e5f6g7h8i9j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y";

function attemptJoinChat() {
    const name = userNameInput.value.trim();
    const phone = userPhoneInput.value.trim();

    if (!name || !phone) {
        alert("Please provide credentials to initialize server handshake.");
        return;
    }

    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.clientId = "user_" + Math.random().toString(36).substr(2, 9);

    initializeFreeRealtimeNetwork();
}

function initializeFreeRealtimeNetwork() {
    try {
        const ably = new Ably.Realtime({ key: FREE_DEMO_KEY, clientId: currentUser.clientId });
        realtimeChannel = ably.channels.get('cosmic-global-relay-stream');

        // Listen for new chat text messages
        realtimeChannel.subscribe('message', (packet) => {
            const isSelf = packet.clientId === currentUser.clientId;
            renderMessage(packet.data.senderName, packet.data.textMessage, isSelf);
        });

        // Listen for cloud theme background changes triggered by other users
        realtimeChannel.subscribe('global_theme_update', (packet) => {
            if (packet.clientId !== currentUser.clientId) {
                applyParsedThemeUpdate(packet.data.pColor, packet.data.sColor);
                statusMessage.textContent = `Theme updated by ${packet.data.byUser}`;
            }
        });

        activateChatInterface();
    } catch (err) {
        activateChatInterface();
    }
}

function activateChatInterface() {
    activeUserName.textContent = currentUser.name;
    authPortal.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    chatMessageInput.focus();
}

function renderMessage(sender, text, isSelf = false) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('msg-wrapper', isSelf ? 'self' : 'others');

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = text;

    if (!isSelf) {
        const meta = document.createElement('div');
        meta.classList.add('msg-meta');
        meta.textContent = sender;
        wrapper.appendChild(meta);
    }

    wrapper.appendChild(bubble);
    chatMessageFeed.appendChild(wrapper);
    chatMessageFeed.scrollTop = chatMessageFeed.scrollHeight;
}

function sendTransmission() {
    const text = chatMessageInput.value.trim();
    if (!text) return;

    if (realtimeChannel) {
        realtimeChannel.publish('message', { senderName: currentUser.name, textMessage: text });
    }
    chatMessageInput.value = "";
}

// Read pixels from image files uploaded by users
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const hCanvas = document.createElement('canvas');
            const hCtx = hCanvas.getContext('2d');
            hCanvas.width = 10; hCanvas.height = 10;
            hCtx.drawImage(img, 0, 0, 10, 10);
            
            const pix = hCtx.getImageData(0, 0, 10, 10).data;
            const primaryRGB = { r: pix[0], g: pix[1], b: pix[2] };
            const secondaryRGB = { r: pix[12], g: pix[13], b: pix[14] };

            // 1. Update the background theme on your screen immediately
            applyParsedThemeUpdate(primaryRGB, secondaryRGB);
            statusMessage.textContent = "Global Theme Shared!";

            // 2. Broadcast the background colors to everyone else in the group chat
            if (realtimeChannel) {
                realtimeChannel.publish('global_theme_update', {
                    byUser: currentUser.name || "Anonymous",
                    pColor: primaryRGB,
                    sColor: secondaryRGB
                });
            }
        };
    };
    reader.readAsDataURL(file);
});

joinChatBtn.addEventListener('click', attemptJoinChat);
sendTransmissionBtn.addEventListener('click', sendTransmission);
chatMessageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendTransmission(); });
