using Microsoft.AspNetCore.Mvc;
using MRS.ReaderService.Models;
using MRS.ReaderService.Services;

namespace MRS.ReaderService.Controllers
{
    [ApiController]
    [Route("api/settings/reader")]
    public class ReaderSettingsController : ControllerBase
    {
        private readonly RfidReaderService _readerService;

        public ReaderSettingsController(RfidReaderService readerService)
        {
            _readerService = readerService;
        }

        [HttpGet]
        public IActionResult Get()
        {
            return Ok(_readerService.GetConnectionSettingsSnapshot());
        }

        [HttpGet("status")]
        public IActionResult Status()
        {
            return Ok(_readerService.GetRuntimeStatus());
        }

        [HttpPut]
        public IActionResult Save([FromBody] ReaderConnectionSettings settings)
        {
            var saved = _readerService.SaveConnectionSettings(settings);
            return Ok(saved);
        }

        [HttpPost("apply")]
        public IActionResult Apply([FromBody] ReaderConnectionSettings settings)
        {
            var result = _readerService.ApplyConnectionSettings(settings);
            return Ok(result);
        }

        [HttpPost("reconnect")]
        public IActionResult Reconnect()
        {
            _readerService.ResetScanCounters();
            _readerService.Disconnect();
            var connected = _readerService.Connect();

            return Ok(new
            {
                success = connected,
                message = connected ? "Reader connection restarted" : "Reader reconnect failed",
                status = _readerService.GetRuntimeStatus()
            });
        }
    }
}
