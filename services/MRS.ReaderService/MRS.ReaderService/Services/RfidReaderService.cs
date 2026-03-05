using System.Text;

namespace MRS.ReaderService.Services
{

    public class RfidReaderService : IDisposable
    {
        private readonly ILogger<RfidReaderService> _logger;
        private readonly IConfiguration _configuration;

        // ─── Config ───────────────────────────────────────────────────────────────
        private readonly bool _isMockMode;
        private readonly bool _mockAutoGenerate;
        private readonly int _pollIntervalMs;

        // Connection config
        private readonly string _connectionType;   // "TCP" | "COM" | "AUTO"
        private readonly string _ipAddress;
        private readonly int _networkPort;
        private readonly int _comPort;
        private readonly byte _baudRate;           // 0=9600,1=19200,...,4=115200 (SDK values)

        // ─── Runtime state ────────────────────────────────────────────────────────
        private readonly Lock _lock = new();
        private int _portHandle = -1;
        private byte _comAddress = 0xFF;           // 0xFF = Broadcast
        private string _lastCard = string.Empty;
        private bool _isConnected = false;

        // ─── EPC Buffer (pre-allocated, reused each scan) ─────────────────────────
        private readonly byte[] _epcBuffer = new byte[4096];

        public RfidReaderService(IConfiguration configuration, ILogger<RfidReaderService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            // Mock settings
            _isMockMode       = configuration.GetValue<bool?>("Rfid:IsMockMode")       ?? true;
            _mockAutoGenerate = configuration.GetValue<bool?>("Rfid:MockAutoGenerate")  ?? true;
            _pollIntervalMs   = Math.Max(200, configuration.GetValue<int?>("Rfid:PollIntervalMs") ?? 3000);

            // Native connection settings
            _connectionType = configuration.GetValue<string>("Rfid:ConnectionType") ?? "TCP";
            _ipAddress      = configuration.GetValue<string>("Rfid:IpAddress")      ?? "192.168.1.100";
            _networkPort    = configuration.GetValue<int?>("Rfid:NetworkPort")       ?? 8160;
            _comPort        = configuration.GetValue<int?>("Rfid:ComPort")           ?? 1;
            _baudRate       = (byte)(configuration.GetValue<int?>("Rfid:BaudRate")   ?? 4); // 4 = 115200

            _logger.LogInformation(
                "RFID service initialized. Mode={Mode}, ConnectionType={ConnType}, MockAutoGenerate={AutoGen}, PollIntervalMs={Poll}",
                _isMockMode ? "Mock" : "Native",
                _connectionType,
                _mockAutoGenerate,
                _pollIntervalMs);
        }

        public int PollIntervalMs => _pollIntervalMs;
        public bool IsMockMode    => _isMockMode;
        public bool IsConnected   => _isMockMode || _isConnected;

        // ─── Connection ───────────────────────────────────────────────────────────

        /// <summary>
        /// เปิด connection ไปยัง Reader ตาม ConnectionType ที่ config ไว้
        /// เรียกครั้งเดียวตอน startup จาก RfidBackgroundService
        /// </summary>
        public bool Connect()
        {
            if (_isMockMode) return true;

            lock (_lock)
            {
                if (_isConnected)
                {
                    _logger.LogWarning("Reader already connected (PortHandle={Handle})", _portHandle);
                    return true;
                }

                int result;
                _comAddress = 0xFF;

                switch (_connectionType.ToUpperInvariant())
                {
                    case "TCP":
                        _logger.LogInformation("Connecting via TCP/IP to {IP}:{Port}", _ipAddress, _networkPort);
                        result = U861Native.OpenNetPort(_networkPort, _ipAddress, ref _comAddress, ref _portHandle);
                        break;

                    case "COM":
                        _logger.LogInformation("Connecting via COM Port {Port}", _comPort);
                        result = U861Native.OpenComPort(_comPort, ref _comAddress, _baudRate, ref _portHandle);
                        break;

                    case "AUTO":
                        _logger.LogInformation("Auto-detecting COM Port...");
                        int autoPort = _comPort;
                        result = U861Native.AutoOpenComPort(ref autoPort, ref _comAddress, _baudRate, ref _portHandle);
                        _logger.LogInformation("Auto-detected COM Port: {Port}", autoPort);
                        break;

                    default:
                        _logger.LogError("Unknown ConnectionType: {Type}", _connectionType);
                        return false;
                }

                // 0x35 = port already open (ยังถือว่า connected ได้)
                if (result == 0 || result == 0x35)
                {
                    _isConnected = true;
                    _logger.LogInformation("Reader connected. PortHandle={Handle}", _portHandle);
                    return true;
                }

                _logger.LogError("Failed to connect to reader. ResultCode=0x{Code:X2}", result);
                return false;
            }
        }

        /// <summary>ปิด connection และ release handle</summary>
        public void Disconnect()
        {
            if (_isMockMode) return;

            lock (_lock)
            {
                if (!_isConnected) return;

                try
                {
                    switch (_connectionType.ToUpperInvariant())
                    {
                        case "TCP":
                            U861Native.CloseNetPort(_portHandle);
                            break;
                        case "COM":
                        case "AUTO":
                            U861Native.CloseSpecComPort(_comPort);
                            break;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error while disconnecting reader");
                }
                finally
                {
                    _portHandle  = -1;
                    _isConnected = false;
                    _logger.LogInformation("Reader disconnected");
                }
            }
        }

        // ─── Read ─────────────────────────────────────────────────────────────────

        public string GetLastCard()
        {
            lock (_lock) { return _lastCard; }
        }

        /// <summary>
        /// สแกนหา Tag ครั้งเดียว — เรียกจาก Background loop
        /// คืนค่า EPC string แรกที่เจอ (hex uppercase) หรือ null ถ้าไม่เจอ
        /// </summary>
        public async Task<string?> ReadNextCardAsync(CancellationToken cancellationToken)
        {
            if (_isMockMode)
            {
                await Task.Delay(_pollIntervalMs, cancellationToken);

                if (!_mockAutoGenerate)
                    return null;

                var mockCard = "MOCK-" + DateTime.UtcNow.Ticks.ToString()[^6..];
                SetLastCard(mockCard);
                return mockCard;
            }

            // ─── Native mode ─────────────────────────────────────────────────────
            lock (_lock)
            {
                if (!_isConnected || _portHandle < 0)
                {
                    _logger.LogWarning("Reader not connected, skipping scan");
                    return null;
                }

                Array.Clear(_epcBuffer, 0, _epcBuffer.Length);
                int totalLen  = 0;
                int cardCount = 0;
                byte addr     = _comAddress;

                int result = U861Native.Inventory_G2(
                    ref addr,
                    qValue:  4,
                    session: 0,
                    adrTid:  0,
                    lenTid:  0,
                    tidFlag: 0,
                    epcBuffer: _epcBuffer,
                    ref totalLen,
                    ref cardCount,
                    _portHandle);

                // Return codes 0x01–0x04 = partial/complete scan, 0xFB = no tag
                if (result == 0xFB || cardCount == 0)
                    return null;

                if (result != 0 && result != 1 && result != 2 && result != 3 && result != 4)
                {
                    _logger.LogWarning("Inventory_G2 returned unexpected code 0x{Code:X2}", result);
                    return null;
                }

                // Parse EPC buffer: [EPCLen(1B)][PC(2B)][EPC(EPCLen B)] per tag
                var epc = ParseFirstEpc(_epcBuffer, totalLen, cardCount);
                if (epc is null) return null;

                SetLastCard(epc);
                return epc;
            }
        }

        // ─── Mock injection ───────────────────────────────────────────────────────

        public bool TryInjectMockCard(string? cardNumber, out string? normalizedCardNumber)
        {
            normalizedCardNumber = null;
            if (!_isMockMode) return false;

            var card = cardNumber?.Trim();
            if (string.IsNullOrWhiteSpace(card)) return false;

            normalizedCardNumber = card;
            SetLastCard(card);
            return true;
        }

        // ─── Hardware control helpers ─────────────────────────────────────────────

        /// <summary>เปิด Buzzer + LED เมื่ออ่าน Tag สำเร็จ</summary>
        public void BeepOnSuccess()
        {
            if (_isMockMode || !_isConnected) return;

            lock (_lock)
            {
                byte addr = _comAddress;
                U861Native.BuzzerAndLEDControl(ref addr,
                    activeTime: 1,   // 100ms active
                    silentTime: 1,
                    times:      1,
                    _portHandle);
            }
        }

        // ─── Private helpers ──────────────────────────────────────────────────────

        /// <summary>
        /// Parse EPC ตัวแรกจาก Inventory buffer
        /// Format: [Len(1B)][PC_High(1B)][PC_Low(1B)][EPC(Len B)] ...
        /// </summary>
        private static string? ParseFirstEpc(byte[] buffer, int totalLen, int cardCount)
        {
            if (totalLen <= 0 || cardCount <= 0) return null;

            try
            {
                int offset  = 0;
                int epcLen  = buffer[offset];       // byte แรก = ความยาว EPC (bytes)

                if (epcLen <= 0 || offset + 2 + epcLen > totalLen)
                    return null;

                // Skip 2 bytes PC word → อ่าน EPC จริง
                var epcBytes = new byte[epcLen];
                Array.Copy(buffer, offset + 2, epcBytes, 0, epcLen);

                return BitConverter.ToString(epcBytes).Replace("-", "");
            }
            catch
            {
                return null;
            }
        }

        private void SetLastCard(string card)
        {
            lock (_lock) { _lastCard = card; }
        }

        public void Dispose()
        {
            Disconnect();
        }
    }
}