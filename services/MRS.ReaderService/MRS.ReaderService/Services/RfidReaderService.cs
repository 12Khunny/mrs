using System.Text;

namespace MRS.ReaderService.Services
{
    public class RfidReaderService
    {
        private readonly ILogger<RfidReaderService> _logger;
        private string _lastCard = string.Empty;
        private readonly bool _isMockMode;
        private readonly bool _mockAutoGenerate;
        private readonly int _pollIntervalMs;
        private readonly Lock _lock = new();

        public RfidReaderService(IConfiguration configuration, ILogger<RfidReaderService> logger)
        {
            _logger = logger;
            _isMockMode = configuration.GetValue<bool?>("Rfid:IsMockMode") ?? true;
            _mockAutoGenerate = configuration.GetValue<bool?>("Rfid:MockAutoGenerate") ?? true;
            _pollIntervalMs = Math.Max(200, configuration.GetValue<int?>("Rfid:PollIntervalMs") ?? 3000);

            _logger.LogInformation(
                "RFID reader initialized. Mode: {Mode}, MockAutoGenerate: {MockAutoGenerate}, PollIntervalMs: {PollIntervalMs}",
                _isMockMode ? "Mock" : "Native",
                _mockAutoGenerate,
                _pollIntervalMs);
        }

        public int PollIntervalMs => _pollIntervalMs;
        public bool IsMockMode => _isMockMode;

        public string GetLastCard()
        {
            lock (_lock)
            {
                return _lastCard;
            }
        }

        public async Task<string?> ReadNextCardAsync(CancellationToken cancellationToken)
        {
            if (_isMockMode)
            {
                await Task.Delay(_pollIntervalMs, cancellationToken);

                if (!_mockAutoGenerate)
                {
                    return null;
                }

                var mockCard = "MOCK-" + DateTime.UtcNow.Ticks.ToString()[^6..];
                SetLastCard(mockCard);
                return mockCard;
            }

            byte[] buffer = new byte[256];
            int result = U861Native.ReadCard(buffer);
            if (result != 0)
            {
                return null;
            }

            var card = Encoding.ASCII.GetString(buffer).Trim('\0', ' ', '\r', '\n', '\t');
            if (string.IsNullOrWhiteSpace(card))
            {
                return null;
            }

            SetLastCard(card);
            return card;
        }

        public bool TryInjectMockCard(string? cardNumber, out string? normalizedCardNumber)
        {
            normalizedCardNumber = null;
            if (!_isMockMode)
            {
                return false;
            }

            var card = cardNumber?.Trim();
            if (string.IsNullOrWhiteSpace(card))
            {
                return false;
            }

            normalizedCardNumber = card;
            SetLastCard(card);
            return true;
        }

        private void SetLastCard(string card)
        {
            lock (_lock)
            {
                _lastCard = card;
            }
        }
    }
}
