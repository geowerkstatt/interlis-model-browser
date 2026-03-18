using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using ModelRepoBrowser;
using ModelRepoBrowser.Crawler;
using Npgsql;
using System.Reflection;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

var connectionString = builder.Configuration.GetConnectionString("RepoBrowserContext");
builder.Services.AddNpgsql<RepoBrowserContext>(connectionString!, options => options.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));

builder.Services.AddControllers().AddJsonOptions(options => { options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; });

builder.Services.AddTransient<IRepositoryCrawler, RepositoryCrawler>().AddHttpClient();
builder.Services.AddHostedService<DbUpdateService>();
builder.Services.AddSingleton<DbUpdateServiceHealthCheck>();
builder.Services.AddSwaggerGen(options =>
{
    // Include existing documentation in Swagger UI.
    options.IncludeXmlComments(
        Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml"));

    // Custom order in Swagger UI.
    options.OrderActionsBy(apiDescription =>
    {
#pragma warning disable CA1861 // Avoid constant arrays as arguments
        var customOrder = new[] { "Search", "Model", "Version" };
#pragma warning restore CA1861 // Avoid constant arrays as arguments
        var controllerName = (apiDescription.ActionDescriptor as ControllerActionDescriptor)?.ControllerName;
        return $"{Array.IndexOf(customOrder, controllerName)}";
    });

    options.EnableAnnotations();
    options.SupportNonNullableReferenceTypes();
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "INTERLIS Model Browser REST API",
    });
});

builder.Services.AddHealthChecks()
    .AddCheck<RepoBrowserDbHealthCheck>("RepoBrowserDbHealthCheck")
    .AddCheck<DbUpdateServiceHealthCheck>("DbUpdateServiceHealthCheck");

builder.Services.Configure<RouteOptions>(options => options.LowercaseUrls = true);

var app = builder.Build();

var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
NpgsqlLoggingConfiguration.InitializeLogging(loggerFactory);

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSwagger(options =>
{
    options.RouteTemplate = "api/{documentName}/swagger.json";
});

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/api/v1/swagger.json", "INTERLIS Model Browser REST API");
    options.RoutePrefix = "api";
    options.DocumentTitle = "INTERLIS Model Browser API Documentation";
});

app.MapHealthChecks("/health");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<RepoBrowserContext>();
    context.Database.EnsureCreated();
}

app.Run();
