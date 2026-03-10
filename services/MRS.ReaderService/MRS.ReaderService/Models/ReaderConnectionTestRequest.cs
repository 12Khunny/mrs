using System.ComponentModel.DataAnnotations;

namespace MRS.ReaderService.Models
{
    public class ReaderConnectionTestRequest
    {
        [Required]
        public string IpAddress { get; set; } = string.Empty;

        [Range(1, 65535)]
        public int NetworkPort { get; set; } = 8160;
    }
}
