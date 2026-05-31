# Lumi Winx Pet Chat Bubble

Cute pet speech bubble demo for Lumi Winx, ready to host on GitHub Pages.

Demo bubble overlay cho pet, dùng giọng cute xưng `tớ/cậu`.

## GitHub Pages

This is a static site. Publish the repository with GitHub Pages using:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

Then open the Pages URL GitHub gives you.

## Files

- `index.html`: demo mở trực tiếp trong browser.
- `pet-bubble.css`: giao diện bubble và pet idle animation.
- `pet-bubble.js`: chuyển câu trả lời assistant thành câu bubble ngắn, cute.
- `assets/lumi-winx-spritesheet.webp`: spritesheet demo của Lumi Winx.

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
