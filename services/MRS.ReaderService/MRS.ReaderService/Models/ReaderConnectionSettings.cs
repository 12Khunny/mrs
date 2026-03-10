using System.ComponentModel.DataAnnotations;

namespace MRS.ReaderService.Models
{
    public class ReaderConnectionSettings
    {
        public bool IsMockMode { get; set; } = true;

        public bool MockAutoGenerate { get; set; } = true;

        [Range(200, 60000)]
        public int PollIntervalMs { get; set; } = 3000;

        [Required]
        public string ConnectionType { get; set; } = "TCP";

        [Required]
        public string IpAddress { get; set; } = "192.168.1.100";

        [Range(1, 65535)]
        public int NetworkPort { get; set; } = 8160;

        [Range(1, 256)]
        public int ComPort { get; set; } = 1;

        [Range(0, 255)]
        public int BaudRate { get; set; } = 4;

        [Range(0, 33)]
        public int PowerDbm { get; set; } = 10;

        [Range(3, 255)]
        public int ScanTime100Ms { get; set; } = 10;

        [Range(0, 60000)]
        public int PauseAfterDetectMs { get; set; } = 0;

        [Required]
        public string PauseScope { get; set; } = "ANYTAG";
    }
}
