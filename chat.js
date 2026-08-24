const authPortal = document.getElementById('authPortal');
const chatRoom = document.getElementById('chatRoom');
const joinChatBtn = document.getElementById('joinChatBtn');
const userNameInput = document.getElementById('userNameInput');
const activeUserName = document.getElementById('activeUserName');
const chatMessageFeed = document.getElementById('chatMessageFeed');
const chatMessageInput = document.getElementById('chatMessageInput');
const sendTransmissionBtn = document.getElementById('sendTransmissionBtn');
const imageUpload = document.getElementById('imageUpload');
const statusMessage = document.getElementById('statusMessage');

let currentUser = { name: "", clientId: "" };
let realtimeChannel = null;

// Free Sandbox Dev API Key string connection token
const FREE_DEMO_KEY = "kKYmjQ.Sz-JLA:e5Y_xtxDOD6npPTFAnWa4CbD2O315FEtZrPzgeS-Nyc";

function attemptJoinChat() {
    const name = userNameInput.value.trim();

    if (!name) {
        alert("Please enter your name to log in.");
        return;
    }

    currentUser.name = name;
    currentUser.clientId = "user_" + Math.random().toString(36).substr(2, 9);

    initializeFreeRealtimeNetwork();
}

function initializeFreeRealtimeNetwork() {
    try {
        const ably = new Ably.Realtime({ key: FREE_DEMO_KEY, clientId: currentUser.clientId });
        realtimeChannel = ably.channels.get('single-global-cosmic-chat');

        // Listen for new chat text messages
        realtimeChannel.subscribe('message', (packet) => {
            const isSelf = packet.clientId === currentUser.clientId;
            renderMessage(packet.data.senderName, packet.data.textMessage, isSelf);
        });

        // Listen for cloud background adjustments triggered by others
        realtimeChannel.subscribe('global_theme_update', (packet) => {
            if (packet.clientId !== currentUser.clientId) {
                applyParsedThemeUpdate(packet.data.pColor, packet.data.sColor);
                statusMessage.textContent = `Theme updated by ${packet.data.byUser}`;
            }
        });

        activateChatInterface();
    } catch (err) {
        // Fallback interface entry if user runs offline
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

// Convert uploaded images to background colors
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
            const secondaryRGB = { r: pix[4], g: pix[5], b: pix[6] };

            applyParsedThemeUpdate(primaryRGB, secondaryRGB);
            statusMessage.textContent = "Theme Shared!";

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
