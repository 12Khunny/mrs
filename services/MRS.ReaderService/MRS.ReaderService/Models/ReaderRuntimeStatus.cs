namespace MRS.ReaderService.Models
{
    public class ReaderRuntimeStatus
    {
        public bool IsMockMode { get; set; }

        public bool IsConnected { get; set; }

        public int LastConnectResultCode { get; set; }

        public string? LastError { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }

        public int ScanAttemptCount { get; set; }

        public int ScanSuccessCount { get; set; }

        public int LastInventoryResultCode { get; set; }

        public int LastInventoryCardCount { get; set; }

        public int LastInventoryTotalLen { get; set; }

        public DateTimeOffset? LastInventoryAt { get; set; }

        public DateTimeOffset? LastCardDetectedAt { get; set; }

        public ReaderConnectionSettings Settings { get; set; } = new();
    }
}
