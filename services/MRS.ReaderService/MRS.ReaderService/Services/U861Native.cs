using System.Runtime.InteropServices;

namespace MRS.ReaderService.Services
{
    /// <summary>
    /// P/Invoke wrapper สำหรับ SID_U861.dll
    /// DLL รองรับเฉพาะ x86 (32-bit) — ต้องตั้ง Platform Target = x86
    /// Calling Convention: StdCall
    /// </summary>
    public static class U861Native
    {
        private const string DllName = "SID_U861.dll";

        // ─── Connection ───────────────────────────────────────────────────────────

        /// <summary>เปิด TCP/IP connection ไปยัง Reader</summary>
        /// <returns>0 = สำเร็จ, 0x35 = port ถูกเปิดอยู่แล้ว, 0x30 = error</returns>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int OpenNetPort(
            int port,
            string ipAddress,
            ref byte comAddress,
            ref int portHandle);

        /// <summary>ปิด TCP/IP connection</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int CloseNetPort(int portHandle);

        /// <summary>เปิด Serial COM Port</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int OpenComPort(
            int port,
            ref byte comAddress,
            byte baud,
            ref int portHandle);

        /// <summary>ค้นหาและเปิด COM Port อัตโนมัติ</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int AutoOpenComPort(
            ref int port,
            ref byte comAddress,
            byte baud,
            ref int portHandle);

        /// <summary>ปิด COM Port ทั้งหมด</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int CloseComPort();

        /// <summary>ปิด COM Port เฉพาะหมายเลข</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int CloseSpecComPort(int port);

        // ─── Inventory (สแกนหา Tag) ───────────────────────────────────────────────

        /// <summary>
        /// สแกนหา EPC Gen2 Tags หลายตัวพร้อมกัน
        /// Return codes ที่ถือว่า "สำเร็จ": 0x01, 0x02, 0x03, 0x04, 0xFB (ไม่มี Tag)
        /// Buffer format: [EPCLen(1B)][PC(2B)][EPC(EPCLen B)] ซ้ำตามจำนวน card
        /// </summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int Inventory_G2(
            ref byte comAddress,
            byte qValue,         // Q = 4 (default)
            byte session,        // 0 = S0
            byte adrTid,         // 0 ถ้าไม่อ่าน TID
            byte lenTid,         // 0 ถ้าไม่อ่าน TID
            byte tidFlag,        // 0 = ไม่อ่าน TID, 1 = อ่าน TID
            byte[] epcBuffer,    // output buffer ขนาด >= 4096
            ref int totalLength,
            ref int cardCount,
            int portHandle);

        // ─── Read / Write ─────────────────────────────────────────────────────────

        /// <summary>
        /// อ่านข้อมูลจาก Memory Bank ของ Tag
        /// mem: 0=Reserved, 1=EPC, 2=TID, 3=User
        /// </summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int ReadCard_G2(
            ref byte comAddress,
            byte[] epc,
            byte mem,
            byte wordPtr,
            byte wordCount,
            byte[] password,
            byte maskAddress,
            byte maskLength,
            byte maskFlag,
            byte[] dataOut,
            byte epcLength,
            ref int errorCode,
            int portHandle);

        /// <summary>เขียนข้อมูลลง Memory Bank ของ Tag</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int WriteCard_G2(
            ref byte comAddress,
            byte[] epc,
            byte mem,
            byte wordPtr,
            byte writeDataLen,
            byte[] writeData,
            byte[] password,
            byte maskAddress,
            byte maskLength,
            byte maskFlag,
            int writtenDataNum,
            byte epcLength,
            ref int errorCode,
            int portHandle);

        // ─── Reader Hardware ──────────────────────────────────────────────────────

        /// <summary>ดึงข้อมูล Reader: version, type, frequency range, power</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int GetReaderInformation(
            ref byte comAddress,
            byte[] versionInfo,
            ref byte readerType,
            byte[] trType,
            ref byte maxFrequency,
            ref byte minFrequency,
            ref byte powerDbm,
            ref byte scanTime,
            int portHandle);

        /// <summary>ตั้งกำลังส่ง RF (dBm)</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int SetPowerDbm(
            ref byte comAddress,
            byte powerDbm,
            int portHandle);

        /// <summary>ตั้งค่า inventory scan time (หน่วย 100ms, ตัวอย่าง 10 = 1s)</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int WriteScanTime(
            ref byte comAddress,
            ref byte scanTime,
            int portHandle);

        /// <summary>ควบคุม Buzzer และ LED</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int BuzzerAndLEDControl(
            ref byte comAddress,
            byte activeTime,
            byte silentTime,
            byte times,
            int portHandle);

        /// <summary>ควบคุม Relay output</summary>
        [DllImport(DllName, CallingConvention = CallingConvention.StdCall)]
        public static extern int SetRelay(
            ref byte comAddress,
            byte relayStatus,
            int portHandle);
    }
}
