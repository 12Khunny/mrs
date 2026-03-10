using System.Text.Json;
using MRS.ReaderService.Models;

namespace MRS.ReaderService.Services
{
    public class ReaderSettingsStore
    {
        private readonly ILogger<ReaderSettingsStore> _logger;
        private readonly string _settingsPath;

        public ReaderSettingsStore(IWebHostEnvironment environment, ILogger<ReaderSettingsStore> logger)
        {
            _logger = logger;
            _settingsPath = Path.Combine(environment.ContentRootPath, "reader-settings.json");
        }

        public ReaderConnectionSettings Load(ReaderConnectionSettings fallback)
        {
            try
            {
                if (!File.Exists(_settingsPath))
                {
                    _logger.LogWarning("Reader settings file not found at {Path}. Creating from fallback.", _settingsPath);
                    Save(fallback);
                    return fallback;
                }

                var json = File.ReadAllText(_settingsPath);
                var fromFile = JsonSerializer.Deserialize<ReaderConnectionSettings>(json);
                _logger.LogInformation("Loaded reader settings from {Path}", _settingsPath);
                return fromFile ?? fallback;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load reader settings from {Path}. Using fallback settings.", _settingsPath);
                return fallback;
            }
        }

        public void Save(ReaderConnectionSettings settings)
        {
            var json = JsonSerializer.Serialize(settings, new JsonSerializerOptions
            {
                WriteIndented = true
            });
            File.WriteAllText(_settingsPath, json);
            _logger.LogInformation("Saved reader settings to {Path}", _settingsPath);
        }
    }
}
