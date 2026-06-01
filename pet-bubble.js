const bubble = document.querySelector("#petBubble");
const bubbleText = document.querySelector("#petBubbleText");
const textarea = document.querySelector("#assistantText");
const questionText = document.querySelector("#questionText");
const askButton = document.querySelector("#askPaaraket");
const voiceButton = document.querySelector("#voiceDemo");
const ollamaEndpoint = "http://localhost:11434/api/generate";
const ollamaModel = "llama3.2:3b";

let hideTimer = 0;
let typeTimer = 0;
let trainingData = [];

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

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "can",
    "do",
    "does",
    "how",
    "i",
    "in",
    "is",
    "it",
    "of",
    "or",
    "the",
    "to",
    "use",
    "what",
    "when",
    "why",
    "you"
  ]);

  return normalizeText(text)
    .split(" ")
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

function similarityScore(left, right) {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.sqrt(leftTokens.size * rightTokens.size);
}

function findBestTrainingAnswer(question) {
  let best = { entry: null, score: 0, matchedQuestion: "" };

  for (const entry of trainingData) {
    for (const candidate of entry.questions) {
      const score = similarityScore(question, candidate);
      if (score > best.score) {
        best = { entry, score, matchedQuestion: candidate };
      }
    }
  }

  return best;
}

function cuteAnswerForTraining(match) {
  if (!match.entry || match.score < 0.28) {
    return "Câu này tớ chưa được học kỹ á cậu, cho tớ thêm dữ liệu nha?";
  }

  if (match.score > 0.72) {
    return "Tớ biết câu này nè cậu, nghe tớ trả lời nha.";
  }

  return "Câu này giống bài tớ học rùi, tớ thử trả lời nha.";
}

function selectedAnswerMode() {
  return document.querySelector('input[name="answerMode"]:checked')?.value || "ollama";
}

function buildOllamaPrompt(question) {
  return [
    "You are Paaraket AI, a fast friendly English learning assistant.",
    "Answer the user's English question clearly and briefly.",
    "Prefer practical explanations and examples.",
    "If the question is not about English, programming, interviews, or learning, still answer helpfully but keep it concise.",
    "",
    `Question: ${question}`,
    "",
    "Answer:"
  ].join("\n");
}

function petBubbleTextForAiAnswer(answer) {
  if (/i do not know|not sure|cannot/i.test(answer)) {
    return "Câu này hơi khó xíu, tớ nghĩ thêm cho cậu nha.";
  }

  if (answer.length < 120) {
    return "Tớ trả lời được nè cậu, đọc phần bên cạnh nha.";
  }

  return "Tớ có câu trả lời rồi nè cậu, gọn mà đủ ý luôn á.";
}

async function askOllama(question) {
  const response = await fetch(ollamaEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: ollamaModel,
      prompt: buildOllamaPrompt(question),
      stream: false,
      options: {
        temperature: 0.25,
        num_predict: 180
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`);
  }

  const data = await response.json();
  return (data.response || "").trim();
}

async function loadTrainingData() {
  try {
    const response = await fetch("./training-data.json", { cache: "no-store" });
    trainingData = await response.json();
  } catch {
    trainingData = [];
    textarea.value = "Training data could not be loaded. If you opened this as a local file, try using the GitHub Pages URL.";
  }
}

async function askPaaraket() {
  if (trainingData.length === 0) {
    await loadTrainingData();
  }

  const question = questionText.value.trim();
  if (!question) {
    showPetBubble("Cậu hỏi tớ một câu tiếng Anh đi nè.", { alreadyCute: true });
    return;
  }

  if (selectedAnswerMode() === "ollama") {
    showPetBubble("Tớ hỏi Ollama liền cho cậu nha.", { alreadyCute: true });
    textarea.value = "Thinking with local Ollama...";

    try {
      const answer = await askOllama(question);
      textarea.value = answer || "Ollama did not return an answer.";
      showPetBubble(petBubbleTextForAiAnswer(answer), { alreadyCute: true });
      return;
    } catch (error) {
      textarea.value = [
        "Ollama local is not reachable from this page, so Paaraket fell back to mock training.",
        "",
        `Reason: ${error.message}`
      ].join("\n");
      showPetBubble("Ollama chưa bắt được á, tớ dùng bài học local nha.", {
        alreadyCute: true
      });
    }
  }

  const match = findBestTrainingAnswer(question);

  if (!match.entry || match.score < 0.28) {
    textarea.value = [
      "I do not know this from my local training data yet.",
      "Add a similar question and answer to training-data.json, then I can answer it next time."
    ].join("\n");
    showPetBubble(cuteAnswerForTraining(match), { alreadyCute: true });
    return;
  }

  textarea.value = [
    match.entry.answer,
    "",
    `Matched: "${match.matchedQuestion}"`,
    `Confidence: ${Math.round(match.score * 100)}%`
  ].join("\n");
  showPetBubble(cuteAnswerForTraining(match), { alreadyCute: true });
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
    questionText.value = transcript;
    askPaaraket();
  };

  recognition.onerror = () => {
    showPetBubble("Tớ chưa nghe rõ, cậu thử lại xíu nha?", { alreadyCute: true });
  };
}

askButton.addEventListener("click", askPaaraket);
voiceButton.addEventListener("click", startVoiceDemo);

window.petBubble = {
  show: showPetBubble,
  cuteText: petBubbleTextFromAssistant,
  askPaaraket
};

loadTrainingData().then(() => {
  showPetBubble("Paaraket local sẵn sàng rùi nè cậu.", {
    alreadyCute: true
  });
});
