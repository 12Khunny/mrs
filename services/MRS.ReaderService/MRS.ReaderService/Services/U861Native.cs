using System.Runtime.InteropServices;

namespace MRS.ReaderService.Services
{
    public static class U861Native
    {
        [DllImport("SID_U861.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int ReadCard(byte[] buffer);
    }
}