<!-- devflow-template: solo-report@1.1 -->
# 小型任务报告 — Vietnam 200K Stadium Cinematic PBR & Architectural Visualization Overhaul

## 范围

Nâng cấp toàn diện chất lượng đồ họa WebGL 3D tại `d:\chaybo` từ vật liệu phẳng sang tiêu chuẩn diễn họa kiến trúc (HDRI Lightformer studio, bầu trời vật lý `<Sky />`, tương phản sáng-tối, đa bản đồ PBR `map + bumpMap + roughnessMap`, phản chiếu mặt nước `<MeshReflectorMaterial />`, vật liệu đá/cỏ hạt mịn và đồng bộ bảng màu kính obsidian - đá travertine - đồng champagne cho 5 khu phức hợp).

## 计划

1. Điều chỉnh tỷ lệ tương phản nắng/bóng (`ambientIntensity`, `sunIntensity`, `sunPosition`, `fogColor`) trong `src/config/stadiumSpecs.ts`.
2. Thay `RoomEnvironment` và shader vòm đơn giản bằng `CustomStudioEnvironment` (`<Environment resolution={512} frames={2}>` + `<Lightformer />`) và `<Sky />` cho ngày/hoàng hôn trong `src/scene/StadiumScene.tsx`.
3. Nâng cấp mái PTFE với `createRoofMembranePbrTextures()` (`map`, `bumpMap`, `roughnessMap`), đổi 48 gân sườn mái sang thép graphite `#27272a`, đồng champagne `#c5a059` và kính obsidian phản xạ cao trong `src/scene/RoofStructure.tsx`.
4. Loại bỏ vòng lặp cỏ chấm bi (`1800` `ctx.arc`) và thay bằng hạt pixel địa hình + `bumpMap` (`bumpScale: 0.35`), nâng cấp 4 hồ phản chiếu bằng `<MeshReflectorMaterial />`, đồng bộ bảng màu Foster+Partners và loại bỏ các ô tô hộp màu rực trong `src/scene/Surroundings.tsx`.
5. Bổ sung `bumpMap` thảm cỏ sân FIFA (`src/scene/Pitch.tsx`) và `bumpMap` bậc ghế + vỉa kết cấu bê tông mặt cắt 90° có tọa độ UV (`src/scene/BowlStands.tsx`).

## 变更

- `src/config/stadiumSpecs.ts`: Tối ưu `LIGHTING_CONFIGS` (`day`, `sunset`, `night`) tạo tương phản khối 3D rõ nét.
- `src/scene/StadiumScene.tsx`: Thay `PbrEnvironment` bằng `CustomStudioEnvironment` (`Lightformer`) + `<Sky />` + `shadow-normalBias={0.04}` + đồng bộ `toneMappingExposure`.
- `src/scene/RoofStructure.tsx`: Thêm `createRoofMembranePbrTextures()`, tăng độ tương phản sườn graphite `#27272a` / đồng `#c5a059` / kính obsidian.
- `src/scene/Surroundings.tsx`: Nâng cấp `createMasterplanGroundPbrTextures()`, thay mặt nước bằng `<MeshReflectorMaterial resolution={512} />`, đồng bộ vật liệu kiến trúc 5 khu phức hợp.
- `src/scene/Pitch.tsx` & `src/scene/BowlStands.tsx`: Thêm `createPitchPbrTextures()`, `createSeatingBowlPbrTextures()` và `createCutawaySectionPbrTextures()` với planar UVs cho mặt cắt 90°.

## 自审

- TypeScript strict mode (`tsc -b`): 0 lỗi.
- Không còn cỏ chấm bi hoạt hình, khối màu Lego hay mái trắng bệch thiếu chiều sâu.

## 测试

- `npm.cmd test`: 9/9 unit tests pass (Vitest v3.2.7).
- `npm.cmd run build`: `tsc -b && vite build` thành công (2158 modules).

## API 接口文档

无接口变动

## 剩余风险

Cần nghiệm thu thị giác thực tế trên trình duyệt headless và kiểm tra WebGL performance của `<MeshReflectorMaterial />`.
