# Hướng dẫn đưa dự án vào LoopForge

## Bước 1: Chuẩn bị LoopForge trên máy Windows
1. Cài **Docker Desktop** (bật chế độ **WSL2**).
2. Mở terminal **WSL2 (Ubuntu)** và chạy LoopForge:
   ```bash
   cd /mnt/d/LoopForge-main
   ./start.sh
   ```
3. Mở trình duyệt tại `http://localhost:8090`, tạo tài khoản Admin đầu tiên.
4. Vào **Personal Settings** để thêm API Key cho Executor bạn muốn dùng (ví dụ: Claude Code, Codex, CodeBuddy, Antigravity...).

---

## Bước 2: Đưa Repo `stadium-200k-vn` lên GitHub (hoặc Git server)
LoopForge kết nối với dự án thông qua Git repository:
1. Tạo một repository mới trên GitHub (ví dụ `stadium-200k-vn`).
2. Push thư mục `d:\stadium-200k-vn` lên GitHub:
   ```powershell
   cd d:\stadium-200k-vn
   git remote add origin https://github.com/<your-username>/stadium-200k-vn.git
   git push -u origin main
   ```
3. Trong LoopForge, vào **Personal Settings → Connect GitHub** và chọn repo `stadium-200k-vn`.

---

## Bước 3: Chạy thử với Main Bot hoặc SOP trong LoopForge

### Cách A: Chat với Main Bot
Tại màn hình Chat của LoopForge, gõ `@stadium-200k-vn` rồi nhập prompt:
> *"Hãy đọc `docs/REQUIREMENTS.md`, khởi tạo ứng dụng React + TypeScript + Three.js (R3F) để dựng mô hình 3D thực tế cho Sân vận động 200.000 chỗ ngồi tại Việt Nam. Viết unit test kiểm tra thông số sức chứa, chạy `npm run build` và `npm test` đảm bảo pass hoàn toàn, sau đó tạo Pull Request."*

### Cách B: Chạy theo quy trình SOP
1. Tạo Project mới trong LoopForge và gắn repo `stadium-200k-vn`.
2. Chọn một SOP phát triển tính năng (ví dụ: **Frontend / Feature SOP**).
3. Dán nội dung từ `docs/REQUIREMENTS.md` làm Requirement đầu vào và bấm **Run SOP**.
4. Theo dõi các agent thực hiện tuần tự: *Làm rõ yêu cầu → Thiết kế → Lập trình 3D → Review → Chạy Test → Chờ bạn duyệt ở Human Gate*.
