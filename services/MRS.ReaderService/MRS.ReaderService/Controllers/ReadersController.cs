using Microsoft.AspNetCore.Mvc;
using MRS.ReaderService.Models;

namespace MRS.ReaderService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReadersController : ControllerBase
    {
        private static List<Reader> readers = new();
        private static int nextId = 1;

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(readers);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var reader = readers.FirstOrDefault(r => r.Id == id);

            if (reader == null)
                return NotFound();

            return Ok(reader);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Reader reader)
        {
            reader.Id = nextId++;
            readers.Add(reader);

            return CreatedAtAction(nameof(GetById), new { id = reader.Id }, reader);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var reader = readers.FirstOrDefault(r => r.Id == id);

            if (reader == null)
                return NotFound();

            readers.Remove(reader);
            return NoContent();
        }
    }
}