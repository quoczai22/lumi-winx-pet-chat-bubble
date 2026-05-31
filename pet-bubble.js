const bubble = document.querySelector("#petBubble");
const bubbleText = document.querySelector("#petBubbleText");
const textarea = document.querySelector("#assistantText");
const showButton = document.querySelector("#showBubble");
const voiceButton = document.querySelector("#voiceDemo");

let hideTimer = 0;
let typeTimer = 0;

const cuteReplies = [
  {
    test: /(lỗi|fail|failed|error|bug|không chạy|crash)/i,
    text: "Ơ hơi vấp xíu rùi, để tớ coi lại cho cậu nha."
  },
  {
    test: /(xong|done|hoàn tất|đã tạo|đã sửa|passed|pass)/i,
    text: "Xong rùi nè cậu, tớ để gọn gàng cho cậu rồi đó."
  },
  {
    test: /(cần|cho mình|cho tớ|thêm|hỏi|confirm|duyệt|approval)/i,
    text: "Cậu cho tớ thêm xíu manh mối nha?"
  },
  {
    test: /(kiểm tra|check|test|xem|đọc|tìm)/i,
    text: "Tớ xem liền cho cậu nha."
  },
  {
    test: /(tạo|làm|build|implement|sửa|fix)/i,
    text: "Tớ làm được nè, để tớ xử cho cậu nha."
  }
];

function compactText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/^mình\s+/i, "")
    .replace(/^tôi\s+/i, "")
    .trim();
}

function petBubbleTextFromAssistant(text) {
  const source = compactText(text);
  const matched = cuteReplies.find((reply) => reply.test.test(source));

  if (matched) {
    return matched.text;
  }

  if (source.length <= 42) {
    return source
      .replace(/\bbạn\b/gi, "cậu")
      .replace(/\bmình\b/gi, "tớ");
  }

  return "Tớ nghe cậu rùi nè, để tớ trả lời thật dễ thương nha.";
}

function typeIntoBubble(text) {
  window.clearTimeout(typeTimer);
  bubbleText.textContent = "";

  let index = 0;
  const chars = [...text];

  function tick() {
    bubbleText.textContent = chars.slice(0, index).join("");
    index += 1;

    if (index <= chars.length) {
      typeTimer = window.setTimeout(tick, 24);
    }
  }

  tick();
}

function showPetBubble(text, options = {}) {
  const petText = options.alreadyCute ? text : petBubbleTextFromAssistant(text);
  const duration = Math.max(2600, Math.min(7200, petText.length * 95));

  window.clearTimeout(hideTimer);
  bubble.classList.add("is-visible");
  typeIntoBubble(petText);

  hideTimer = window.setTimeout(() => {
    bubble.classList.remove("is-visible");
  }, duration);

  return petText;
}

function startVoiceDemo() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    showPetBubble("Trình duyệt này chưa nghe voice được á cậu.", { alreadyCute: true });
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "vi-VN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  showPetBubble("Tớ đang nghe cậu nè.", { alreadyCute: true });
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    textarea.value = `Bạn vừa nói: ${transcript}\nMình sẽ kiểm tra và trả lời cho bạn.`;
    showPetBubble("Tớ nghe rùi, để tớ xem cho cậu nha.", { alreadyCute: true });
  };

  recognition.onerror = () => {
    showPetBubble("Tớ chưa nghe rõ, cậu thử lại xíu nha?", { alreadyCute: true });
  };
}

showButton.addEventListener("click", () => showPetBubble(textarea.value));
voiceButton.addEventListener("click", startVoiceDemo);

window.petBubble = {
  show: showPetBubble,
  cuteText: petBubbleTextFromAssistant
};

showPetBubble("Tớ ở đây nè cậu, nói gì tớ hiện bubble cute cho nha.", {
  alreadyCute: true
});
