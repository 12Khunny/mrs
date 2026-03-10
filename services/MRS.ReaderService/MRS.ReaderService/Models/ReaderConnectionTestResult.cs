namespace MRS.ReaderService.Models
{
    public class ReaderConnectionTestResult
    {
        public bool Success { get; set; }

        public int ResultCode { get; set; }

        public string Message { get; set; } = string.Empty;

        public string IpAddress { get; set; } = string.Empty;

        public int NetworkPort { get; set; }

        public string? Version { get; set; }
    }
}
