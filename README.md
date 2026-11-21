# Vietnam 200K Stadium — Thiết kế & Mô hình 3D Tương tác Thực tế

Dự án thiết kế kiến trúc và mô hình hóa 3D thời gian thực cho **Sân vận động 200.000 chỗ ngồi tại Việt Nam** — hướng tới công trình biểu tượng tầm cỡ thế giới, kết hợp kỹ thuật kết cấu nhịp lớn hiện đại với bản sắc văn hóa Việt Nam.

> Repo này được chuẩn bị sẵn sàng để đưa vào nền tảng **LoopForge** (chạy qua Main Bot hoặc SOP) nhằm tự động hóa quá trình thiết kế, lập trình mô hình 3D, kiểm thử và review.

---

## Mục tiêu dự án

1. **Thiết kế kiến trúc & thông số kỹ thuật**:
   - Sức chứa **200.000 chỗ ngồi** (chia 4 tầng khán đài, tối ưu góc nhìn C-value & luồng thoát hiểm).
   - Mặt sân cỏ chuẩn FIFA (`105m x 68m`), khu kỹ thuật, bảng LED 360°.
   - Mái vòm kết cấu thép nhịp lớn lấy cảm hứng **Trống đồng Đông Sơn / Cánh chim Lạc / Hoa sen**.
2. **Ứng dụng Web 3D tương tác thực tế**:
   - Công nghệ mục tiêu: **React + TypeScript + Vite + Three.js (`@react-three/fiber`, `@react-three/drei`)**.
   - Hỗ trợ ánh sáng PBR, đổ bóng, chuyển đổi chế độ **Ngày / Hoàng hôn / Đêm**, camera preset (Toàn cảnh, Khán đài VIP, Mặt sân, Mái vòm) và bảng thông số công trình.

---

## Tài liệu trong Repo

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md): Đặc tả yêu cầu chi tiết (PRD) để LoopForge Main Bot / SOP Agents đọc và triển khai code.
- [docs/LOOPFORGE_GUIDE.md](docs/LOOPFORGE_GUIDE.md): Hướng dẫn từng bước đưa dự án này vào LoopForge để chạy thử.
