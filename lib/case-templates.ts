export interface CaseTemplate {
  category: string;
  defaultSeverity: "P1" | "P2" | "P3" | "P4";
  symptom: string;
  cause: string;
  solution: string;
  prevention: string;
  suggestedTags: string[];
}

export const CATEGORY_TEMPLATES: Record<string, CaseTemplate> = {
  WIRELESS: {
    category: "WIRELESS",
    defaultSeverity: "P3",
    symptom: `### อาการที่ตรวจพบ (Symptoms)
- [ ] ลูกข่าย Wi-Fi หลุดบ่อย หรือมี Packet Loss
- [ ] ความเร็วตกผิดปกติ (Throughput ต่ำกว่า 10 Mbps)
- [ ] ติดสถานะ "No Internet" หรือได้รับ IP 169.254.x.x (APIPA)
- [ ] ไม่สามารถโรมมิ่ง (Roaming) ขณะเคลื่อนย้ายระหว่าง Access Point
- SSID ที่พบปัญหา: 
- ความถี่ที่พบปัญหา: [ ] 2.4GHz  [ ] 5GHz  [ ] 6GHz`,
    cause: `### สาเหตุที่แท้จริง (Root Cause)
- ค่าสัญญาณรบกวน (Co-Channel Interference) สูงเกินเกณฑ์ (> -85 dBm)
- หรือ DHCP Scope สำหรับ Wi-Fi Guest เต็ม
- หรือกำลังส่ง (Tx Power) สูงเกินไปทำให้ลูกข่ายเกิดปัญหา Sticky Client`,
    solution: `### วิธีการแก้ไข (Step-by-Step Solution)
1. ตรวจสอบ Channel Utilization ด้วย Wi-Fi Analyzer
2. ปรับกำลังส่ง (Tx Power) ของคลื่น 2.4GHz ลงเป็น Low (10-12 dBm)
3. เปิดใช้งาน Band Steering บังคับอุปกรณ์ไปคลื่น 5GHz
4. เปิดใช้มาตรฐาน 802.11k/v/r เพื่อช่วยการ Roaming`,
    prevention: `### แนวทางการป้องกัน (Prevention)
- สำรวจสัญญาณ (Wi-Fi Heatmap Survey) ทุก 6 เดือน
- แยก SSID สำหรับอุปกรณ์พนักงานและผู้มาติดต่อ (Guest)`,
    suggestedTags: ["WiFi", "Wireless", "Roaming", "Interference", "UniFi", "SSID"],
  },

  CONNECTIVITY: {
    category: "CONNECTIVITY",
    defaultSeverity: "P1",
    symptom: `### อาการที่ตรวจพบ (Symptoms)
- [ ] พอร์ตสวิตช์ไฟดับ หรือขึ้นสถานะ Err-Disabled
- [ ] ไฟหน้าพอร์ตสวิตช์กะพริบถี่พร้อมกันทั้งตู้ (Broadcast Storm)
- [ ] Ping ไปยัง Default Gateway ไม่ได้ (Request Timed Out)
- [ ] CPU ของ Core Switch พุ่งสูงผิดปกติ (> 90%)`,
    cause: `### สาเหตุที่แท้จริง (Root Cause)
- เกิดปัญหา L2 Loop จากการเสียบสาย Patch Cord วนกลับเข้า Switch
- หรือมีคนนำ Desktop Switch ที่ไม่รองรับ STP มาเสียบขวาง
- หรือสายนำสัญญาณ UTP ขาดใน / ขั้ว RJ-45 เข้าหัวหลวม`,
    solution: `### วิธีการแก้ไข (Step-by-Step Solution)
1. ตรวจสอบตาราง MAC Address และ Broadcast Counter บนพอร์ต
2. สั่ง \`shutdown\` พอร์ตที่มีทราฟฟิก Broadcast สูงผิดปกติทันที
3. ถอดสายที่เป็นต้นเหตุของ Loop ออกจากระบบ
4. รีเซ็ตสถานะพอร์ตด้วยคำสั่ง \`no shutdown\``,
    prevention: `### แนวทางการป้องกัน (Prevention)
- เปิดใช้งาน Spanning Tree BPDU Guard บน Access Port ทุกพอร์ต
- กำหนด Port Security จำกัดจำนวน MAC Address ต่อพอร์ตไม่เกิน 2-3 เครื่อง`,
    suggestedTags: ["SpanningTree", "STP", "BPDUGuard", "Loop", "ErrDisabled", "Cisco"],
  },

  PERFORMANCE: {
    category: "PERFORMANCE",
    defaultSeverity: "P2",
    symptom: `### อาการที่ตรวจพบ (Symptoms)
- [ ] ผู้ใช้งานเปิดระบบ ERP หรือดาวน์โหลดไฟล์ขนาดใหญ่แล้วหน้าจอค้าง
- [ ] ความเร็วอินเทอร์เน็ตตก หรือมี Latency สูงผิดปกติ (> 150ms)
- [ ] เกิด Packet Fragmentation หรือ TCP Retransmission สูง`,
    cause: `### สาเหตุที่แท้จริง (Root Cause)
- ปัญหา MTU / TCP MSS Clamping บนอุโมงค์ VPN (IPsec / Wireguard)
- หรือทราฟฟิกชนเพดาน Bandwidth ของวงจร WAN`,
    solution: `### วิธีการแก้ไข (Step-by-Step Solution)
1. ทดสอบหาขนาด MTU สูงสุดด้วยคำสั่ง: \`ping <gateway-ip> -f -l 1400\`
2. ปรับค่า TCP MSS Clamping บน Interface Tunnel เป็น 1360 bytes
3. ตรวจสอบกราฟ Bandwidth ว่ามีเครื่องใดดาวน์โหลดทราฟฟิกผิดปกติหรือไม่`,
    prevention: `### แนวทางการป้องกัน (Prevention)
- กำหนดค่า TCP MSS 1360 บน VPN Tunnel ทุกจุดเป็นค่ามาตรฐาน
- ตั้งค่านโยบาย Traffic Shaping จำกัดการใช้งาน Streaming ในเวลางาน`,
    suggestedTags: ["Performance", "Latency", "MTU", "MSSClamping", "QoS", "VPN"],
  },

  SECURITY: {
    category: "SECURITY",
    defaultSeverity: "P1",
    symptom: `### อาการที่ตรวจพบ (Symptoms)
- [ ] ไฟร์วอลล์เข้าสู่ Conserve Mode (หน่วยความจำ Memory เกิน 85%)
- [ ] ผู้ใช้ทั้งสาขาเปิดเว็บไม่ได้ หรือมี Log โดนโจมตี Syn Flood / Port Scan
- [ ] จำนวน NAT Session พุ่งชนขีดจำกัดสูงสุดของอุปกรณ์`,
    cause: `### สาเหตุที่แท้จริง (Root Cause)
- มีเครื่องลูกข่ายติดมัลแวร์ หรือติดโปรแกรมขุดบิตคอยน์ยิงทราฟฟิกออกภายนอก
- หรือมี Session ค้าง (Stale TCP Sessions) ไม่ยอมปิด`,
    solution: `### วิธีการแก้ไข (Step-by-Step Solution)
1. ตรวจสอบจำนวน Session ด้วยคำสั่งบน Firewall กรองหา Source IP สูงสุด
2. สั่งกักกัน (Quarantine) หรือ Block IP ต้นทางที่ยิงทราฟฟิกทันที
3. ล้าง Session ที่ค้างและปรับลด Session TTL ชั่วคราว`,
    prevention: `### แนวทางการป้องกัน (Prevention)
- เปิดใช้งาน DoS Policy และ IPS Protection บน Firewall
- บังคับติดตั้ง Endpoint Antivirus บนเครื่องพนักงานทุกเครื่อง`,
    suggestedTags: ["Firewall", "Security", "FortiGate", "ConserveMode", "NAT", "DoS"],
  },

  HARDWARE: {
    category: "HARDWARE",
    defaultSeverity: "P2",
    symptom: `### อาการที่ตรวจพบ (Symptoms)
- [ ] ลิงก์ไฟเบอร์ออปติก (Fiber Optic) มีอาการ Flapping ตัดต่อสลับไปมา
- [ ] เกิดค่า CRC Error หรือ Frame Alignment Error บน Interface
- [ ] พัดลมระบายความร้อน หรือ Power Supply ส่งเสียงดังผิดปกติ`,
    cause: `### สาเหตุที่แท้จริง (Root Cause)
- หัวต่อสายไฟเบอร์ LC Connector สกปรก มีคราบฝุ่นเกาะ
- หรือค่า Optical Rx Power ต่ำกว่าเกณฑ์มาตรฐาน (-15 dBm ถึง -22 dBm)
- หรือโมดูล SFP+ เสื่อมสภาพ`,
    solution: `### วิธีการแก้ไข (Step-by-Step Solution)
1. ตรวจสอบค่าแสงด้วยคำสั่ง: \`show interfaces transceiver detail\`
2. ใช้ปากกาทำความสะอาดสาย Fiber (One-Click Cleaner) ทำความสะอาดขั้ว
3. สลับสาย Patch Cord เส้นใหม่เพื่อทดสอบเปรียบเทียบ`,
    prevention: `### แนวทางการป้องกัน (Prevention)
- ห้ามถอด Dust Cap ทิ้งไว้หากไม่ได้ใช้งาน
- ทำความสะอาดสายใยแก้วนำแสงทุกครั้งก่อนเสียบเข้าโมดูล`,
    suggestedTags: ["Hardware", "Fiber", "SFP+", "Transceiver", "CRC-Error"],
  },

  ISP: {
    category: "ISP",
    defaultSeverity: "P2",
    symptom: `### อาการที่ตรวจพบ (Symptoms)
- [ ] วงจรเช่าสัญญาณ (Leased Line / MPLS) ขาดการเชื่อมต่อ
- [ ] BGP Peering กับผู้ให้บริการขึ้นลงสลับไปมา (Keepalive Timeout)
- [ ] มี Packet Loss เกินกว่า 20% บนเส้นทางไปยัง Public Gateway`,
    cause: `### สาเหตุที่แท้จริง (Root Cause)
- สายใยแก้วนำแสงของผู้ให้บริการขาดภายนอกอาคาร (เช่น รถเกี่ยวสาย หรือช่างทำถนน)
- หรือมีสัญญาณรบกวนบนคู่สายทองแดงช่วงสภาพอากาศเลวร้าย`,
    solution: `### วิธีการแก้ไข (Step-by-Step Solution)
1. บันทึกผล Ping และ Traceroute ยืนยันจุดที่สัญญาณขาดหาย
2. ตรวจสอบว่าระบบ Failover ไปยังวงจรสำรองทำงานถูกต้องหรือไม่
3. ติดต่อ ISP NOC แจ้งรหัสวงจร (Circuit ID) และเปิด Ticket ติดตามงาน`,
    prevention: `### แนวทางการป้องกัน (Prevention)
- ใช้วงจรจากผู้ให้บริการ 2 รายที่เดินสายคนละเส้นทาง (Diverse Route)
- ตั้งค่าอัตราตรวจจับการขาดหายของลิงก์ด้วย BFD (Bidirectional Forwarding Detection)`,
    suggestedTags: ["ISP", "WAN", "MPLS", "BGP", "Failover", "CircuitID"],
  },

  POWER: {
    category: "POWER",
    defaultSeverity: "P1",
    symptom: `### อาการที่ตรวจพบ (Symptoms)
- [ ] เครื่องสำรองไฟ UPS ร้องเสียงเตือนต่อเนื่อง (Beeping)
- [ ] หน้าจอ UPS ขึ้นสัญลักษณ์ Fault แบตเตอรี่ หรือ Overload
- [ ] มีไฟกระชากหรือไฟตกในห้อง Server`,
    cause: `### สาเหตุที่แท้จริง (Root Cause)
- ขั้วต่อแบตเตอรี่ด้านหลังตู้หลวมจากการสั่นสะเทือน
- หรือแบตเตอรี่เสื่อมสภาพไม่ผ่านการ Self-Test`,
    solution: `### วิธีการแก้ไข (Step-by-Step Solution)
1. เปิดสวิตช์ Manual Bypass จ่ายไฟตรงป้องกันเครื่องดับ
2. ตรวจเช็คการเชื่อมต่อสายแบตเตอรี่และขันยึดขั้วต่อให้แน่นหนา
3. สั่งรัน Self-Test ผ่านการ์ด NMC`,
    prevention: `### แนวทางการป้องกัน (Prevention)
- เปลี่ยนแบตเตอรี่ UPS ทุก 2.5 - 3 ปี
- ทดสอบระบบสลับโหลดและไฟสำรองประจำปี`,
    suggestedTags: ["UPS", "Power", "Battery", "DataCenter", "APC"],
  },
};
