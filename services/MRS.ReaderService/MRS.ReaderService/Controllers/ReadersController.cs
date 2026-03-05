using Microsoft.AspNetCore.Mvc;
using MRS.ReaderService.Models;

namespace MRS.ReaderService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReadersController : ControllerBase
    {
        private static readonly object syncRoot = new();
        private static List<Reader> readers = new();
        private static int nextId = 1;

        [HttpGet]
        public IActionResult GetAll()
        {
            lock (syncRoot)
            {
                return Ok(readers.ToList());
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            Reader? reader;
            lock (syncRoot)
            {
                reader = readers.FirstOrDefault(r => r.Id == id);
            }

            if (reader == null)
                return NotFound();

            return Ok(reader);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Reader reader)
        {
            lock (syncRoot)
            {
                reader.Id = nextId++;
                readers.Add(reader);
            }

            return CreatedAtAction(nameof(GetById), new { id = reader.Id }, reader);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            Reader? reader;
            lock (syncRoot)
            {
                reader = readers.FirstOrDefault(r => r.Id == id);

                if (reader == null)
                    return NotFound();

                readers.Remove(reader);
            }
            return NoContent();
        }
    }
}
