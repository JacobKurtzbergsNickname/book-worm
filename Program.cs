using KirbysBooks.Controllers;
using KirbysBooks.Models;
using KirbysBooks.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<BookDatabaseSettings>(
    builder.Configuration.GetSection("BookDatabase")
);

builder.Services.AddSingleton<BooksService>();

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}


// app.UseHttpsRedirection();
app.UseRouting();

// React fallback
app.MapFallbackToFile("index.html");

app.UseAuthorization();

app.MapStaticAssets();
BooksEndpoints.Map(app);

app.Run();