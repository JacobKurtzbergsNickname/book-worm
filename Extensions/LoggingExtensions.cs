using Serilog;
using Serilog.Events;
using Serilog.Sinks.File;
using Serilog.Sinks.PostgreSQL;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

namespace BookWorm.Extensions;

public static class LoggingExtensions
{
    public static void AddSerilogLogging(this WebApplicationBuilder builder)
    {
        var loggerConfig = new LoggerConfiguration();

        // Default minimum level; use Debug in Development for more verbosity
        if (builder.Environment.IsDevelopment())
        {
            loggerConfig = loggerConfig.MinimumLevel.Is(LogEventLevel.Debug);
        }
        else
        {
            loggerConfig = loggerConfig.MinimumLevel.Is(LogEventLevel.Information);
        }

        // Override noisy namespaces
        loggerConfig = loggerConfig.MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                                     .MinimumLevel.Override("System", LogEventLevel.Warning);

        // Enrichers and global properties
        loggerConfig = loggerConfig.Enrich.FromLogContext()
                                     .Enrich.WithProperty("MachineName", Environment.MachineName)
                                     .Enrich.WithProperty("ThreadId", Environment.CurrentManagedThreadId)
                                     .Enrich.WithProperty("Application", "BookWorm");

        // Sinks: Console and rolling file
        loggerConfig = loggerConfig.WriteTo.Console();
        loggerConfig = loggerConfig.WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day, shared: true);

        // PostgreSQL sink for Warning+ (programmatic to avoid editor JSON schema issues)
        var pgConnection = builder.Configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(pgConnection))
        {
            loggerConfig = loggerConfig.WriteTo.PostgreSQL(
                connectionString: pgConnection,
                tableName: "logs",
                columnOptions: null,
                needAutoCreateTable: true,
                restrictedToMinimumLevel: LogEventLevel.Warning);
        }

        Log.Logger = loggerConfig.CreateLogger();
        builder.Host.UseSerilog();
    }
}
