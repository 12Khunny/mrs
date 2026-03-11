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
            _hubContext = hubContext;
            _logger = logger;
            _readerService = readerService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RFID Background Service starting");

            if (_readerService.IsMockMode)
            {
                _logger.LogWarning("RFID is running in Mock mode; real reader scan is disabled.");
            }

            if (!_readerService.IsMockMode)
            {
                var connected = _readerService.Connect();
                if (!connected)
                {
                    _logger.LogError("Could not connect to RFID reader. Service will retry every 5 seconds.");
                }
            }

            var pauseUntilUtc = DateTimeOffset.MinValue;
            var lastDetectedCard = string.Empty;
            var lastReadAtUtc = DateTimeOffset.UtcNow;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (!_readerService.IsMockMode && !_readerService.IsConnected)
                    {
                        _logger.LogWarning("Reader disconnected, attempting reconnect...");
                        _readerService.Connect();
                        await Task.Delay(5000, stoppingToken);
                        continue;
                    }

                    if (_readerService.PauseAfterDetectMs > 0 &&
                        string.Equals(_readerService.PauseScope, "ANYTAG", StringComparison.OrdinalIgnoreCase) &&
                        pauseUntilUtc > DateTimeOffset.UtcNow)
                    {
                        var waitMs = (int)Math.Max(50, (pauseUntilUtc - DateTimeOffset.UtcNow).TotalMilliseconds);
                        await Task.Delay(waitMs, stoppingToken);
                        continue;
                    }

                    var cardNumber = await _readerService.ReadNextCardAsync(stoppingToken);
                    lastReadAtUtc = DateTimeOffset.UtcNow;
                    if (string.IsNullOrWhiteSpace(cardNumber))
                    {
                        if (!_readerService.IsMockMode &&
                            DateTimeOffset.UtcNow - lastReadAtUtc > TimeSpan.FromSeconds(60))
                        {
                            _logger.LogWarning("No reader activity for over 60 seconds. Reconnecting...");
                            _readerService.Disconnect();
                            _readerService.Connect();
                            lastReadAtUtc = DateTimeOffset.UtcNow;
                        }
                        if (!_readerService.IsMockMode)
                        {
                            await Task.Delay(_readerService.PollIntervalMs, stoppingToken);
                        }
                        continue;
                    }

                    if (_readerService.PauseAfterDetectMs > 0 &&
                        string.Equals(_readerService.PauseScope, "SAMETAG", StringComparison.OrdinalIgnoreCase) &&
                        pauseUntilUtc > DateTimeOffset.UtcNow &&
                        string.Equals(lastDetectedCard, cardNumber, StringComparison.OrdinalIgnoreCase))
                    {
                        await Task.Delay(_readerService.PollIntervalMs, stoppingToken);
                        continue;
                    }

                    if (!string.Equals(lastDetectedCard, cardNumber, StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogInformation("Card Detected: {CardNumber}", cardNumber);
                        lastDetectedCard = cardNumber;
                    }

                    if (_readerService.PauseAfterDetectMs > 0)
                    {
                        pauseUntilUtc = DateTimeOffset.UtcNow.AddMilliseconds(_readerService.PauseAfterDetectMs);
                    }

                    _readerService.BeepOnSuccess();
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

            _readerService.Disconnect();
            _logger.LogInformation("RFID Background Service stopped");
        }
    }
}
