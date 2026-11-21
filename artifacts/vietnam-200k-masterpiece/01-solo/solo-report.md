<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Stadium Buildable Structural BIM

## 范围

Xây dựng lại toàn bộ mô hình 3D tại `d:\chaybo` theo chuẩn kỹ thuật xây dựng thực tế có thể triển khai thi công ngoài đời (Buildable Structural BIM: Khung Bê tông cốt thép Grid A–E + Giàn kèo thép công-xôn tam giác 2 lớp + Mặt dựng lam nhôm thực tế), loại bỏ toàn bộ các chi tiết trang trí giả tưởng.

## 计划

1. Chuẩn hóa tọa độ `STRUCTURAL_GRID_LINES` (`Grid A..E`) và `ROOF_SPECS` trong `src/config/stadiumSpecs.ts` để các tầng khán đài gối khít lên lưới cột và dầm nghiêng raker.
2. Xây dựng `RCFrameBents` (48 khung trục bê tông cốt thép `Grid A–E`, 4 dầm raker riêng áp sát đáy từng tầng, dầm sàn chuyển tầng, 8 lõi cứng thang máy/thang bộ) và `LowerBowlPodiumWall` trong `src/scene/BowlStands.tsx`.
3. Xây dựng `TriangulatedSpaceTrussRoof` (48 dàn kèo thép công-xôn tam giác 2 lớp, thanh cánh thượng/hạ, thanh đứng/xiên bụng, 10 vòng xà gồ & giằng chéo), vách kính trung tính và lam nhôm chắn nắng trong `src/scene/RoofStructure.tsx`.
4. Làm sạch `src/scene/Pitch.tsx` (bảng LED quanh sân, cờ góc, dugouts) và `src/scene/Surroundings.tsx` (bê tông/granite trung tính, mạch co giãn, đường nhựa asphalt và cây xanh thực tế).
5. Thay các hiệu ứng giả lập bằng nút `Khung Kết Cấu (BIM)` trong `src/components/ControlPanel.tsx` & `src/App.tsx`.

## 变更

- `src/config/stadiumSpecs.ts` & `src/config/stadiumSpecs.test.ts`: Thêm `STRUCTURAL_GRID_LINES` và kiểm tra liên kết Grid B..E với Tier 1..4 & gối giàn mái.
- `src/scene/BowlStands.tsx`: Thêm `RCFrameBents`, `bimFrameMode`, tường chắn hào sân cỏ cao `2.2m` và dầm raker bám sát đáy từng tầng.
- `src/scene/RoofStructure.tsx`: Thêm `TriangulatedSpaceTrussRoof` (~2.400–3.000 cấu kiện giàn thép tam giác trên `InstancedMesh`), lam nhôm chắn nắng ngang.
- `src/scene/Pitch.tsx` & `src/scene/Surroundings.tsx`: Hoàn thiện mặt sân & tổng mặt bằng trung thực.
- `src/components/ControlPanel.tsx`, `src/scene/StadiumScene.tsx`, `src/App.tsx`: Thêm chế độ `Khung Kết Cấu (BIM)`.

## 自审

- Kiểm tra strict TypeScript (`tsc -b`): 0 lỗi.
- Kiểm tra liên kết hình học: đáy mỗi tầng khán đài đều tỳ trực tiếp lên dầm raker riêng và cột Grid A–E; dàn kèo thép công-xôn gối trực tiếp lên đầu cột Grid E ở cao độ `68.5m`.

## 测试

- `npm.cmd test`: 8/8 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

无
