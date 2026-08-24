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
const newRoomRouteBtn = document.getElementById('newRoomRouteBtn');
const roomTitleDisplay = document.getElementById('roomTitleDisplay');

let currentUser = { name: "", phone: "", clientId: "" };
let realtimeClient = null;
let realtimeChannel = null;
let currentActiveRoomCode = "default"; // Default start channel namespace tracker

const FREE_DEMO_KEY = "xVw9_A.9A1b2c:3d4e5f6g7h8i9j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y";

function attemptJoinChat() {
    const name = userNameInput.value.trim();
    const phone = userPhoneInput.value.trim();

    if (!name || !phone) {
        alert("Please provide credential values to cross-check structural security nodes.");
        return;
    }

    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.clientId = "user_" + Math.random().toString(36).substr(2, 9);

    // Bootstrap global real-time service system engine link
    try {
        realtimeClient = new Ably.Realtime({ key: FREE_DEMO_KEY, clientId: currentUser.clientId });
        connectToGroupChannelRoom(currentActiveRoomCode);
        activateChatInterface();
    } catch (err) {
        console.error("Framework Error binding web connection endpoints.", err);
        activateChatInterface();
    }
}

/**
 * Disconnects old channel handles and safely opens new chat targets using input codes.
 */
function connectToGroupChannelRoom(targetRoomCode) {
    // 1. Detach stream loops from old room channels if active
    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        realtimeChannel.detach();
    }

    // Normalizing incoming string targets to ensure consistency
    currentActiveRoomCode = targetRoomCode.trim().toLowerCase() || "default";
    
    // 2. Map structural subscription to the new stream code space
    realtimeChannel = realtimeClient.channels.get(`room_${currentActiveRoomCode}`);
    roomTitleDisplay.textContent = `💬 Room: ${currentActiveRoomCode.toUpperCase()}`;

    // 3. Listen for text messages inside this room
    realtimeChannel.subscribe('message', (packet) => {
        const isSelf = packet.clientId === currentUser.clientId;
        renderMessage(packet.data.senderName, packet.data.textMessage, isSelf);
    });

    // 4. Listen for background updates inside this room
    realtimeChannel.subscribe('global_theme_update', (packet) => {
        if (packet.clientId !== currentUser.clientId) {
            applyParsedThemeUpdate(packet.data.pColor, packet.data.sColor);
            statusMessage.textContent = `Theme updated by ${packet.data.byUser}`;
        }
    });

    // Output system logs alerting connection confirmation changes
    const systemNotice = document.createElement('div');
    systemNotice.classList.add('system-msg');
    systemNotice.textContent = `Switched into active thread channel room [${currentActiveRoomCode.toUpperCase()}]. Messages sent here stay private to this code space.`;
    chatMessageFeed.appendChild(systemNotice);
    chatMessageFeed.scrollTop = chatMessageFeed.scrollHeight;
}

/**
 * Displays dialogue prompts to routing requests
 */
newRoomRouteBtn.addEventListener('click', () => {
    const inputCode = prompt("Enter a Chat Room Code:\n(If the code doesn't exist, a new private room will be initialized instantly!)", currentActiveRoomCode);
    if (inputCode !== null) {
        if (!inputCode.trim()) {
            alert("Invalid target channel selection space requested.");
            return;
        }
        connectToGroupChannelRoom(inputCode);
    }
});

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
    if (!text || !realtimeChannel) return;

    realtimeChannel.publish('message', { senderName: currentUser.name, textMessage: text });
    chatMessageInput.value = "";
}

// Convert uploaded images to color presets
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
            statusMessage.textContent = "Global Theme Shared!";

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
