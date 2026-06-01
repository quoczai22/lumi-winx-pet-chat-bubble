const bubble = document.querySelector("#petBubble");
const bubbleText = document.querySelector("#petBubbleText");
const textarea = document.querySelector("#assistantText");
const questionText = document.querySelector("#questionText");
const askButton = document.querySelector("#askPaaraket");
const voiceButton = document.querySelector("#voiceDemo");
const ollamaBaseUrlInput = document.querySelector("#ollamaBaseUrl");
const voiceLanguageInput = document.querySelector("#voiceLanguage");
const defaultOllamaBaseUrl = "https://ignition-good-urethane.ngrok-free.dev";
const ollamaModel = "llama3.2:3b";

let hideTimer = 0;
let typeTimer = 0;
let profileData = null;
let speakingTopics = [];
let coachConfig = null;
let speakingBank = [];
let coachHistory = [];

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

function wordBigrams(text) {
  const normalized = normalizeText(text);
  const chars = normalized.replace(/\s+/g, "");
  const bigrams = new Set();

  for (let index = 0; index < chars.length - 1; index += 1) {
    bigrams.add(chars.slice(index, index + 2));
  }

  return bigrams;
}

function fuzzyTextScore(left, right) {
  const tokenScore = similarityScore(left, right);
  const leftBigrams = wordBigrams(left);
  const rightBigrams = wordBigrams(right);

  if (leftBigrams.size === 0 || rightBigrams.size === 0) {
    return tokenScore;
  }

  let overlap = 0;
  for (const bigram of leftBigrams) {
    if (rightBigrams.has(bigram)) {
      overlap += 1;
    }
  }

  const bigramScore = overlap / Math.sqrt(leftBigrams.size * rightBigrams.size);
  return Math.max(tokenScore, bigramScore);
}

function selectedAnswerMode() {
  return document.querySelector('input[name="answerMode"]:checked')?.value || "ollama";
}

function savedOllamaBaseUrl() {
  return window.localStorage.getItem("lumiWinxOllamaBaseUrl") || defaultOllamaBaseUrl;
}

function setSavedOllamaBaseUrl(value) {
  const cleanValue = value.trim().replace(/\/+$/, "");
  window.localStorage.setItem("lumiWinxOllamaBaseUrl", cleanValue || defaultOllamaBaseUrl);
}

function ollamaEndpoint() {
  return `${savedOllamaBaseUrl()}/api/generate`;
}

function buildOllamaPrompt(question, context = "") {
  return [
    "You are Paaraket AI, a fast friendly English learning assistant.",
    "Answer the user's English question clearly and briefly.",
    "Prefer practical explanations and examples.",
    "If the question is not about English, programming, interviews, or learning, still answer helpfully but keep it concise.",
    context,
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

function directPetSpeechFromQuestion(text) {
  const match = text.match(/^\s*you answered:\s*["“](.+?)["”]\s*$/is);
  if (match) {
    return match[1].trim();
  }

  return "";
}

async function askOllama(question, context = "") {
  const response = await fetch(ollamaEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      model: ollamaModel,
      prompt: buildOllamaPrompt(question, context),
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

async function loadJsonFile(path, fallback) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    return await response.json();
  } catch {
    return fallback;
  }
}

async function loadPersonalContext() {
  const [profile, topics, coach, bank] = await Promise.all([
    loadJsonFile("./profile-data.json", null),
    loadJsonFile("./speaking-topics.json", []),
    loadJsonFile("./coach-config.json", null),
    loadJsonFile("./speaking-bank.json", [])
  ]);

  profileData = profile;
  speakingTopics = topics;
  coachConfig = coach;
  speakingBank = bank;
}

function topicScore(question, topic) {
  const haystack = [
    topic.topic,
    topic.answer_idea,
    ...(topic.sample_questions || [])
  ].join(" ");

  return similarityScore(question, haystack);
}

function findRelevantTopics(question) {
  return [...speakingTopics]
    .map((topic) => ({ topic, score: topicScore(question, topic) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .filter((item) => item.score > 0.05)
    .map((item) => item.topic);
}

function buildSpeakingContext(question) {
  const relevantTopics = findRelevantTopics(question);

  return [
    "",
    "Student profile JSON:",
    JSON.stringify(profileData, null, 2),
    "",
    "Relevant speaking topic notes JSON:",
    JSON.stringify(relevantTopics, null, 2),
    "",
    "Speaking answer rules:",
    "- Answer as if the student is speaking about himself.",
    "- Use first person: I, my, me.",
    "- Use simple natural English at A2-B1 level.",
    "- Keep the answer 2 to 4 short sentences.",
    "- Use the profile first. Do not invent specific personal facts that conflict with the profile.",
    "- If profile information is missing, make a safe general answer that a student could say naturally."
  ].join("\n");
}

function relevantBankExamples(text) {
  return [...speakingBank]
    .map((item) => ({
      item,
      score: Math.max(similarityScore(text, item.question), similarityScore(text, item.answer))
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.item);
}

function bestBankQuestionMatch(text) {
  let best = { item: null, score: 0 };

  for (const item of speakingBank) {
    const score = fuzzyTextScore(text, item.question);
    if (score > best.score) {
      best = { item, score };
    }
  }

  return best;
}

function isLikelyQuestion(text) {
  const cleanText = text.trim();
  return (
    cleanText.endsWith("?") ||
    /^(what|when|where|why|how|who|which|do|does|did|are|is|can|could|would|should|tell me|describe)\b/i.test(cleanText)
  );
}

function buildBankAnswerContext(match) {
  return [
    "",
    "Student profile JSON:",
    JSON.stringify(profileData, null, 2),
    "",
    "Matched speaking-bank item JSON:",
    JSON.stringify(match.item, null, 2),
    "",
    `Match confidence: ${Math.round(match.score * 100)}%`,
    "",
    "Task:",
    "- The user entered an examiner question, not a student answer.",
    "- Use the matched speaking-bank answer as the main source.",
    "- Adapt it lightly to the student's profile if needed.",
    "- Return only a natural B1 speaking answer in first person.",
    "- Do not score, correct, or ask a next question."
  ].join("\n");
}

function instantBankAnswer(match) {
  if (!match.item) {
    return "";
  }

  return match.item.answer.trim();
}

function correctVoiceTranscript(transcript) {
  let best = { question: transcript, score: 0 };

  for (const item of speakingBank) {
    const score = fuzzyTextScore(transcript, item.question);
    if (score > best.score) {
      best = { question: item.question, score };
    }
  }

  if (best.score >= 0.34) {
    return best;
  }

  return { question: transcript, score: 0 };
}

function buildCoachContext(userText, match = { item: null, score: 0 }) {
  const isStarting = coachHistory.length === 0 && /^(start|begin|first question|)$/i.test(userText.trim());
  const examples = relevantBankExamples(userText);

  return [
    "",
    "Coach config JSON:",
    JSON.stringify(coachConfig, null, 2),
    "",
    "Student profile JSON:",
    JSON.stringify(profileData, null, 2),
    "",
    "Relevant speaking answer examples JSON:",
    JSON.stringify(examples, null, 2),
    "",
    "Best exact speaking-bank match JSON:",
    JSON.stringify(match.item ? { confidence: Math.round(match.score * 100), ...match.item } : null, null, 2),
    "",
    "Conversation history JSON:",
    JSON.stringify(coachHistory.slice(-6), null, 2),
    "",
    "Current student message:",
    userText || "start",
    "",
    "Coach behavior:",
    isStarting
      ? "Start immediately by asking one short speaking question only. Do not give feedback yet."
      : "The student has answered or given an instruction. If it is an answer, give feedback in the exact configured format, then ask one next question. If there is a strong speaking-bank match, use that matched answer as the gold reference for Corrections and Better B1 answer. If it is an instruction like simpler/test mode/practice mode/Vietnamese explanation, follow it."
  ].join("\n");
}

async function askPaaraket() {
  const question = questionText.value.trim();
  const directSpeech = directPetSpeechFromQuestion(question);
  if (directSpeech) {
    textarea.value = directSpeech;
    showPetBubble(directSpeech, { alreadyCute: true });
    return;
  }

  if (!question && selectedAnswerMode() !== "coach") {
    showPetBubble("Cậu hỏi tớ một câu tiếng Anh đi nè.", { alreadyCute: true });
    return;
  }

  if (selectedAnswerMode() === "coach") {
    const message = question || "start";
    showPetBubble("Tớ chuyển cho speaking coach nha cậu.", { alreadyCute: true });
    textarea.value = "Speaking coach is thinking...";

    try {
      if (!profileData || !coachConfig) {
        await loadPersonalContext();
      }

      const match = bestBankQuestionMatch(message);
      const shouldReturnBankAnswer =
        isLikelyQuestion(message) &&
        match.item &&
        match.score >= 0.46 &&
        !/^(start|begin|first question)$/i.test(message);

      if (shouldReturnBankAnswer && match.score >= 0.58) {
        const answer = instantBankAnswer(match);
        textarea.value = [
          answer,
          "",
          `Matched instantly: "${match.item.question}"`,
          `Confidence: ${Math.round(match.score * 100)}%`
        ].join("\n");
        coachHistory.push({ role: "student", content: message });
        coachHistory.push({ role: "coach", content: answer });
        showPetBubble("Tớ tìm thấy câu mẫu, trả lời ngay cho cậu nè.", { alreadyCute: true });
        return;
      }

      const context = shouldReturnBankAnswer ? buildBankAnswerContext(match) : buildCoachContext(message, match);
      const answer = await askOllama(message, context);
      textarea.value = answer || "Ollama did not return an answer.";
      coachHistory.push({ role: "student", content: message });
      coachHistory.push({ role: "coach", content: answer });
      showPetBubble(
        shouldReturnBankAnswer
          ? "Tớ lấy câu mẫu trong file cho cậu rồi nè."
          : "Coach trả lời rồi nè cậu, luyện tiếp nha.",
        { alreadyCute: true }
      );
      return;
    } catch (error) {
      textarea.value = [
        "Speaking coach could not reach Ollama.",
        "",
        `Reason: ${error.message}`
      ].join("\n");
      showPetBubble("Coach chưa kết nối được á cậu.", { alreadyCute: true });
      return;
    }
  }

  if (selectedAnswerMode() === "speaking") {
    showPetBubble("Tớ soạn câu trả lời theo info của cậu nha.", { alreadyCute: true });
    textarea.value = "Thinking with profile + Ollama...";

    try {
      if (!profileData) {
        await loadPersonalContext();
      }

      const answer = await askOllama(question, buildSpeakingContext(question));
      textarea.value = answer || "Ollama did not return an answer.";
      showPetBubble("Tớ có câu trả lời theo kiểu của cậu rùi nè.", { alreadyCute: true });
      return;
    } catch (error) {
      textarea.value = [
        "Speaking practice could not reach Ollama.",
        "",
        `Reason: ${error.message}`
      ].join("\n");
      showPetBubble("Ollama chưa bắt được á, tớ dùng bài học local nha.", {
        alreadyCute: true
      });
    }
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
        "Ollama local is not reachable from this page.",
        "",
        `Reason: ${error.message}`
      ].join("\n");
      showPetBubble("Ollama chưa bắt được á, tớ dùng bài học local nha.", {
        alreadyCute: true
      });
    }
  }

  showPetBubble("Cậu chọn Speaking coach hoặc Ollama local nha.", { alreadyCute: true });
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
  recognition.lang = voiceLanguageInput.value;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  showPetBubble("Tớ đang nghe cậu nè.", { alreadyCute: true });
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const corrected = correctVoiceTranscript(transcript);
    questionText.value = corrected.question;

    if (corrected.score > 0) {
      textarea.value = [
        `Heard: ${transcript}`,
        `Corrected to: ${corrected.question}`,
        `Match confidence: ${Math.round(corrected.score * 100)}%`
      ].join("\n");
    }

    askPaaraket();
  };

  recognition.onerror = () => {
    showPetBubble("Tớ chưa nghe rõ, cậu thử lại xíu nha?", { alreadyCute: true });
  };
}

askButton.addEventListener("click", askPaaraket);
voiceButton.addEventListener("click", startVoiceDemo);
ollamaBaseUrlInput.value = savedOllamaBaseUrl();
ollamaBaseUrlInput.addEventListener("change", () => {
  setSavedOllamaBaseUrl(ollamaBaseUrlInput.value);
  showPetBubble("Tớ lưu URL Ollama cho cậu rồi nha.", { alreadyCute: true });
});

window.petBubble = {
  show: showPetBubble,
  cuteText: petBubbleTextFromAssistant,
  askPaaraket,
  resetCoach: () => {
    coachHistory = [];
  }
};

loadPersonalContext().then(() => {
  showPetBubble("Paaraket local sẵn sàng rùi nè cậu.", {
    alreadyCute: true
  });
});
