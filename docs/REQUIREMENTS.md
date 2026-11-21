# Đặc tả Yêu cầu Dự án (PRD): Sân vận động 200.000 chỗ ngồi tại Việt Nam

Tài liệu này dùng làm đầu vào (Requirement) cho **LoopForge Main Bot** hoặc **SOP Workflow** để thiết kế, lập trình và kiểm thử ứng dụng mô phỏng 3D.

---

## 1. Thông số Kiến trúc & Kỹ thuật Mục tiêu

- **Tên công trình**: Vietnam National Iconic Stadium (200K)
- **Sức chứa**: `200,000` chỗ ngồi
  - Tầng 1 (Lower Bowl): ~65,000 chỗ (gần mặt sân, độ dốc ~22°–26°)
  - Tầng 2 (Middle Bowl + VIP/VVIP Skybox): ~45,000 chỗ
  - Tầng 3 (Upper Bowl): ~55,000 chỗ
  - Tầng 4 (Sky Tier): ~35,000 chỗ (độ dốc ~34°–36°, đảm bảo C-value >= 90mm)
- **Mặt sân**:
  - Sân bóng đá chuẩn FIFA `105m x 68m`, vùng đệm an toàn xung quanh, vạch kẻ sân chuẩn xác, cỏ 2 tông màu (mowing stripes), khung thành và băng ghế kỹ thuật.
- **Kết cấu mái & Bản sắc Việt Nam**:
  - Hệ khung giàn không gian (space-frame) bằng thép kết hợp màng căng PTFE/ETFE bán trong suốt.
  - Hình khối mái lấy cảm hứng từ **hoa văn Trống đồng Đông Sơn / Cánh chim Lạc**, có khoảng mở trung tâm (oculus) đón ánh sáng tự nhiên cho mặt cỏ.
  - Hệ thống đèn pha LED gắn dọc vành mái trong + dải LED 360° giữa các tầng khán đài.
- **Cảnh quan xung quanh**:
  - Quảng trường tiếp cận, bậc thang lớn, hồ nước điều hòa và hệ thống đường giao thông/bãi đỗ xe bao quanh.

---

## 2. Yêu cầu Phần mềm Web 3D Tương tác

### 2.1. Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **3D Engine**: Three.js thông qua `@react-three/fiber` và `@react-three/drei`
- **UI/Styling**: Tailwind CSS + Lucide Icons
- **Testing**: Vitest (unit test cho các hàm tính toán hình học & thông số sức chứa)

### 2.2. Các module cần xây dựng
1. **`src/config/stadiumSpecs.ts`**: Hằng số & công thức tính toán kích thước sân, bán kính từng tầng khán đài, số hàng ghế, sức chứa tổng 200.000 chỗ.
2. **`src/scene/Pitch.tsx`**: Mặt sân cỏ FIFA, vạch kẻ, khung thành, khu kỹ thuật.
3. **`src/scene/BowlStands.tsx`**: Khối khán đài 4 tầng dạng elip/bát giác bo tròn, phân tách lối đi (vomitories), lan can kính và khu VIP box.
4. **`src/scene/RoofStructure.tsx`**: Kết cấu mái vòm nhịp lớn bản sắc Việt Nam + hệ thống cột/giằng chịu lực + đèn pha sân vận động.
5. **`src/scene/Surroundings.tsx`**: Quảng trường, cây xanh cách điệu, hồ cảnh quan, nền đất và bầu trời.
6. **`src/components/ControlPanel.tsx`**:
   - Chuyển đổi chế độ ánh sáng: **Ban ngày (Daylight)** / **Hoàng hôn (Sunset)** / **Ban đêm (Night Match)**.
   - Chuyển nhanh góc nhìn Camera (Camera Presets): **Toàn cảnh Flycam**, **Giữa sân**, **Khán đài VIP**, **Cận cảnh mái vòm**.
   - Bật/tắt chế độ xem **Mặt cắt / Khung kết cấu (Wireframe / X-Ray mái)** để quan sát bên trong khán đài.
   - Hiển thị bảng **Thông số kỹ thuật** (Sức chứa 200,000, kích thước phủ bì, chiều cao mái, diện tích sân).

---

## 3. Tiêu chí Nghiệm thu (Acceptance Criteria)
- `npm install` và `npm run build` thành công không lỗi TypeScript.
- Unit test (`npm test`) kiểm chứng tổng sức chứa tính toán từ cấu hình các tầng khớp `200,000` chỗ (±1%).
- Mô hình 3D hiển thị đầy đủ mặt sân, 4 tầng khán đài, mái vòm, đèn pha; xoay/zoom mượt mà bằng chuột (`OrbitControls`).
- Các nút chuyển chế độ Ngày/Hoàng hôn/Đêm và Camera Presets hoạt động chính xác.
