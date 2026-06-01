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
- `training-data.json`: dữ liệu huấn luyện mock local theo dạng câu hỏi/câu trả lời.
- `assets/lumi-winx-spritesheet.webp`: spritesheet demo của Lumi Winx.

## Paaraket mock local

This version does not call a paid API. It searches `training-data.json` for the closest known English question, returns the stored answer, then asks Lumi Winx to show a cute short bubble.

Add more examples like this:

```json
{
  "id": "topic-id",
  "questions": [
    "Main training question?",
    "Similar way to ask it?"
  ],
  "answer": "The answer Paaraket should return."
}
```

This is fast and free, but it only knows the training data. To answer like a real AI, replace `askPaaraket()` with a Netlify Function or local Ollama call.

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
→ assistant response đầy đủ
→ window.petBubble.show(assistantResponse)
→ chat chính vẫn hiển thị câu trả lời đầy đủ
```

Nên giữ bubble khoảng 1-2 câu ngắn. Câu trả lời dài vẫn để trong chat chính.
