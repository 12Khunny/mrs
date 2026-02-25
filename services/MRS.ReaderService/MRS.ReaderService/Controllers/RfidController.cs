using Microsoft.AspNetCore.Mvc;
using MRS.ReaderService.Services;

namespace MRS.ReaderService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RfidController : ControllerBase
    {
        private readonly RfidReaderService _readerService;

        public RfidController(RfidReaderService readerService)
        {
            _readerService = readerService;
        }

        [HttpGet("read")]
        public IActionResult Read()
        {
            var card = _readerService.GetLastCard();

            if (string.IsNullOrEmpty(card))
                return NoContent();

            return Ok(new { cardNumber = card });
        }
    }
}