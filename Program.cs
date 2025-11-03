using KirbysBooks.Controllers;
using Mapster;
using KirbysBooks.Mappings;
using KirbysBooks.Data;
using KirbysBooks.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseRouting();

// React fallback (keep static single-page fallback)
app.MapFallbackToFile("index.html");

app.UseAuthorization();

app.MapStaticAssets();
app.MapControllers();

app.Run();