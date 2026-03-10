using Microsoft.EntityFrameworkCore;
using ModelRepoBrowser.Crawler;
using System.Runtime.CompilerServices;

[assembly:InternalsVisibleTo("ModelRepoBrowser.Test")]
namespace ModelRepoBrowser;

/// <summary>
/// Service that periodically updates the Model Repository Database using <see cref="IRepositoryCrawler"/>.
/// </summary>
public class DbUpdateService : BackgroundService
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly ILogger<DbUpdateService> logger;
    private readonly IConfiguration configuration;
    private readonly TimeOnly preferredTime;
    private readonly DbUpdateServiceHealthCheck healthCheck;

    public DbUpdateService(IServiceScopeFactory scopeFactory, ILogger<DbUpdateService> logger, IConfiguration configuration, DbUpdateServiceHealthCheck healthCheck)
    {
        this.scopeFactory = scopeFactory;
        this.logger = logger;
        this.configuration = configuration;
        this.healthCheck = healthCheck;

        preferredTime = new TimeOnly(1, 0);
    }

    private async Task UpdateModelRepoDatabase()
    {
        logger.LogInformation("Updating ModelRepoDatabase...");

        var crawlerOptions = configuration.GetSection(RepositoryCrawlerOptions.SectionName).Get<RepositoryCrawlerOptions>();
        if (crawlerOptions == null)
        {
            logger.LogError($"Unable to parse configuration {RepositoryCrawlerOptions.SectionName}. Database update skipped.");
            return;
        }

        try
        {
            using var scope = scopeFactory.CreateScope();

            var crawler = scope.ServiceProvider.GetRequiredService<IRepositoryCrawler>();
            var repositories = await crawler.CrawlModelRepositories(crawlerOptions).ConfigureAwait(false);
            using var context = scope.ServiceProvider.GetRequiredService<RepoBrowserContext>();

            var knownParentRepositories = context.Repositories
                .Where(r => r.SubsidiarySites.Any())
                .Select(r => r.HostNameId)
                .ToList();

            var allParentRepositoriesCrawled = knownParentRepositories.All(repositories.ContainsKey);

            if (repositories.Any() && allParentRepositoriesCrawled)
            {
                using var transaction = context.Database.BeginTransaction();

                context.Catalogs.ExecuteDelete();
                context.Models.ExecuteDelete();
                context.Repositories.ExecuteDelete();
                context.SaveChanges();

                await crawler.FetchInterlisFiles(context.InterlisFiles, repositories.Values);
                context.Repositories.AddRange(repositories.Values);
                context.SaveChanges();

                transaction.Commit();
                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("Updating ModelRepoDatabase complete. Inserted {RepositoryCount} repositories.", repositories.Count);
                }
            }
            else
            {
                logger.LogError("Updating ModelRepoDatabase aborted. Crawler could not parse all required repositories.");
            }

            healthCheck.LastDbUpdateSuccessful = true;
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex, "Unable to update ModelRepoDatabase");
            healthCheck.LastDbUpdateSuccessful = false;
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await UpdateModelRepoDatabase().ConfigureAwait(false);

            var delayTime = GetTimeSpanUntilPreferedTime(DateTime.Now, preferredTime);
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("Next ModelRepoDatabase update in {DelayTime}", delayTime);
            }

            await Task.Delay(delayTime, stoppingToken).ConfigureAwait(false);
        }
    }

    internal static TimeSpan GetTimeSpanUntilPreferedTime(DateTime currentDateTime, TimeOnly preferedTime)
    {
        var preferedDateTime = currentDateTime.Date + preferedTime.ToTimeSpan();
        if (preferedDateTime <= currentDateTime)
        {
            preferedDateTime = preferedDateTime.AddDays(1);
        }

        return preferedDateTime - currentDateTime;
    }
}
