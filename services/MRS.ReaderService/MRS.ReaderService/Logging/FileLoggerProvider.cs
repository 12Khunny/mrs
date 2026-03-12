using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace MRS.ReaderService.Logging
{
    public sealed class FileLoggerProvider : ILoggerProvider
    {
        private readonly string _path;
        private readonly LogLevel _minLevel;
        private readonly ConcurrentDictionary<string, FileLogger> _loggers = new();

        public FileLoggerProvider(string path, LogLevel minLevel = LogLevel.Information)
        {
            _path = path;
            _minLevel = minLevel;
        }

        public ILogger CreateLogger(string categoryName)
        {
            return _loggers.GetOrAdd(categoryName, name => new FileLogger(_path, name, _minLevel));
        }

        public void Dispose()
        {
            _loggers.Clear();
        }
    }

    internal sealed class FileLogger : ILogger
    {
        private static readonly object _lock = new();
        private readonly string _path;
        private readonly string _category;
        private readonly LogLevel _minLevel;

        public FileLogger(string path, string category, LogLevel minLevel)
        {
            _path = path;
            _category = category;
            _minLevel = minLevel;
        }

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => logLevel >= _minLevel && logLevel != LogLevel.None;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            if (formatter == null) return;
            var message = formatter(state, exception);
            var line = $"{DateTimeOffset.UtcNow:O} [{logLevel}] {_category}: {message}";
            if (exception != null)
            {
                line += Environment.NewLine + exception;
            }

            try
            {
                lock (_lock)
                {
                    File.AppendAllText(_path, line + Environment.NewLine);
                }
            }
            catch
            {
                // Swallow logging failures to avoid crashing the service.
            }
        }

        private sealed class NullScope : IDisposable
        {
            public static readonly NullScope Instance = new();
            public void Dispose() { }
        }
    }
}
