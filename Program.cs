using Mapster;
using KirbysBooks.Mappings;
using KirbysBooks.Data;
using KirbysBooks.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;
using KirbysBooks.Extensions;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

// Load environment variables from .env in Development for convenience
if (builder.Environment.IsDevelopment())
{
    var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");
    if (File.Exists(envPath))
    {
        Env.Load(envPath);
    }
}

var configuration = builder.Configuration;

// Configure EF Core Postgres
var connectionString = configuration.GetConnectionString("DefaultConnection") ?? configuration["ConnectionStrings:DefaultConnection"];
if (string.IsNullOrWhiteSpace(connectionString))
{
    // fallback for local development; user should set a real connection string in appsettings.json
    connectionString = "Host=localhost;Database=KirbysBooks;Username=postgres;Password=postgres";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
);

builder.Services.AddScoped<BooksService>();

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
