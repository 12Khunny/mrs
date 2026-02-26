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
            _logger.LogInformation("RFID Background Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var cardNumber = await _readerService.ReadNextCardAsync(stoppingToken);
                    if (string.IsNullOrWhiteSpace(cardNumber))
                    {
                        await Task.Delay(_readerService.PollIntervalMs, stoppingToken);
                        continue;
                    }

                    _logger.LogInformation("Card Detected: {CardNumber}", cardNumber);

                    await _hubContext.Clients.All
                        .SendAsync("CardDetected", cardNumber, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "RFID Error");
                    await Task.Delay(1000, stoppingToken);
                }
            }

            _logger.LogInformation("RFID Background Service stopped");
        }
    }
}
