<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Sculptural Iconic Stadium & Resort Sports Park

## 范围

Tái thiết kế toàn diện ngôn ngữ thẩm mỹ, chất liệu PBR và quy hoạch cảnh quan của `d:\chaybo` theo chuẩn các siêu công trình quốc tế (Lusail + SoFi + Kai Tak), đưa toàn bộ kết cấu thô vào bên trong lớp vỏ điêu khắc tinh tế và nâng cấp 5 khu phức hợp xung quanh thành các công trình bo cong hiện đại trên công viên sinh thái.

## 计划

1. Tinh chỉnh `LIGHTING_CONFIGS.day` và thêm `getUndulatingRimHeight(angle)` trong `src/config/stadiumSpecs.ts` & `stadiumSpecs.test.ts`.
2. Thu gọn khung `RCFrameBents` (`Grid A–E`) vào bên trong lòng sân và phối màu ghế Đỏ Ruby – Vàng Hoàng Kim trong `src/scene/BowlStands.tsx`.
3. Dựng vỏ mặt dựng điêu khắc `SculptedDiagridFacade` (Vàng Champagne & Trắng Ngọc Trai trên kính Low-E) kết hợp mái đệm khí ETFE Trắng Ngọc Trai lượn sóng yên ngựa (`63m–74m`) trong `src/scene/RoofStructure.tsx`; ẩn dàn kèo thép 48 trục bên dưới (mở khi bật `Khung Kết Cấu (BIM)` hoặc `X-Ray Mái`).
4. Thiết kế lại `src/scene/Surroundings.tsx`: Quảng trường đá Travertine sáng, 36 cổng vòm viền vàng Champagne, thảm cỏ công viên xanh tươi, hồ cảnh quan xanh ngọc, và 5 phân khu phức hợp bo cong (Tháp đôi Khách sạn kính Sapphire, Cung Thể thao vòm ngọc trai, Nhà ga Metro cánh chim, Sân tập & Eco Parking mái xanh).

## 变更

- `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts`: Bổ sung `getUndulatingRimHeight`, bảng màu ban ngày rực rỡ và 9/9 unit tests.
- `src/scene/BowlStands.tsx`: Loại bỏ cấu kiện thò ra ngoài; tinh chỉnh ghế Đỏ Ruby – Vàng và sảnh nội bộ sáng sạch.
- `src/scene/RoofStructure.tsx`: Dựng `SculptedVesselFacade`, `SculptedDiagridFacade` Vàng Champagne & Trắng Ngọc Trai và mái đệm khí ETFE lượn sóng yên ngựa.
- `src/scene/Surroundings.tsx`: Dựng quảng trường đá Travertine, hồ nước xanh ngọc và 5 khu phức hợp kiến trúc bo cong hiện đại.
- `src/components/ControlPanel.tsx`: Cập nhật thông số & mô tả kiến trúc mới.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi, 0 biến dư thừa.
- Kết cấu chịu lực 48 khung RC + 48 dàn kèo thép vẫn liên kết đầy đủ bên trong vỏ kiến trúc, có thể kiểm tra bất kỳ lúc nào qua nút `Khung Kết Cấu (BIM)` và `Mặt cắt 90°`.

## 测试

- `npm.cmd test`: 9/9 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

无
