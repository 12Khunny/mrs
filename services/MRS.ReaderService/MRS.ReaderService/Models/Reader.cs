using System.ComponentModel.DataAnnotations;

namespace MRS.ReaderService.Models
{
    public class Reader
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        [Required]
        [MaxLength(50)]
        public required string CardNumber { get; set; }
    }
}