# Lumi Winx Pet Chat Bubble

Cute pet speech bubble demo for Lumi Winx, ready to host on GitHub Pages.

Demo bubble overlay cho pet, dùng giọng cute xưng `tớ/cậu`.

## GitHub Pages

This is a static site. Publish the repository with GitHub Pages using:

- Source: `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/ (root)`

Then open:

https://quoczai22.github.io/lumi-winx-pet-chat-bubble/

## Files

- `index.html`: demo mở trực tiếp trong browser.
- `pet-bubble.css`: giao diện bubble và pet idle animation.
- `pet-bubble.js`: chuyển câu trả lời assistant thành câu bubble ngắn, cute.
- `coach-config.json`: luật speaking examiner/coach.
- `speaking-bank.json`: câu hỏi và câu trả lời mẫu từ file `av3.txt`.
- `profile-data.json`: thông tin cá nhân dùng cho Speaking Practice.
- `speaking-topics.json`: topic/câu hỏi mẫu để trả lời speaking theo context.
- `assets/lumi-winx-spritesheet.webp`: spritesheet demo của Lumi Winx.

## Examiner mode

This mode acts like a local English speaking examiner. Type `start` or leave the question box empty, then click **Hỏi Paaraket** to get the first question. After the student answers, click again to receive scores, corrections, a better B1 answer, and one follow-up question.

If you type an examiner question that closely matches `speaking-bank.json`, the app returns the stored answer idea instead of pretending to grade it. This keeps the original `av3.txt` context available when you need a model answer.

For strong matches, the app returns the bank answer instantly without calling Ollama. Ollama is used only when the question is new or the match is weak.

The coach uses:

- `coach-config.json` for examiner rules.
- `profile-data.json` for student identity and goals.
- `speaking-bank.json` for sample speaking answers.

Shortcut: paste text like `You answered: "..."` into the question box and click **Hỏi Paaraket**. Lumi Winx will show the quoted answer directly in the speech bubble.

## Answer Helper mode

This mode sends the user's question, `profile-data.json`, and matching notes from `speaking-topics.json` to local Ollama. It asks the model to answer in first person, simple A2-B1 English, using the student's profile first.

Edit `profile-data.json` to teach the assistant about the student. Edit `speaking-topics.json` to add expected speaking topics and answer ideas.

## Ollama local mode

Install Ollama, then pull a small local model:

```powershell
ollama pull llama3.2:3b
```

Keep Ollama running locally. The demo calls:

```text
http://localhost:11434/api/generate
```

If the browser blocks localhost from the hosted GitHub Pages page, open `index.html` locally or run a local static server.

You can also paste another server URL into the **Ollama server URL** field, for example an ngrok URL or a real server that proxies Ollama.

Current demo default:

```text
https://ignition-good-urethane.ngrok-free.dev
```

### ngrok / real server note

Do not expose Ollama directly to the public internet for long-term use because the Ollama API has no app-level login in this demo. For quick testing, an ngrok URL is okay while you are watching it. For an always-on setup, use a small backend/proxy with authentication or deploy a real API provider behind Netlify/Vercel/Cloudflare.

### Recommended ngrok setup

Run the local CORS proxy first:

```powershell
node ollama-proxy.js
```

Then point ngrok at the proxy, not directly at Ollama:

```powershell
ngrok http 8788
```

Copy the HTTPS ngrok URL into **Ollama server URL**.

## API nhỏ

Sau khi load `pet-bubble.js`, gọi:

```js
window.petBubble.show("Mình sẽ kiểm tra lỗi này và sửa phần liên quan.");
```

Bubble sẽ hiện:

```text
Tớ xem liền cho cậu nha.
```

Nếu đã có câu cute sẵn:

```js
window.petBubble.show("Xong rùi nè cậu.", { alreadyCute: true });
```

## Flow voice gợi ý

```text
voice input
→ speech-to-text
→ correct transcript against speaking-bank questions when close enough
→ assistant response đầy đủ
→ window.petBubble.show(assistantResponse)
→ chat chính vẫn hiển thị câu trả lời đầy đủ
```

Nên giữ bubble khoảng 1-2 câu ngắn. Câu trả lời dài vẫn để trong chat chính.

For English speaking practice, keep **Voice language** set to `English (US)` or `English (UK)`. Use Vietnamese only when speaking Vietnamese.
