<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Full 3D Furnished Rooms & 3D Free-Roam Walkthrough

## 范围

Nâng cấp toàn bộ 16 phòng nội khu qua 4 tầng (`B0 +0.0m`, `L1 +10.5m`, `L2 +17.8m`, `L3 +32.8m`) thành không gian kiến trúc 3D thực sự (`InteriorRooms3D`) kèm chế độ **Đi Bộ 3D Nội Khu (`Walkthrough3DHud`)** với 3 góc nhìn (`Follow 3D`, `FPS 3D`, `Dollhouse`) tại `d:\chaybo`.

## 计划

1. Thêm `FLOOR_ELEVATION_Y` và hàm tính tọa độ camera 3D thuần `getRoom3dWalkthroughPose()` vào `src/config/interiorRooms.ts`; thêm unit test kiểm chứng trong `src/config/stadiumSpecs.test.ts` (`16/16` tests).
2. Xây dựng `src/scene/InteriorRooms3D.tsx` dựng 3D toàn bộ 16 phòng (vách tường mở cửa thật, cửa kính trượt 3D cảm biến tự mở, tủ locker có áo đấu, bể thủy trị liệu phát sáng 8°C/39°C, bàn sa bàn chiến thuật có ghế, Video Wall VAR/BMS, bàn tiệc VVIP 24 ghế, 24 cổng RFID, máy biến áp/chiller, thảm đỏ + 5 vòm vàng Đường hầm cầu thủ, NPC và avatar kỹ sư 3D khớp tay/chân).
3. Tạo `src/components/Walkthrough3DHud.tsx` với bộ chuyển 4 tầng, 3 chế độ camera 3D, Mini-Map Radar 2D đồng bộ thời gian thực, danh sách dịch chuyển nhanh 16 phòng và bàn phím D-Pad; tích hợp vào `StadiumScene.tsx`, `BowlStands.tsx` (làm mờ vỉa khán đài khi đi bộ nội khu), `FloorplanExplorer2D.tsx` (`Lên 3D Thực Tế`), `ControlPanel.tsx` và `App.tsx`.

## 变更

- `src/config/interiorRooms.ts`, `src/config/stadiumSpecs.test.ts`: Cao độ sàn 3D và bộ tính pose 3 chế độ camera + 16 unit tests.
- `src/scene/InteriorRooms3D.tsx`: Toàn bộ 16 phòng 3D đầy đủ nội thất, ánh sáng nội khu, cửa trượt kính 3D và nhân vật đi bộ 3D.
- `src/components/Walkthrough3DHud.tsx`: Giao diện điều khiển đi bộ 3D, radar 2D mini-map và dịch chuyển nhanh 16 phòng.
- `src/scene/StadiumScene.tsx`, `src/scene/BowlStands.tsx`, `src/components/FloorplanExplorer2D.tsx`, `src/components/ControlPanel.tsx`, `src/App.tsx`: Luồng WASD / Arrow / D-Pad 3D và chuyển đổi mượt 2D <-> 3D.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi.
- `OrbitControls minDistance` tự động giảm từ `28m` xuống `0.8m` và mở `maxPolarAngle` khi kích hoạt đi bộ 3D để camera đi xuyên vào bên trong từng phòng không bị dội ra ngoài.

## 测试

- `npm.cmd test`: 16/16 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

Chờ nghiệm thu trình duyệt thực tế cho 4 phòng tiêu biểu 3D (`B0-01`, `B0-03`, `L2-01`, `L3-01`) trước khi commit/push.
