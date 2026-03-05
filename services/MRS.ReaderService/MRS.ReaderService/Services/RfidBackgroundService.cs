using Microsoft.AspNetCore.SignalR;
using MRS.ReaderService.Hubs;

namespace MRS.ReaderService.Services
{
    public class RfidBackgroundService : BackgroundService
    {
        private readonly IHubContext<RfidHub> _hubContext;
        private readonly ILogger<RfidBackgroundService> _logger;
        private readonly RfidReaderService _readerService;

        public RfidBackgroundService(
            IHubContext<RfidHub> hubContext,
            ILogger<RfidBackgroundService> logger,
            RfidReaderService readerService)
        {
            _hubContext    = hubContext;
            _logger        = logger;
            _readerService = readerService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RFID Background Service starting");
            
                        if (!_readerService.IsMockMode)
            {
                var connected = _readerService.Connect();
                if (!connected)
                {
                    _logger.LogError("Could not connect to RFID reader. Service will retry every 5 seconds.");
                }
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // ── Auto-reconnect ──────────────────────────────────────────
                    if (!_readerService.IsMockMode && !_readerService.IsConnected)
                    {
                        _logger.LogWarning("Reader disconnected, attempting reconnect...");
                        _readerService.Connect();
                        await Task.Delay(5000, stoppingToken);
                        continue;
                    }

                    // ── Scan ────────────────────────────────────────────────────
                    // หมายเหตุ: ReadNextCardAsync ใน mock mode มี delay ในตัวอยู่แล้ว
                    // จึง delay เพิ่มเฉพาะ native mode เมื่อไม่เจอ card เท่านั้น
                    var cardNumber = await _readerService.ReadNextCardAsync(stoppingToken);
                    if (string.IsNullOrWhiteSpace(cardNumber))
                    {
                        if (!_readerService.IsMockMode)
                            await Task.Delay(_readerService.PollIntervalMs, stoppingToken);
                        continue;
                    }

                    _logger.LogInformation("Card Detected: {CardNumber}", cardNumber);

                    // ── Beep feedback ───────────────────────────────────────────
                    _readerService.BeepOnSuccess();

                    // ── Broadcast via SignalR ───────────────────────────────────
                    await _hubContext.Clients.All.SendAsync("CardDetected", cardNumber, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "RFID scan error");
                    await Task.Delay(1000, stoppingToken);
                }
            }

            // ── ปิด connection เมื่อ service หยุด ─────────────────────────────────
            _readerService.Disconnect();
            _logger.LogInformation("RFID Background Service stopped");
        }
    }
}