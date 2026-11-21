<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Stadium Self-Audit & Architectural Realism Fix

## 范围

Tự rà soát và khắc phục các lỗi về vật liệu PBR, độ chi tiết gân mái, khép kín vết cắt 90° và kiến trúc thực tế của 5 khu phức hợp xung quanh tại `d:\chaybo`.

## 计划

1. Thêm `PbrEnvironment` (`RoomEnvironment` + `PMREMGenerator`) trong `src/scene/StadiumScene.tsx`.
2. Thêm 48 sườn hộp thép nổi + 5 vòng xà gồ (`ExposedUpperRoofRibs`), texture múi màng `createRoofMembraneTexture` và 4 mái đón `GrandEntranceCanopies` trong `src/scene/RoofStructure.tsx`.
3. Thêm `foundationSlabGeo` và tường đầu hồi khép kín vết cắt (`createCutawaySectionCapGeometry`) trong `src/scene/BowlStands.tsx`.
4. Xây dựng lại 5 khu phức hợp theo kiến trúc thật trong `src/scene/Surroundings.tsx` (Tháp khách sạn 5★ phân sàn thật 18/14 tầng, Nhà ga Metro giàn thép có tàu điện, cầu Skywalk không đâm cầu thang, Nhà thi đấu vòm thép lộ thiên, 2 Nhà xe 5 sàn hở thông gió + 112 ô tô tỷ lệ thật, hồ nước bờ kè đá granite và cây phân cụm tán tự nhiên).

## 变更

- `src/scene/StadiumScene.tsx`: Thêm `PbrEnvironment` (`RoomEnvironment`).
- `src/scene/RoofStructure.tsx`: Thêm `ExposedUpperRoofRibs`, `createRoofMembraneTexture`, `GrandEntranceCanopies` và 48 lam đứng mặt tiền.
- `src/scene/BowlStands.tsx`: Thêm `foundationSlabGeo` và `createCutawaySectionCapGeometry` cho mặt cắt 90°.
- `src/scene/Surroundings.tsx` & `src/config/stadiumSpecs.ts`: Tái xây dựng `RealFloorPlateTower`, `OpenDeckParkingGarage`, `GraniteReflectingBasins`, `NaturalParkLandscaping` và tách cầu thang đôi ở sảnh Nam.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi, 0 biến dư thừa.
- Đã loại bỏ hoàn toàn các khối trụ đơn giản, khối cầu bánh bao, cầu thang giao cắt cầu đi bộ, khoảng rỗng đen dưới mặt cắt và thiếu môi trường phản xạ PBR.

## 测试

- `npm.cmd test`: 9/9 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công.

## API 接口文档

无接口变动

## 剩余风险

无
