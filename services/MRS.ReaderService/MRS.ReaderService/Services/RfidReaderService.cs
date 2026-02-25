using System.Timers;

namespace MRS.ReaderService.Services
{
    public class RfidReaderService
    {
        private readonly System.Timers.Timer _timer;
        private string _lastCard = string.Empty;
        private bool _isMockMode = true;

        public RfidReaderService()
        {
            _timer = new System.Timers.Timer(3000);
            _timer.Elapsed += (s, e) => Listen();
            _timer.Start();
        }

        private void Listen()
        {
            if (_isMockMode)
            {
                _lastCard = "MOCK-" + DateTime.Now.Ticks.ToString().Substring(10);
            }
            else
            {
                byte[] buffer = new byte[256];
                int result = U861Native.ReadCard(buffer);

                if (result == 0)
                {
                    _lastCard = System.Text.Encoding.ASCII.GetString(buffer).Trim();
                }
            }
        }

        public string GetLastCard()
        {
            return _lastCard;
        }
    }
}