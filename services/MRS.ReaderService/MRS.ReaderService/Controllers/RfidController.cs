using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MRS.ReaderService.Hubs;
using MRS.ReaderService.Services;

namespace MRS.ReaderService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RfidController : ControllerBase
    {
        private readonly RfidReaderService _readerService;
        private readonly IHubContext<RfidHub> _hubContext;

        public RfidController(RfidReaderService readerService, IHubContext<RfidHub> hubContext)
        {
            _readerService = readerService;
            _hubContext = hubContext;
        }

        [HttpGet("read")]
        public IActionResult Read()
        {
            var card = _readerService.GetLastCard();

            if (string.IsNullOrEmpty(card))
                return NoContent();

            return Ok(new { cardNumber = card });
        }

        [HttpPost("manual")]
        public async Task<IActionResult> Manual([FromBody] ManualCardRequest request, CancellationToken cancellationToken)
        {
            if (!_readerService.TryInjectMockCard(request.CardNumber, out var cardNumber))
            {
                if (!_readerService.IsMockMode)
                {
                    return BadRequest(new { message = "Manual injection is available only in mock mode" });
                }

                return BadRequest(new { message = "cardNumber is required" });
            }

            await _hubContext.Clients.All.SendAsync("CardDetected", cardNumber, cancellationToken);

            return Ok(new
            {
                cardNumber,
                source = "manual",
                broadcast = true
            });
        }

        public class ManualCardRequest
        {
            public string? CardNumber { get; set; }
        }
    }
}
