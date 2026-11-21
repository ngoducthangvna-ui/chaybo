<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K 2D Free-Roam CAD/BIM Interior Explorer & Under-Bowl Rooms

## 范围

Xây dựng chế độ trải nghiệm **Mặt bằng CAD/BIM 2D Di Chuyển Tự Do (`FloorplanExplorer2D`)** qua **4 tầng (`B0 +0.0m`, `L1 +10.5m`, `L2 +17.8m`, `L3 +32.8m`)** với **16 phòng chức năng đầy đủ nội thất kỹ thuật** tại `d:\chaybo`, tích hợp đồng bộ chia đôi 2D + 3D và vách ngăn buồng phòng 3D dưới khán đài.

## 计划

1. Tạo `src/config/interiorRooms.ts` định nghĩa 4 tầng (`FLOOR_LEVEL_SPECS`), 16 phòng chức năng (`STADIUM_INTERIOR_ROOMS`), công thức động học di chuyển `stepExplorerAvatar()`, phát hiện vào phòng `findRoomAtPoint()` và mở cửa trượt tự động `isDoorwayOpen()`. Thêm 3 unit tests trong `src/config/stadiumSpecs.test.ts` (`15/15` tests).
2. Xây dựng `src/components/FloorplanExplorer2D.tsx` render mặt bằng CAD/BIM 2D thời gian thực 60 FPS với trục kết cấu A–E, lõi thang máy, từng chi tiết nội thất (25 locker, bể sục có gợn nước, bàn chiến thuật, cổng RFID, Video Wall AI/VAR, bàn tiệc VVIP, trạm biến áp), NPC di chuyển trong phòng, cửa trượt cảm biến tiệm cận và avatar kỹ sư điều khiển qua WASD / Phím mũi tên / Click-to-Walk / D-Pad (chế độ Cận cảnh đi bộ hoặc Tổng mặt bằng, chia đôi 2D+3D hoặc Toàn màn hình 2D).
3. Thêm `UnderBowlInteriorRooms3D` (vách chia buồng 3D dưới khán đài & Cổng Đường hầm Cầu thủ phía Tây) trong `src/scene/BowlStands.tsx`, nối trạng thái 2D/3D vào `src/App.tsx` và nút `Khám Phá 2D (16 Phòng Nội Khu)` vào `src/components/ControlPanel.tsx`.

## 变更

- `src/config/interiorRooms.ts`, `src/config/stadiumSpecs.test.ts`: Dữ liệu 16 phòng BIM 4 tầng + động học di chuyển & cửa tự động + 15 unit tests.
- `src/components/FloorplanExplorer2D.tsx`: Trình khám phá 2D CAD/BIM tương tác đầy đủ điều khiển đi bộ, phóng to/thu nhỏ, hồ sơ MEP/PCCC và nút đồng bộ 3D mặt cắt.
- `src/scene/BowlStands.tsx`, `src/App.tsx`, `src/components/ControlPanel.tsx`: Vách buồng nội khu 3D, cổng đường hầm cầu thủ và giao diện chuyển đổi 2D/3D song song.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi.
- Mỗi phòng trong 16 phòng đều có kích thước mét thực, cửa trượt tự động, đồ đạc nội thất đặc thù và đồng bộ nút nhảy nhanh.

## 测试

- `npm.cmd test`: 15/15 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

Chờ kiểm chứng di chuyển 2D thực tế trên trình duyệt headless và kiểm tra ảnh chụp màn hình trước khi commit/push.
