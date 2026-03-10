using System.Text;
using MRS.ReaderService.Models;

namespace MRS.ReaderService.Services
{

    public class RfidReaderService : IDisposable
    {
        private readonly ILogger<RfidReaderService> _logger;
        private readonly ReaderSettingsStore _settingsStore;

        // â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private bool _isMockMode;
        private bool _mockAutoGenerate;
        private int _pollIntervalMs;
        private int _pauseAfterDetectMs;
        private string _pauseScope = "ANYTAG";

        // Connection config
        private string _connectionType = "TCP";   // "TCP" | "COM" | "AUTO"
        private string _ipAddress = "192.168.1.100";
        private int _networkPort;
        private int _comPort;
        private byte _baudRate;           // 0=9600,1=19200,...,4=115200 (SDK values)
        private byte _powerDbm;
        private byte _scanTime100Ms;

        // â”€â”€â”€ Runtime state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private readonly Lock _lock = new();
        private int _portHandle = -1;
        private byte _comAddress = 0xFF;           // 0xFF = Broadcast
        private string _lastCard = string.Empty;
        private bool _isConnected = false;
        private int _lastConnectResultCode = 0;
        private string? _lastError;
        private DateTimeOffset _updatedAt = DateTimeOffset.UtcNow;
        private int _scanAttemptCount;
        private int _scanSuccessCount;
        private int _lastInventoryResultCode = -1;
        private int _lastInventoryCardCount;
        private int _lastInventoryTotalLen;
        private DateTimeOffset? _lastInventoryAt;
        private DateTimeOffset? _lastCardDetectedAt;

        // â”€â”€â”€ EPC Buffer (pre-allocated, reused each scan) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private readonly byte[] _epcBuffer = new byte[4096];

        public RfidReaderService(
            IConfiguration configuration,
            ReaderSettingsStore settingsStore,
            ILogger<RfidReaderService> logger)
        {
            _logger = logger;
            _settingsStore = settingsStore;
            var fallbackSettings = configuration.GetSection("Rfid").Get<ReaderConnectionSettings>() ?? new ReaderConnectionSettings();
            var loadedSettings = _settingsStore.Load(fallbackSettings);
            ApplySettingsInMemory(NormalizeSettings(loadedSettings));

            _logger.LogInformation(
                "RFID service initialized. Mode={Mode}, ConnectionType={ConnType}, MockAutoGenerate={AutoGen}, PollIntervalMs={Poll}",
                _isMockMode ? "Mock" : "Native",
                _connectionType,
                _mockAutoGenerate,
                _pollIntervalMs);
            _logger.LogInformation(
                "Effective reader settings: IP={Ip}, Port={Port}, ComPort={ComPort}, Baud={Baud}, Power={Power}, ScanTime100Ms={Scan}, PauseAfterDetectMs={PauseMs}, PauseScope={PauseScope}",
                _ipAddress,
                _networkPort,
                _comPort,
                _baudRate,
                _powerDbm,
                _scanTime100Ms,
                _pauseAfterDetectMs,
                _pauseScope);
        }

        public int PollIntervalMs => _pollIntervalMs;
        public int PauseAfterDetectMs => _pauseAfterDetectMs;
        public string PauseScope => _pauseScope;
        public bool IsMockMode    => _isMockMode;
        public bool IsConnected   => _isMockMode || _isConnected;

        public ReaderRuntimeStatus GetRuntimeStatus()
        {
            lock (_lock)
            {
                return new ReaderRuntimeStatus
                {
                    IsMockMode = _isMockMode,
                    IsConnected = _isMockMode || _isConnected,
                    LastConnectResultCode = _lastConnectResultCode,
                    LastError = _lastError,
                    UpdatedAt = _updatedAt,
                    ScanAttemptCount = _scanAttemptCount,
                    ScanSuccessCount = _scanSuccessCount,
                    LastInventoryResultCode = _lastInventoryResultCode,
                    LastInventoryCardCount = _lastInventoryCardCount,
                    LastInventoryTotalLen = _lastInventoryTotalLen,
                    LastInventoryAt = _lastInventoryAt,
                    LastCardDetectedAt = _lastCardDetectedAt,
                    Settings = GetConnectionSettingsSnapshot()
                };
            }
        }

        public ReaderConnectionSettings GetConnectionSettingsSnapshot()
        {
            return new ReaderConnectionSettings
            {
                IsMockMode = _isMockMode,
                MockAutoGenerate = _mockAutoGenerate,
                PollIntervalMs = _pollIntervalMs,
                PauseAfterDetectMs = _pauseAfterDetectMs,
                PauseScope = _pauseScope,
                ConnectionType = _connectionType,
                IpAddress = _ipAddress,
                NetworkPort = _networkPort,
                ComPort = _comPort,
                BaudRate = _baudRate,
                PowerDbm = _powerDbm,
                ScanTime100Ms = _scanTime100Ms
            };
        }

        public ReaderConnectionTestResult TestTcpConnection(string ipAddress, int networkPort)
        {
            var result = new ReaderConnectionTestResult
            {
                IpAddress = ipAddress?.Trim() ?? string.Empty,
                NetworkPort = networkPort
            };

            if (string.IsNullOrWhiteSpace(result.IpAddress) || networkPort <= 0 || networkPort > 65535)
            {
                result.Success = false;
                result.ResultCode = 0xFF;
                result.Message = "Invalid IP address or port";
                return result;
            }

            try
            {
                lock (_lock)
                {
                    byte testComAddress = 0xFF;
                    int testPortHandle = -1;
                    var openResult = U861Native.OpenNetPort(networkPort, result.IpAddress, ref testComAddress, ref testPortHandle);

                    if (openResult != 0 && openResult != 0x35)
                    {
                        result.Success = false;
                        result.ResultCode = openResult;
                        result.Message = $"OpenNetPort failed (0x{openResult:X2})";
                        _lastError = result.Message;
                        _updatedAt = DateTimeOffset.UtcNow;
                        return result;
                    }

                    if (openResult == 0x35)
                    {
                        result.Success = true;
                        result.ResultCode = openResult;
                        result.Message = "TCP port already opened";
                        _lastError = null;
                        _updatedAt = DateTimeOffset.UtcNow;
                        return result;
                    }

                    try
                    {
                        var versionInfo = new byte[2];
                        var trType = new byte[2];
                        byte readerType = 0;
                        byte maxFrequency = 0;
                        byte minFrequency = 0;
                        byte powerDbm = 0;
                        byte scanTime = 0;

                        var infoResult = U861Native.GetReaderInformation(
                            ref testComAddress,
                            versionInfo,
                            ref readerType,
                            trType,
                            ref maxFrequency,
                            ref minFrequency,
                            ref powerDbm,
                            ref scanTime,
                            testPortHandle);

                        result.Success = infoResult == 0;
                        result.ResultCode = infoResult;
                        result.Message = infoResult == 0
                            ? "Connection test successful"
                            : $"GetReaderInformation failed (0x{infoResult:X2})";

                        if (infoResult == 0)
                        {
                            result.Version = $"{versionInfo[0]:00}.{versionInfo[1]:00}";
                        }

                        _lastError = result.Success ? null : result.Message;
                        _updatedAt = DateTimeOffset.UtcNow;

                        return result;
                    }
                    finally
                    {
                        U861Native.CloseNetPort(testPortHandle);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TCP connection test failed");
                result.Success = false;
                result.ResultCode = 0x30;
                result.Message = "TCP connection test failed: " + ex.Message;
                lock (_lock)
                {
                    _lastError = result.Message;
                    _updatedAt = DateTimeOffset.UtcNow;
                }
                return result;
            }
        }

        public ReaderConnectionSettings SaveConnectionSettings(ReaderConnectionSettings settings)
        {
            var normalized = NormalizeSettings(settings);
            _settingsStore.Save(normalized);
            lock (_lock)
            {
                _lastError = null;
                _updatedAt = DateTimeOffset.UtcNow;
            }
            return normalized;
        }

        public ReaderConnectionTestResult ApplyConnectionSettings(ReaderConnectionSettings settings)
        {
            var normalized = NormalizeSettings(settings);

            if (!_isMockMode && _isConnected)
            {
                Disconnect();
            }

            lock (_lock)
            {
                ApplySettingsInMemory(normalized);
            }

            if (_isMockMode)
            {
                lock (_lock)
                {
                    _lastConnectResultCode = 0;
                    _lastError = null;
                    _updatedAt = DateTimeOffset.UtcNow;
                }
                return new ReaderConnectionTestResult
                {
                    Success = true,
                    ResultCode = 0,
                    Message = "Settings applied in mock mode",
                    IpAddress = _ipAddress,
                    NetworkPort = _networkPort
                };
            }

            var connected = Connect();
            return new ReaderConnectionTestResult
            {
                Success = connected,
                ResultCode = connected ? 0 : _lastConnectResultCode,
                Message = connected ? "Settings applied and reader connected" : "Settings applied but connection failed",
                IpAddress = _ipAddress,
                NetworkPort = _networkPort
            };
        }

        // â”€â”€â”€ Connection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        /// <summary>
        /// à¹€à¸›à¸´à¸” connection à¹„à¸›à¸¢à¸±à¸‡ Reader à¸•à¸²à¸¡ ConnectionType à¸—à¸µà¹ˆ config à¹„à¸§à¹‰
        /// à¹€à¸£à¸µà¸¢à¸à¸„à¸£à¸±à¹‰à¸‡à¹€à¸”à¸µà¸¢à¸§à¸•à¸­à¸™ startup à¸ˆà¸²à¸ RfidBackgroundService
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
                        _lastConnectResultCode = 0xFF;
                        _lastError = "Unknown connection type";
                        _updatedAt = DateTimeOffset.UtcNow;
                        _logger.LogError("Unknown ConnectionType: {Type}", _connectionType);
                        return false;
                }

                // 0x35 = port already open (à¸¢à¸±à¸‡à¸–à¸·à¸­à¸§à¹ˆà¸² connected à¹„à¸”à¹‰)
                if (result == 0 || result == 0x35)
                {
                    _isConnected = true;
                    _lastConnectResultCode = result;
                    _lastError = null;
                    _updatedAt = DateTimeOffset.UtcNow;
                    _logger.LogInformation("Reader connected. PortHandle={Handle}", _portHandle);
                    SyncReaderInformation();
                    InitializeReaderParameters();
                    return true;
                }

                _lastConnectResultCode = result;
                _lastError = $"Connect failed (0x{result:X2})";
                _updatedAt = DateTimeOffset.UtcNow;
                _logger.LogError("Failed to connect to reader. ResultCode=0x{Code:X2}", result);
                return false;
            }
        }

        /// <summary>à¸›à¸´à¸” connection à¹à¸¥à¸° release handle</summary>
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
                    _updatedAt = DateTimeOffset.UtcNow;
                    _logger.LogInformation("Reader disconnected");
                }
            }
        }

        // â”€â”€â”€ Read â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        public string GetLastCard()
        {
            lock (_lock) { return _lastCard; }
        }

        /// <summary>
        /// à¸ªà¹à¸à¸™à¸«à¸² Tag à¸„à¸£à¸±à¹‰à¸‡à¹€à¸”à¸µà¸¢à¸§ â€” à¹€à¸£à¸µà¸¢à¸à¸ˆà¸²à¸ Background loop
        /// à¸„à¸·à¸™à¸„à¹ˆà¸² EPC string à¹à¸£à¸à¸—à¸µà¹ˆà¹€à¸ˆà¸­ (hex uppercase) à¸«à¸£à¸·à¸­ null à¸–à¹‰à¸²à¹„à¸¡à¹ˆà¹€à¸ˆà¸­
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

            // â”€â”€â”€ Native mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

                if (result == 0x30)
                {
                    // Some readers require direct address (0x00) instead of broadcast (0xFF), or vice versa.
                    byte fallbackAddr = addr == 0x00 ? (byte)0xFF : (byte)0x00;
                    Array.Clear(_epcBuffer, 0, _epcBuffer.Length);
                    int fallbackTotalLen = 0;
                    int fallbackCardCount = 0;
                    int fallbackResult = U861Native.Inventory_G2(
                        ref fallbackAddr,
                        qValue: 4,
                        session: 0,
                        adrTid: 0,
                        lenTid: 0,
                        tidFlag: 0,
                        epcBuffer: _epcBuffer,
                        ref fallbackTotalLen,
                        ref fallbackCardCount,
                        _portHandle);

                    if (fallbackResult != 0x30)
                    {
                        _logger.LogWarning(
                            "Inventory fallback succeeded with address 0x{Addr:X2} (prev 0x{Prev:X2}), result=0x{Result:X2}",
                            fallbackAddr, addr, fallbackResult);
                        _comAddress = fallbackAddr;
                        addr = fallbackAddr;
                        result = fallbackResult;
                        totalLen = fallbackTotalLen;
                        cardCount = fallbackCardCount;
                    }
                }

                _scanAttemptCount++;
                _lastInventoryResultCode = result;
                _lastInventoryCardCount = cardCount;
                _lastInventoryTotalLen = totalLen;
                _lastInventoryAt = DateTimeOffset.UtcNow;
                _updatedAt = DateTimeOffset.UtcNow;

                _logger.LogDebug(
                    "Inventory_G2 result=0x{Result:X2}, cardCount={CardCount}, totalLen={TotalLen}",
                    result, cardCount, totalLen);

                // Return codes 0x01â€“0x04 = partial/complete scan, 0xFB = no tag
                if (result == 0xFB || cardCount == 0)
                {
                    ClearLastCard();
                    return null;
                }

                if (result != 0 && result != 1 && result != 2 && result != 3 && result != 4)
                {
                    _logger.LogWarning("Inventory_G2 returned unexpected code 0x{Code:X2}", result);
                    ClearLastCard();
                    return null;
                }

                var previewLength = Math.Min(totalLen, 24);
                if (previewLength > 0)
                {
                    var preview = BitConverter.ToString(_epcBuffer, 0, previewLength).Replace("-", "");
                    _logger.LogDebug("Inventory buffer preview({Len}B): {Preview}", previewLength, preview);
                }

                var epc = ParseFirstEpc(_epcBuffer, totalLen, cardCount);
                if (epc is null)
                {
                    ClearLastCard();
                    return null;
                }

                _scanSuccessCount++;
                _lastCardDetectedAt = DateTimeOffset.UtcNow;
                SetLastCard(epc);
                return epc;
            }
        }

        // â”€â”€â”€ Mock injection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

        // â”€â”€â”€ Hardware control helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        /// <summary>à¹€à¸›à¸´à¸” Buzzer + LED à¹€à¸¡à¸·à¹ˆà¸­à¸­à¹ˆà¸²à¸™ Tag à¸ªà¸³à¹€à¸£à¹‡à¸ˆ</summary>
        public void BeepOnSuccess()
        {
            if (_isMockMode || !_isConnected) return;

            lock (_lock)
            {
                byte addr = _comAddress;
                var result = U861Native.BuzzerAndLEDControl(ref addr,
                    activeTime: 1,   // 100ms active
                    silentTime: 1,
                    times:      1,
                    _portHandle);
                _logger.LogDebug("BuzzerAndLEDControl result=0x{Result:X2}", result);
            }
        }

        // â”€â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        /// <summary>
        /// Parse first EPC from inventory buffer.
        /// Supports both frame variants: Len=payload and Len=EPC length.
        /// </summary>
        private static string? ParseFirstEpc(byte[] buffer, int totalLen, int cardCount)
        {
            if (totalLen <= 0 || cardCount <= 0) return null;

            try
            {
                int len = buffer[0];
                if (len <= 0)
                    return null;

                // Case A: [Len][EPC(Len)][RSSI?]
                if (1 + len <= totalLen)
                {
                    var epcDirect = new byte[len];
                    Array.Copy(buffer, 1, epcDirect, 0, len);
                    if (LooksLikeEpc(epcDirect))
                    {
                        return BitConverter.ToString(epcDirect).Replace("-", "");
                    }
                }

                // Case B: [Len][Payload...], where payload starts with PC(2B).
                if (1 + len <= totalLen)
                {
                    var payload = new byte[len];
                    Array.Copy(buffer, 1, payload, 0, len);

                    if (payload.Length >= 2)
                    {
                        int pc = (payload[0] << 8) | payload[1];
                        int epcLenFromPc = ((pc >> 11) & 0x1F) * 2;
                        if (epcLenFromPc > 0 && epcLenFromPc <= payload.Length - 2)
                        {
                            var epcByPc = new byte[epcLenFromPc];
                            Array.Copy(payload, 2, epcByPc, 0, epcLenFromPc);
                            return BitConverter.ToString(epcByPc).Replace("-", "");
                        }
                    }

                    if (payload.Length > 2)
                    {
                        var epcFallback = new byte[payload.Length - 2];
                        Array.Copy(payload, 2, epcFallback, 0, epcFallback.Length);
                        return BitConverter.ToString(epcFallback).Replace("-", "");
                    }
                }

                // Case C: [Len][PC(2)][EPC(Len)]
                if (3 + len <= totalLen)
                {
                    var epcBytes = new byte[len];
                    Array.Copy(buffer, 3, epcBytes, 0, len);
                    return BitConverter.ToString(epcBytes).Replace("-", "");
                }

                return null;
            }
            catch
            {
                return null;
            }
        }

        private static bool LooksLikeEpc(byte[] data)
        {
            if (data.Length < 8 || data.Length > 64)
                return false;

            foreach (var b in data)
            {
                if (b != 0)
                {
                    return true;
                }
            }

            return false;
        }

        private static ReaderConnectionSettings NormalizeSettings(ReaderConnectionSettings settings)
        {
            return new ReaderConnectionSettings
            {
                IsMockMode = settings.IsMockMode,
                MockAutoGenerate = settings.MockAutoGenerate,
                PollIntervalMs = Math.Clamp(settings.PollIntervalMs, 200, 60000),
                ConnectionType = string.IsNullOrWhiteSpace(settings.ConnectionType)
                    ? "TCP"
                    : settings.ConnectionType.Trim().ToUpperInvariant(),
                IpAddress = string.IsNullOrWhiteSpace(settings.IpAddress)
                    ? "192.168.1.100"
                    : settings.IpAddress.Trim(),
                NetworkPort = settings.NetworkPort is > 0 and <= 65535 ? settings.NetworkPort : 8160,
                ComPort = settings.ComPort is > 0 and <= 256 ? settings.ComPort : 1,
                BaudRate = Math.Clamp(settings.BaudRate, 0, 255),
                PowerDbm = Math.Clamp(settings.PowerDbm, 0, 33),
                ScanTime100Ms = Math.Clamp(settings.ScanTime100Ms, 3, 255),
                PauseAfterDetectMs = Math.Clamp(settings.PauseAfterDetectMs, 0, 60000),
                PauseScope = string.Equals(settings.PauseScope, "SAMETAG", StringComparison.OrdinalIgnoreCase)
                    ? "SAMETAG"
                    : "ANYTAG"
            };
        }

        private void ApplySettingsInMemory(ReaderConnectionSettings settings)
        {
            _isMockMode = settings.IsMockMode;
            _mockAutoGenerate = settings.MockAutoGenerate;
            _pollIntervalMs = settings.PollIntervalMs;
            _connectionType = settings.ConnectionType;
            _ipAddress = settings.IpAddress;
            _networkPort = settings.NetworkPort;
            _comPort = settings.ComPort;
            _baudRate = (byte)settings.BaudRate;
            _powerDbm = (byte)settings.PowerDbm;
            _scanTime100Ms = (byte)settings.ScanTime100Ms;
            _pauseAfterDetectMs = settings.PauseAfterDetectMs;
            _pauseScope = settings.PauseScope;
        }

        private void InitializeReaderParameters()
        {
            if (_isMockMode || !_isConnected || _portHandle < 0)
            {
                return;
            }

            try
            {
                var addr = _comAddress;
                var powerResult = U861Native.SetPowerDbm(ref addr, _powerDbm, _portHandle);
                _logger.LogInformation("SetPowerDbm({Power}) result=0x{Result:X2}", _powerDbm, powerResult);

                var scanTime = _scanTime100Ms;
                var scanResult = U861Native.WriteScanTime(ref addr, ref scanTime, _portHandle);
                _logger.LogInformation("WriteScanTime({ScanTime}) result=0x{Result:X2}", _scanTime100Ms, scanResult);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Reader parameter initialization failed");
            }
        }

        private void SyncReaderInformation()
        {
            if (_isMockMode || !_isConnected || _portHandle < 0)
            {
                return;
            }

            try
            {
                var addr = _comAddress;
                var versionInfo = new byte[2];
                var trType = new byte[2];
                byte readerType = 0;
                byte maxFrequency = 0;
                byte minFrequency = 0;
                byte powerDbm = 0;
                byte scanTime = 0;

                var result = U861Native.GetReaderInformation(
                    ref addr,
                    versionInfo,
                    ref readerType,
                    trType,
                    ref maxFrequency,
                    ref minFrequency,
                    ref powerDbm,
                    ref scanTime,
                    _portHandle);

                if (result == 0)
                {
                    _comAddress = addr;
                    _logger.LogInformation(
                        "GetReaderInformation ok: Addr=0x{Addr:X2}, Version={Ver0:00}.{Ver1:00}, Power={Power}, ScanTime={Scan}",
                        _comAddress, versionInfo[0], versionInfo[1], powerDbm, scanTime);
                }
                else
                {
                    _logger.LogWarning("GetReaderInformation failed during sync, result=0x{Result:X2}", result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SyncReaderInformation failed");
            }
        }

        private void SetLastCard(string card)
        {
            lock (_lock) { _lastCard = card; }
        }

        private void ClearLastCard()
        {
            lock (_lock) { _lastCard = string.Empty; }
        }

        public void Dispose()
        {
            Disconnect();
        }
    }
}


