import type { CameraPresetId } from './stadiumSpecs';

export type FloorLevelId = 'B0' | 'L1' | 'L2' | 'L3';

export type FurnitureKind =
  | 'locker'
  | 'table'
  | 'pool'
  | 'screen'
  | 'seat'
  | 'bed'
  | 'machinery'
  | 'turnstile'
  | 'bar';

export interface FurnitureItem {
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly kind: FurnitureKind;
  readonly color: string;
}

export interface RoomBounds {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface RoomDoorSpec {
  readonly x: number;
  readonly y: number;
  readonly orientation: 'h' | 'v';
  readonly width: number;
}

export interface StadiumRoomSpec {
  readonly id: string;
  readonly floor: FloorLevelId;
  readonly code: string;
  readonly name: string;
  readonly category: 'sports' | 'vip' | 'media' | 'public' | 'mep' | 'medical';
  readonly gridZone: string;
  readonly areaM2: number;
  readonly ceilingHeightM: number;
  readonly hvacKw: number;
  readonly fireRating: string;
  readonly description: string;
  readonly bounds: RoomBounds;
  readonly door: RoomDoorSpec;
  readonly camera3dPreset: CameraPresetId;
  readonly equipmentList: readonly string[];
  readonly furniture: readonly FurnitureItem[];
}

export interface FloorLevelSpec {
  readonly id: FloorLevelId;
  readonly label: string;
  readonly elevationLabel: string;
  readonly description: string;
  readonly defaultSpawn: readonly [number, number];
}

export const FLOOR_LEVEL_SPECS: readonly FloorLevelSpec[] = [
  {
    id: 'B0',
    label: 'Tầng B0 (+0.0m)',
    elevationLabel: 'Cao độ +0.0m · Mặt sân & Đội bóng',
    description: 'Phòng thay đồ FIFA, đường hầm ra sân, họp báo, y tế doping & trạm cơ điện MEP.',
    defaultSpawn: [-108, -12],
  },
  {
    id: 'L1',
    label: 'Tầng L1 (+10.5m)',
    elevationLabel: 'Cao độ +10.5m · Đại sảnh Podium',
    description: 'Đại sảnh đón tàu Metro Skywalk, Bảo tàng & Megastore, Khu ẩm thực 16 quầy và Trạm y tế.',
    defaultSpawn: [0, 114],
  },
  {
    id: 'L2',
    label: 'Tầng L2 (+17.8m)',
    elevationLabel: 'Cao độ +17.8m · VVIP & An ninh',
    description: 'Phòng Khánh tiết Nguyên thủ VVIP, Gold Champagne Lounge và Trung tâm Chỉ huy An ninh BMS.',
    defaultSpawn: [0, 116],
  },
  {
    id: 'L3',
    label: 'Tầng L3 (+32.8m)',
    elevationLabel: 'Cao độ +32.8m · VAR, IBC & Skybox',
    description: 'Trung tâm VAR Hawkeye/SAOT, Tổ hợp 64 Skybox Doanh nghiệp và Trạm điều khiển mái Oculus.',
    defaultSpawn: [-110, 0],
  },
] as const;

export const STADIUM_INTERIOR_ROOMS: readonly StadiumRoomSpec[] = [
  // ======================== FLOOR B0 (+0.0m) ========================
  {
    id: 'home-locker',
    floor: 'B0',
    code: 'B0-01',
    name: 'Phòng Thay Đồ Đội Chủ Nhà Việt Nam',
    category: 'sports',
    gridZone: 'Grid B–C · Khu Tây Bắc',
    areaM2: 280,
    ceilingHeightM: 4.2,
    hvacKw: 85,
    fireRating: 'REI 120 · Khói áp dương',
    description:
      'Tủ locker cá nhân hóa cho 25 tuyển thủ, bàn sa bàn chiến thuật cảm ứng trung tâm và 2 bể thủy trị liệu nóng/lạnh.',
    bounds: { x: -124, y: -42, w: 28, h: 18 },
    door: { x: -110, y: -24, orientation: 'h', width: 4.5 },
    camera3dPreset: 'pitch',
    equipmentList: [
      '25 Tủ Locker gỗ sồi & sưởi giày tự động',
      '1 Bàn Sa bàn Chiến thuật cảm ứng 86 inch',
      '2 Bể thủy trị liệu (Nóng 39°C / Đá 8°C)',
      'Thảm cỏ nhân tạo khởi động nhanh 60m²',
    ],
    furniture: [
      { label: 'Dãy Locker 1–13 (Bắc)', x: -122.5, y: -41, w: 25, h: 2.2, kind: 'locker', color: '#e11d48' },
      { label: 'Dãy Locker 14–25 (Tây)', x: -123, y: -37.5, w: 2.2, h: 12, kind: 'locker', color: '#e11d48' },
      { label: 'Bàn Sa Bàn Chiến Thuật', x: -114, y: -35, w: 6.5, h: 3.4, kind: 'table', color: '#fbbf24' },
      { label: 'Bể Sục Lạnh 8°C', x: -104, y: -39, w: 5.5, h: 4.2, kind: 'pool', color: '#38bdf8' },
      { label: 'Bể Phục Hồi Nóng 39°C', x: -104, y: -33.5, w: 5.5, h: 4.2, kind: 'pool', color: '#fb923c' },
      { label: 'Khu Khởi Động Y Tế', x: -119, y: -30, w: 8, h: 4.2, kind: 'bed', color: '#10b981' },
    ],
  },
  {
    id: 'away-locker',
    floor: 'B0',
    code: 'B0-02',
    name: 'Phòng Thay Đồ Đội Khách Quốc Tế',
    category: 'sports',
    gridZone: 'Grid B–C · Khu Tây Nam',
    areaM2: 260,
    ceilingHeightM: 4.2,
    hvacKw: 82,
    fireRating: 'REI 120 · Khói áp dương',
    description:
      'Tiêu chuẩn tương đương FIFA World Cup cho đội khách: 25 tủ locker riêng tư, phòng họp chiến thuật và bể phục hồi.',
    bounds: { x: -124, y: 24, w: 28, h: 18 },
    door: { x: -110, y: 24, orientation: 'h', width: 4.5 },
    camera3dPreset: 'pitch',
    equipmentList: [
      '25 Tủ Locker FIFA chuẩn đôi',
      'Bàn họp chiến thuật & máy chiếu Laser',
      'Bể ngâm phục hồi thể lực & bàn massage',
    ],
    furniture: [
      { label: 'Dãy Locker Đội Khách', x: -122.5, y: 38.8, w: 25, h: 2.2, kind: 'locker', color: '#38bdf8' },
      { label: 'Bàn Chiến Thuật Đội Khách', x: -114, y: 31, w: 6.5, h: 3.4, kind: 'table', color: '#94a3b8' },
      { label: 'Bể Thủy Trị Liệu', x: -104, y: 27.5, w: 5.8, h: 5.2, kind: 'pool', color: '#0ea5e9' },
      { label: 'Giường Vật Lý Trị Liệu', x: -120, y: 28, w: 4.5, h: 6, kind: 'bed', color: '#10b981' },
    ],
  },
  {
    id: 'players-tunnel',
    floor: 'B0',
    code: 'B0-03',
    name: 'Đường Hầm Ra Sân Trung Tâm & Cổng VAR',
    category: 'sports',
    gridZone: 'Grid A–B · Trục Tây Chính',
    areaM2: 210,
    ceilingHeightM: 4.5,
    hvacKw: 55,
    fireRating: 'REI 180 · Thoát nạn chính',
    description:
      'Đường hầm đôi chống ồn nối trực tiếp từ khu vực 2 đội thay đồ ra đường biên ngang phía Tây của thảm cỏ FIFA 105×68m.',
    bounds: { x: -100, y: -9, w: 42, h: 18 },
    door: { x: -100, y: 0, orientation: 'v', width: 6.0 },
    camera3dPreset: 'pitch',
    equipmentList: [
      'Lối đi đôi ngăn cách bằng vách kính cường lực',
      'Màn hình VAR bên đường biên & Cổng LED chào sân',
      'Thảm chống trượt FIFA cleat-safe',
    ],
    furniture: [
      { label: 'Sàn Thảm Đỏ Đón Cầu Thủ', x: -94, y: -4.5, w: 32, h: 9, kind: 'bar', color: '#9f1239' },
      { label: 'Trạm Camera Flash Interview', x: -72, y: -8, w: 5, h: 2.5, kind: 'screen', color: '#fbbf24' },
      { label: 'Cửa Ra Sân Cỏ (Đông)', x: -60, y: -4, w: 2, h: 8, kind: 'turnstile', color: '#10b981' },
    ],
  },
  {
    id: 'referee-doping',
    floor: 'B0',
    code: 'B0-04',
    name: 'Phòng Trọng Tài FIFA & Kiểm Tra Doping',
    category: 'medical',
    gridZone: 'Grid B · Bắc Đường Hầm',
    areaM2: 145,
    ceilingHeightM: 3.6,
    hvacKw: 38,
    fireRating: 'REI 120',
    description:
      'Cụm phòng riêng an ninh khóa từ cho tổ 4 trọng tài FIFA, phòng lấy mẫu kiểm tra Doping WADA và trạm y tế khẩn cấp sân cỏ.',
    bounds: { x: -124, y: -21, w: 20, h: 14 },
    door: { x: -104, y: -14, orientation: 'v', width: 3.5 },
    camera3dPreset: 'overview',
    equipmentList: [
      '6 Tủ Locker trọng tài & Màn hình đồng bộ VAR',
      '2 Buồng lấy mẫu WADA chuẩn độc lập',
      '2 Giường hồi sức cấp cứu chấn thương sân cỏ',
    ],
    furniture: [
      { label: 'Locker Tổ Trọng Tài', x: -122.5, y: -20, w: 8, h: 2.5, kind: 'locker', color: '#facc15' },
      { label: 'Bàn Kiểm Soát Doping WADA', x: -114, y: -19, w: 6, h: 3, kind: 'table', color: '#38bdf8' },
      { label: 'Giường Cấp Cứu ICU Sân Cỏ', x: -121, y: -13, w: 9, h: 4.5, kind: 'bed', color: '#ef4444' },
    ],
  },
  {
    id: 'press-auditorium',
    floor: 'B0',
    code: 'B0-05',
    name: 'Hội Trường Họp Báo 350 Chỗ & Mixed Zone',
    category: 'media',
    gridZone: 'Grid B–C · Khu Nam',
    areaM2: 420,
    ceilingHeightM: 5.2,
    hvacKw: 115,
    fireRating: 'REI 120',
    description:
      'Phòng họp báo sau trận đấu tiêu âm chuẩn quốc tế với 350 chỗ ngồi phóng viên, bục phát biểu và hành lang phỏng vấn nhanh Mixed Zone.',
    bounds: { x: -34, y: 66, w: 38, h: 22 },
    door: { x: -15, y: 66, orientation: 'h', width: 5.0 },
    camera3dPreset: 'overview',
    equipmentList: [
      'Bục Chủ tọa HLV & Cầu thủ (6 micro dịch cabin 8 ngôn ngữ)',
      'Sàn dốc 350 ghế phóng viên có cổng LAN 10Gbps',
      'Bục riser 18 Camera truyền hình quốc tế',
    ],
    furniture: [
      { label: 'Bục Phát Biểu Họp Báo', x: -24, y: 68, w: 18, h: 3.5, kind: 'table', color: '#fbbf24' },
      { label: 'Khối Ghế Phóng Viên (Khu A)', x: -31, y: 74, w: 14, h: 10, kind: 'seat', color: '#64748b' },
      { label: 'Khối Ghế Phóng Viên (Khu B)', x: -13, y: 74, w: 14, h: 10, kind: 'seat', color: '#64748b' },
      { label: 'Bục Camera Truyền Hình', x: -28, y: 85, w: 26, h: 2.2, kind: 'screen', color: '#38bdf8' },
    ],
  },
  {
    id: 'mep-substation',
    floor: 'B0',
    code: 'B0-06',
    name: 'Trung Tâm Cơ Điện MEP & Bơm PCCC 15MW',
    category: 'mep',
    gridZone: 'Grid B–C · Khu Đông',
    areaM2: 380,
    ceilingHeightM: 5.8,
    hvacKw: 65,
    fireRating: 'REI 180 · Tường chống nổ',
    description:
      'Trạm biến áp 22/0.4kV tổng công suất 15MW, 4 máy phát điện diesel dự phòng đồng bộ và cụm bơm chữa cháy Sprinkler áp lực cao.',
    bounds: { x: 78, y: -22, w: 32, h: 44 },
    door: { x: 78, y: 0, orientation: 'v', width: 5.0 },
    camera3dPreset: 'roof',
    equipmentList: [
      '4 Máy biến áp khô 4000kVA & Tủ trung thế GIS',
      '4 Tổ máy Chiller giải nhiệt nước trung tâm',
      'Hệ thống bơm chữa cháy D300 + Bể nước ngầm 3,000m³',
    ],
    furniture: [
      { label: 'Tổ Máy Biến Áp 1–2', x: 82, y: -19, w: 10, h: 14, kind: 'machinery', color: '#f59e0b' },
      { label: 'Tổ Máy Biến Áp 3–4', x: 96, y: -19, w: 10, h: 14, kind: 'machinery', color: '#f59e0b' },
      { label: 'Cụm Chiller HVAC Trung Tâm', x: 82, y: 4, w: 12, h: 14, kind: 'machinery', color: '#38bdf8' },
      { label: 'Trạm Bơm PCCC Áp Cao', x: 96, y: 6, w: 10, h: 12, kind: 'machinery', color: '#ef4444' },
    ],
  },

  // ======================== FLOOR L1 (+10.5m) ========================
  {
    id: 'south-metro-hall',
    floor: 'L1',
    code: 'L1-01',
    name: 'Đại Sảnh Cổng Nam & Ga Đón Cầu Metro Skywalk',
    category: 'public',
    gridZone: 'Grid D–E · Podium Nam',
    areaM2: 540,
    ceilingHeightM: 7.5,
    hvacKw: 130,
    fireRating: 'REI 120 · Lưu lượng lớn',
    description:
      'Điểm tiếp nhận luồng khán giả từ Cầu kính Metro Skywalk đi vào Podium (+10.5m) với 24 cổng kiểm soát vé RFID & nhận diện khuôn mặt.',
    bounds: { x: -36, y: 122, w: 72, h: 28 },
    door: { x: 0, y: 122, orientation: 'h', width: 12.0 },
    camera3dPreset: 'masterplan',
    equipmentList: [
      '24 Cổng Soát Vé RFID & Turnstile tự động mở khi khẩn cấp',
      'Cụm soi chiếu an ninh X-Ray 8 làn đồng thời',
      'Màn hình LED hướng dẫn lối lên 48 phân khu ghế',
    ],
    furniture: [
      { label: 'Hàng 12 Cổng Xoay RFID (Tây)', x: -32, y: 132, w: 26, h: 4, kind: 'turnstile', color: '#fbbf24' },
      { label: 'Hàng 12 Cổng Xoay RFID (Đông)', x: 6, y: 132, w: 26, h: 4, kind: 'turnstile', color: '#fbbf24' },
      { label: 'Quầy Hỗ Trợ Khán Giả & Vé', x: -12, y: 125, w: 24, h: 3.5, kind: 'bar', color: '#38bdf8' },
    ],
  },
  {
    id: 'fan-megastore',
    floor: 'L1',
    code: 'L1-02',
    name: 'Bảo Tàng Bóng Đá & Fan Megastore',
    category: 'public',
    gridZone: 'Grid C–D · Podium Đông',
    areaM2: 480,
    ceilingHeightM: 6.2,
    hvacKw: 110,
    fireRating: 'REI 120',
    description:
      'Không gian trưng bày lịch sử bóng đá Việt Nam, khu thử nghiệm thực tế ảo VR sút luân lưu và cửa hàng áo đấu chính hãng 2 tầng.',
    bounds: { x: 96, y: -38, w: 36, h: 28 },
    door: { x: 96, y: -24, orientation: 'v', width: 6.0 },
    camera3dPreset: 'overview',
    equipmentList: [
      'Phòng Trưng Bày Cúp Lịch Sử & Tủ kính chống trộm',
      '12 Dãy kệ trưng bày áo đấu & phụ kiện',
      '4 Buồng trải nghiệm VR & 8 quầy thanh toán tự động',
    ],
    furniture: [
      { label: 'Tủ Trưng Bày Cúp Lịch Sử', x: 110, y: -34, w: 10, h: 6, kind: 'table', color: '#fbbf24' },
      { label: 'Dãy Kệ Áo Đấu Đội Tuyển', x: 100, y: -20, w: 12, h: 7, kind: 'locker', color: '#e11d48' },
      { label: 'Khu VR & Quầy Thanh Toán', x: 118, y: -20, w: 11, h: 7, kind: 'screen', color: '#38bdf8' },
    ],
  },
  {
    id: 'fb-food-court',
    floor: 'L1',
    code: 'L1-03',
    name: 'Khu Ẩm Thực Đại Sảnh & Bếp Trung Tâm',
    category: 'public',
    gridZone: 'Grid C–D · Podium Bắc',
    areaM2: 520,
    ceilingHeightM: 6.0,
    hvacKw: 165,
    fireRating: 'REI 120 · Khử mùi & Bếp khí nén',
    description:
      'Tổ hợp 16 quầy đồ ăn/đồ uống phục vụ nhanh công suất 1,200 suất/phút trong 15 phút nghỉ giữa hiệp cho khán giả đại sảnh.',
    bounds: { x: -32, y: -144, w: 64, h: 26 },
    door: { x: 0, y: -118, orientation: 'h', width: 8.0 },
    camera3dPreset: 'overview',
    equipmentList: [
      '16 Quầy F&B Order nhanh qua App/QR',
      'Bếp trung tâm inox & Hệ thống chụp hút khói khử mỡ',
      'Cụm đảo bàn đứng uống nước giảm ùn tắc lối đi',
    ],
    furniture: [
      { label: 'Dãy 8 Quầy F&B (Tây)', x: -29, y: -141, w: 26, h: 4.5, kind: 'bar', color: '#f59e0b' },
      { label: 'Dãy 8 Quầy F&B (Đông)', x: 3, y: -141, w: 26, h: 4.5, kind: 'bar', color: '#f59e0b' },
      { label: 'Đảo Bàn Ăn Nhanh Khán Giả', x: -24, y: -131, w: 48, h: 8, kind: 'table', color: '#94a3b8' },
    ],
  },
  {
    id: 'first-aid-l1',
    floor: 'L1',
    code: 'L1-04',
    name: 'Trạm Cấp Cứu Khán Đài & Sảnh Xe Lăn ADA',
    category: 'medical',
    gridZone: 'Grid C–D · Podium Tây',
    areaM2: 160,
    ceilingHeightM: 4.2,
    hvacKw: 42,
    fireRating: 'REI 120',
    description:
      'Trạm cấp cứu y tế ngoại viện kết nối trực tiếp thang máy băng ca xuống hầm xe cứu thương, tích hợp sảnh chờ xe lăn chuẩn WCAG/ADA.',
    bounds: { x: -136, y: -18, w: 26, h: 36 },
    door: { x: -110, y: 0, orientation: 'v', width: 4.5 },
    camera3dPreset: 'overview',
    equipmentList: [
      '6 Giường hồi sức cấp cứu & Máy khử rung tim AED',
      'Khoang đỗ 2 xe điện cứu thương nội bộ',
      'Lối tiếp cận dốc 1:12 cho 400 vị trí xe lăn ADA',
    ],
    furniture: [
      { label: 'Giường Cấp Cứu 1–3', x: -133, y: -14, w: 12, h: 6, kind: 'bed', color: '#ef4444' },
      { label: 'Giường Cấp Cứu 4–6', x: -133, y: 8, w: 12, h: 6, kind: 'bed', color: '#ef4444' },
      { label: 'Quầy Trực Bác Sĩ & Dược', x: -120, y: -5, w: 6, h: 10, kind: 'bar', color: '#10b981' },
    ],
  },

  // ======================== FLOOR L2 (+17.8m) ========================
  {
    id: 'presidential-vvip',
    floor: 'L2',
    code: 'L2-01',
    name: 'Phòng Khánh Tiết Nguyên Thủ VVIP & Ban Công',
    category: 'vip',
    gridZone: 'Grid B–C · Trục Chính Nam',
    areaM2: 360,
    ceilingHeightM: 5.5,
    hvacKw: 95,
    fireRating: 'REI 180 · Kính chống đạn cấp B7',
    description:
      'Phòng nguyên thủ cao cấp nhìn thẳng tâm sân bóng từ cao độ +22.8m, có phòng họp nghi lễ ngoại giao, sofa tiếp khách và ban công VIP.',
    bounds: { x: -28, y: 86, w: 56, h: 24 },
    door: { x: 0, y: 110, orientation: 'h', width: 6.0 },
    camera3dPreset: 'vip',
    equipmentList: [
      'Bàn Tiệc Ngoại Giao 24 Ghế gỗ gụ & đồng Champagne',
      'Vách Kính Chống Đạn Toàn Cảnh B7 cách âm 52dB',
      '40 Ghế da sưởi ấm tại Ban Công Nguyên Thủ',
    ],
    furniture: [
      { label: 'Bàn Tiệc Ngoại Giao 24 Ghế', x: -22, y: 92, w: 22, h: 7.5, kind: 'table', color: '#c5a059' },
      { label: 'Salon Tiếp Khách Nguyên Thủ', x: 5, y: 92, w: 18, h: 8, kind: 'seat', color: '#9f1239' },
      { label: 'Ban Công Ghế Da VVIP (Nhìn Ra Sân)', x: -24, y: 87, w: 48, h: 3.2, kind: 'seat', color: '#fbbf24' },
    ],
  },
  {
    id: 'champagne-club',
    floor: 'L2',
    code: 'L2-02',
    name: 'Gold Champagne Business Lounge & Fine Dining',
    category: 'vip',
    gridZone: 'Grid B–C · Khu Bắc',
    areaM2: 620,
    ceilingHeightM: 5.0,
    hvacKw: 155,
    fireRating: 'REI 120',
    description:
      'Câu lạc bộ doanh nhân sức chứa 800 khách VIP phục vụ ẩm thực 5★ trước/sau trận đấu với quầy bar cẩm thạch trung tâm dài 18m.',
    bounds: { x: -34, y: -118, w: 68, h: 26 },
    door: { x: 0, y: -92, orientation: 'h', width: 7.0 },
    camera3dPreset: 'vip',
    equipmentList: [
      'Quầy Bar Đá Cẩm Thạch Champagne dài 18m',
      '45 Bàn Fine Dining hướng nhìn trực diện cầu thang VIP',
      'Hầm rượu vang kiểm soát nhiệt ẩm 13°C',
    ],
    furniture: [
      { label: 'Quầy Bar Cẩm Thạch Trung Tâm 18m', x: -16, y: -110, w: 32, h: 5.5, kind: 'bar', color: '#c5a059' },
      { label: 'Khu Bàn Tiệc VIP (Tây)', x: -31, y: -102, w: 20, h: 8, kind: 'table', color: '#e7e5e4' },
      { label: 'Khu Bàn Tiệc VIP (Đông)', x: 11, y: -102, w: 20, h: 8, kind: 'table', color: '#e7e5e4' },
    ],
  },
  {
    id: 'bms-security',
    floor: 'L2',
    code: 'L2-03',
    name: 'Trung Tâm Chỉ Huy An Ninh AI, BMS & PCCC',
    category: 'mep',
    gridZone: 'Grid C–D · Khu Đông',
    areaM2: 220,
    ceilingHeightM: 4.0,
    hvacKw: 68,
    fireRating: 'REI 180 · Không gian an toàn',
    description:
      'Bộ não số vận hành toàn SVĐ: giám sát 1,200 camera AI đếm mật độ Fruin, điều phối đóng mở 48 cổng thoát hiểm và cảnh báo kết cấu.',
    bounds: { x: 102, y: -20, w: 28, h: 40 },
    door: { x: 102, y: 0, orientation: 'v', width: 4.5 },
    camera3dPreset: 'roof',
    equipmentList: [
      'Video Wall cong 36 màn hình LED 4K',
      'Hệ thống Digital Twin theo dõi mật độ đám đông',
      'Bàn điều khiển mở khẩn cấp 48 cổng & khử khói',
    ],
    furniture: [
      { label: 'Video Wall AI An Ninh (36 Màn)', x: 124, y: -16, w: 3.5, h: 32, kind: 'screen', color: '#38bdf8' },
      { label: 'Bàn Điều Hành BMS & Cảnh Báo', x: 112, y: -12, w: 6.5, h: 24, kind: 'table', color: '#10b981' },
    ],
  },

  // ======================== FLOOR L3 (+32.8m) ========================
  {
    id: 'var-broadcast-hub',
    floor: 'L3',
    code: 'L3-01',
    name: 'Phòng Điều Khiển VAR & Studio Truyền Hình IBC',
    category: 'media',
    gridZone: 'Grid C–D · Tầng 3 Tây',
    areaM2: 310,
    ceilingHeightM: 4.4,
    hvacKw: 120,
    fireRating: 'REI 120',
    description:
      'Phòng vận hành VAR & Bắt việt vị bán tự động SAOT (12 camera tracking tốc độ cao) kết hợp tổ hợp cabin bình luận viên truyền hình 4K HDR.',
    bounds: { x: -146, y: -22, w: 26, h: 44 },
    door: { x: -120, y: 0, orientation: 'v', width: 4.5 },
    camera3dPreset: 'sky',
    equipmentList: [
      '8 Bàn Trạm VAR & Công nghệ Việt vị Bán tự động SAOT',
      'Tủ máy chủ Broadcast sợi quang 100Gbps',
      '4 Cabin Bình luận viên cách âm hướng thẳng sân',
    ],
    furniture: [
      { label: 'Hệ Thống Màn Hình VAR & SAOT', x: -143, y: -17, w: 3.5, h: 34, kind: 'screen', color: '#fbbf24' },
      { label: 'Bàn Điều Khiển Đạo Diễn VAR', x: -135, y: -13, w: 6, h: 26, kind: 'table', color: '#38bdf8' },
      { label: 'Cụm Rack Server Truyền Hình 100G', x: -126, y: -18, w: 4, h: 12, kind: 'machinery', color: '#64748b' },
    ],
  },
  {
    id: 'skybox-suites',
    floor: 'L3',
    code: 'L3-02',
    name: 'Tổ Hợp Skybox Doanh Nghiệp Hạng Sang',
    category: 'vip',
    gridZone: 'Grid C · Cao độ +31.6m',
    areaM2: 450,
    ceilingHeightM: 4.0,
    hvacKw: 105,
    fireRating: 'REI 120',
    description:
      'Chuỗi phòng Skybox khép kín cho đối tác doanh nghiệp với khu họp, quầy buffet riêng và ban công kính 16 ghế da nhìn toàn cảnh sân.',
    bounds: { x: -38, y: 108, w: 76, h: 22 },
    door: { x: 0, y: 130, orientation: 'h', width: 8.0 },
    camera3dPreset: 'vip',
    equipmentList: [
      '4 Suite Skybox liên thông (vách ngăn di động cách âm)',
      'Màn hình OLED 85 inch truyền hình trực tiếp đa góc',
      'Ban công 64 ghế da chỉnh điện có sưởi',
    ],
    furniture: [
      { label: 'Bàn Họp & Tiệc Skybox Suite 01', x: -32, y: 115, w: 18, h: 7, kind: 'table', color: '#c5a059' },
      { label: 'Bàn Họp & Tiệc Skybox Suite 02', x: -9, y: 115, w: 18, h: 7, kind: 'table', color: '#c5a059' },
      { label: 'Bàn Họp & Tiệc Skybox Suite 03', x: 14, y: 115, w: 18, h: 7, kind: 'table', color: '#c5a059' },
      { label: 'Ban Công Ghế Da Ngoài Trời', x: -34, y: 109, w: 68, h: 3.5, kind: 'seat', color: '#9f1239' },
    ],
  },
  {
    id: 'roof-control-catwalk',
    floor: 'L3',
    code: 'L3-03',
    name: 'Trạm Tời Mái Trượt Oculus & Đèn Pha 2000 Lux',
    category: 'mep',
    gridZone: 'Grid D–E · Khu Đông',
    areaM2: 290,
    ceilingHeightM: 4.8,
    hvacKw: 75,
    fireRating: 'REI 180',
    description:
      'Trạm điều khiển 16 tời thủy lực đóng/mở mái vòm trung tâm (0–100% trong 18 phút), tủ dimmer đèn LED 2000 Lux và cảm biến gió.',
    bounds: { x: 114, y: -20, w: 24, h: 40 },
    door: { x: 114, y: 0, orientation: 'v', width: 4.5 },
    camera3dPreset: 'roof',
    equipmentList: [
      'Tủ PLC Tời Thủy Lực Đóng Mở Mái Vòm Oculus',
      'Tủ Điều Khiển 16 Cụm Đèn Pha 2000 Lux DMX',
      'Hệ Cảm Biến Tốc Độ Gió & Chấn Động Mái Thép',
    ],
    furniture: [
      { label: 'Tủ Biến Tần Tời Mái Vòm Oculus', x: 120, y: -16, w: 6, h: 14, kind: 'machinery', color: '#f59e0b' },
      { label: 'Tủ Dimmer Đèn Pha LED 2000 Lux', x: 120, y: 4, w: 6, h: 12, kind: 'machinery', color: '#fef08a' },
      { label: 'Bàn Giám Sát Cảm Biến Gió', x: 129, y: -6, w: 5, h: 12, kind: 'screen', color: '#38bdf8' },
    ],
  },
] as const;

export function getRoomsByFloor(floor: FloorLevelId): readonly StadiumRoomSpec[] {
  return STADIUM_INTERIOR_ROOMS.filter((room) => room.floor === floor);
}

export function findRoomAtPoint(floor: FloorLevelId, x: number, y: number): StadiumRoomSpec | null {
  for (const room of STADIUM_INTERIOR_ROOMS) {
    if (room.floor !== floor) continue;
    const { x: rx, y: ry, w, h } = room.bounds;
    if (x >= rx && x <= rx + w && y >= ry && y <= ry + h) {
      return room;
    }
  }
  return null;
}

export function isDoorwayOpen(room: StadiumRoomSpec, avatarX: number, avatarY: number): boolean {
  return Math.hypot(avatarX - room.door.x, avatarY - room.door.y) <= 5.5;
}

export interface ExplorerAvatarState {
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly speedMps: number;
}

/**
 * Advances 2D free-roam avatar kinematics using WASD/Arrows or Click-to-Walk targets
 * cleanly within interior architectural boundaries [-195..195, -172..172].
 */
export function stepExplorerAvatar(
  state: { x: number; y: number; heading?: number },
  input: { dx: number; dy: number; targetX?: number | null; targetY?: number | null },
  dt: number
): ExplorerAvatarState {
  const safeDt = Math.min(0.1, Math.max(0, dt));
  const walkSpeedMps = 4.8;
  let vx = 0;
  let vy = 0;
  let nextX = state.x;
  let nextY = state.y;
  let heading = state.heading ?? 0;

  const hasKeyboard = Math.abs(input.dx) > 0.01 || Math.abs(input.dy) > 0.01;
  if (hasKeyboard) {
    const mag = Math.hypot(input.dx, input.dy) || 1;
    vx = (input.dx / mag) * walkSpeedMps;
    vy = (input.dy / mag) * walkSpeedMps;
    nextX += vx * safeDt;
    nextY += vy * safeDt;
    heading = Math.atan2(vy, vx);
  } else if (
    input.targetX !== undefined &&
    input.targetX !== null &&
    input.targetY !== undefined &&
    input.targetY !== null
  ) {
    const tdx = input.targetX - state.x;
    const tdy = input.targetY - state.y;
    const dist = Math.hypot(tdx, tdy);
    if (dist > 0.45) {
      const step = Math.min(dist, walkSpeedMps * safeDt);
      vx = (tdx / dist) * walkSpeedMps;
      vy = (tdy / dist) * walkSpeedMps;
      nextX += (tdx / dist) * step;
      nextY += (tdy / dist) * step;
      heading = Math.atan2(tdy, tdx);
    }
  }

  nextX = Math.min(195, Math.max(-195, nextX));
  nextY = Math.min(172, Math.max(-172, nextY));

  return {
    x: nextX,
    y: nextY,
    heading,
    speedMps: Number(Math.hypot(vx, vy).toFixed(2)),
  };
}
