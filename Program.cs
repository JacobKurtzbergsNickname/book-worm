using Mapster;
using BookWorm.Mappings;
using BookWorm.Data;
using BookWorm.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;
using BookWorm.Extensions;
using DotNetEnv;
using BookWorm.Interfaces;

// Load environment variables from .env in Development for convenience.
// This must happen before WebApplication.CreateBuilder so the environment variable
// configuration provider picks them up when the builder initialises.
var aspnetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
if (string.Equals(aspnetEnv, "Development", StringComparison.OrdinalIgnoreCase))
{
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    if (File.Exists(envPath))
    {
        Env.Load(envPath);
    }
}

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;

// Configure EF Core Postgres
var connectionString = configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    // fallback for local development; user should set a real connection string in appsettings.json
    connectionString = "Host=localhost;Database=BookWorm;Username=postgres;Password=postgres";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
);

builder.Services.AddHttpClient<IOpenLibraryService, OpenLibraryService>(client =>
{
    client.BaseAddress = new Uri("https://openlibrary.org/");
});
builder.Services.AddScoped<IBooksService, BooksService>();
builder.Services.AddScoped<IOpenLibraryService, OpenLibraryService>();

// Mapster configuration (TypeAdapterConfig)
var mapsterConfig = TypeAdapterConfig.GlobalSettings;
MapsterConfig.Register(mapsterConfig);
builder.Services.AddSingleton(mapsterConfig);

// Add services to the container.
builder.Services.AddControllers();

// Configure Serilog via extension
builder.AddSerilogLogging();

var app = builder.Build();

// Configure the HTTP request pipeline.
// For SPA hosting we serve static files from wwwroot. Use developer exception page in Development.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}

// Serve static files (the built React app lives in wwwroot)
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// Map API controllers first so /api/* endpoints are handled by controllers
app.MapControllers();

// React SPA fallback (serve index.html for non-API routes)
app.MapFallbackToFile("index.html");

try
{
    Log.Information("Starting web host");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
