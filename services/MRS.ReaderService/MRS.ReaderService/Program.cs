using MRS.ReaderService.Hubs;
using MRS.ReaderService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSignalR();
builder.Services.AddSingleton<RfidReaderService>();
builder.Services.AddHostedService<RfidBackgroundService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5261",   // .NET dev HTTP
                "https://localhost:7078",  // .NET dev HTTPS
                "http://localhost:5173",   // Vite / React dev
                "app://."                  // Electron production
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.MapControllers();
app.MapHub<RfidHub>("/rfidHub");
app.MapGet("/api/rfid-monitor.html", (IWebHostEnvironment env) =>
{
    var filePath = Path.Combine(env.ContentRootPath, "rfid-monitor.html");
    return File.Exists(filePath)
        ? Results.File(filePath, "text/html")
        : Results.NotFound("rfid-monitor.html not found");
});
app.MapGet("/api/test.html", () => Results.Redirect("/api/rfid-monitor.html"));

app.Run();