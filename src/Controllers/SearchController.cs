using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModelRepoBrowser.Models;
using Swashbuckle.AspNetCore.Annotations;

namespace ModelRepoBrowser.Controllers;

[ApiController]
[Route("[controller]")]
public class SearchController : ControllerBase
{
    private readonly ILogger<SearchController> logger;
    private readonly RepoBrowserContext context;

    public SearchController(ILogger<SearchController> logger, RepoBrowserContext context)
    {
        this.logger = logger;
        this.context = context;
    }

    /// <summary>
    /// Search the Model Repositories for Models that match the <paramref name="query"/>
    /// with their Name, Version, File path or Tags. If the <paramref name="query"/> matches
    /// a catalog name its referenced models are also included in the search result.
    /// Search results can be limited by additionally supplying one or multiple filter parameters:
    /// <paramref name="repositoryNames"/>, <paramref name="issuers"/>, <paramref name="schemaLanguages"/>, <paramref name="dependsOnModels"/>, <paramref name="publishedFrom"/>, <paramref name="publishedTo"/>.
    /// </summary>
    /// <param name="query" example="kgdm">The query string to search for.</param>
    /// <param name="repositoryNames" example='["models.geo.admin.ch", "models.geo.bl.ch"]'>The names of the repositories in which to search.</param>
    /// <param name="issuers" example='["http://www.interlis.ch/models","http://www.geo.admin.ch", "http://models.geo.bl.ch/AfW"]'>The issuers to filter the found models by.</param>
    /// <param name="schemaLanguages" example='["ili1","ili2_2","ili2_3" "ili2_4"]'>The schemaLanguages to filter the found models by.</param>
    /// <param name="dependsOnModels" example='["CHAdminCodes_V1", "GeometryCHLV95_V1"]'>The dependsOnModels list to filter the found models by.</param>
    /// <param name="publishedFrom">The search result contains only models that were published after this date.</param>
    /// <param name="publishedTo">The search result contains only models that were published before this date.</param>
    /// <returns>
    /// The root of the <see cref="Repository"/> tree or <c>null</c> if no <see cref="Model"/>
    /// matched the <paramref name="query"/>. The Repositories contain only <see cref="Model"/>s
    /// that matched the <paramref name="query"/>.
    /// </returns>
    [HttpGet]
    [SwaggerResponse(StatusCodes.Status200OK, "The INTERLIS repository tree containinig all models matching the search.", typeof(Repository), ContentTypes = new[] { "application/json" })]
    [SwaggerResponse(StatusCodes.Status204NoContent, "No INTERLIS model matching the search query exists. No repository tree returned.", ContentTypes = new[] { "application/json" })]
    [SwaggerResponse(StatusCodes.Status400BadRequest, "The server cannot process the request due to invalid or malformed request.", typeof(ProblemDetails), ContentTypes = new[] { "application/json" })]
    public async Task<Repository?> Search(
        [FromQuery] string? query,
        [FromQuery] string[]? repositoryNames = null,
        [FromQuery] string[]? issuers = null,
        [FromQuery] string[]? schemaLanguages = null,
        [FromQuery] string[]? dependsOnModels = null,
        [FromQuery] DateOnly? publishedFrom = null,
        [FromQuery] DateOnly? publishedTo = null)
    {
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Search with query <{SearchQuery}>", query.EscapeNewLines());
        }

        var trimmedQuery = string.IsNullOrEmpty(query) ? "" : query.Trim();

        try
        {
            context.SearchQueries.Add(new()
            {
                Query = trimmedQuery,
                SearchedAt = DateTime.UtcNow,
                Language = Request?.Headers.AcceptLanguage.FirstOrDefault(),
            });
            context.SaveChanges();
        }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "Writing query <{SearchQuery}> to the database log failed.", trimmedQuery.EscapeNewLines());
        }

        var repositories = await SearchRepositories(trimmedQuery, issuers, schemaLanguages, dependsOnModels, publishedFrom, publishedTo).ConfigureAwait(false);

        // Flag results if querystring was found in dependsOnModels
        repositories = repositories.Values.Select(r =>
        {
            r.Models.ToList().ForEach(m =>
            {
                m.IsDependOnModelResult = m.DependsOnModel.Contains(trimmedQuery);
            });
            return r;
        }).ToDictionary(r => r.HostNameId);

        // Create repository tree
        foreach (var repository in repositories.Values)
        {
            repository.SubsidiarySites = repository.SubsidiarySites.Select(c => repositories[c.HostNameId]).ToHashSet();
        }

        repositories = FilterRepositories(repositoryNames, repositories);

        var root = repositories.Values.SingleOrDefault(r => !r.ParentSites.Any());
        if (root != null && PruneEmptyRepositories(root))
        {
            return root;
        }
        else
        {
            return null;
        }
    }

    private Dictionary<string, Repository> FilterRepositories(string[]? repositoryNames, Dictionary<string, Repository> repositories)
    {
        if (repositoryNames != null && !repositoryNames.All(string.IsNullOrEmpty))
        {
            // Filter repos by repositoryNames and include parents.
            repositories = repositories.Values.Where(r => repositoryNames == null || repositoryNames.Contains(r.Name) || HasMatchingChild(r, repositoryNames)).ToDictionary(r => r.HostNameId);

            // Empty subsidiarySites of repos which do not match repo name.
            repositories = repositories.Values.ToList().Select(r =>
            {
                if (!repositoryNames.Contains(r.Name))
                {
                    r.SubsidiarySites
                    .Where(s => !repositories.Any(f => f.Value.Name == s.Name))
                    .ToList()
                    .ForEach(s => r.SubsidiarySites.Remove(s));
                }

                return r;
            }).ToDictionary(r => r.HostNameId);
        }

        return repositories;
    }

    /// <summary>
    /// Get search query suggestions based on <paramref name="query"/>.
    /// </summary>
    /// <param name="query" example="kgdm">The query string to search for.</param>
    /// <param name="repositoryNames" example='["models.geo.admin.ch", "models.geo.bl.ch"]'>The names of the repositories in which to search.</param>
    /// <param name="issuers" example='["http://www.interlis.ch/models","http://www.geo.admin.ch", "http://models.geo.bl.ch/AfW"]'>The issuers to filter the found models by.</param>
    /// <param name="schemaLanguages" example='["ili1","ili2_2","ili2_3" "ili2_4"]'>The schemaLanguages to filter the found models by.</param>
    /// <param name="dependsOnModels" example='["CHAdminCodes_V1", "GeometryCHLV95_V1"]'>The dependsOnModels list to filter the found models by.</param>
    /// <returns>A sequence of <see cref="Model.Name"/> related to <paramref name="query"/>.</returns>
    [HttpGet("suggest")]
    [SwaggerResponse(StatusCodes.Status200OK, "The names of all INTERLIS models matching the search.", typeof(IEnumerable<string>), ContentTypes = new[] { "application/json" })]
    [SwaggerResponse(StatusCodes.Status204NoContent, "No INTERLIS model matching the search query exists. Nothing returned.", ContentTypes = new[] { "application/json" })]
    [SwaggerResponse(StatusCodes.Status400BadRequest, "The server cannot process the request due to invalid or malformed request.", typeof(ProblemDetails), ContentTypes = new[] { "application/json" })]
    public async Task<IEnumerable<string>> GetSearchSuggestions([FromQuery] string? query, [FromQuery] string[]? repositoryNames = null, [FromQuery] string[]? issuers = null, [FromQuery] string[]? schemaLanguages = null, [FromQuery] string[]? dependsOnModels = null)
    {
        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Get search options for <{SearchQuery}>", query.EscapeNewLines());
        }

        var trimmedQuery = query?.Trim();
        if (string.IsNullOrEmpty(trimmedQuery))
        {
            return Enumerable.Empty<string>();
        }

        var repositories = await SearchRepositories(trimmedQuery, issuers, schemaLanguages, dependsOnModels).ConfigureAwait(false);
        repositories = FilterRepositories(repositoryNames, repositories);

        return repositories
            .Values
            .SelectMany(r => r.Models)
            .Select(m => m.Name)
            .ToList();
    }

    private bool HasMatchingChild(Repository repo, string[] repositoryNames)
    {
        if (repositoryNames.Contains(repo.Name))
        {
            return true;
        }
        else
        {
            return repo.SubsidiarySites.Any(s => HasMatchingChild(s, repositoryNames));
        }
    }

    private Task<Dictionary<string, Repository>> SearchRepositories(string query, string[]? issuers = null, string[]? schemaLanguages = null, string[]? dependsOnModels = null, DateOnly? publishedFrom = null, DateOnly? publishedTo = null)
    {
        var searchPattern = $"%{EscapeLikePattern(query)}%";

        var modelsNamesFoundFromCatalogs = context.Catalogs
            .Where(c => EF.Functions.ILike(c.Identifier, searchPattern, @"\"))
            .Select(c => c.ReferencedModels)
            .AsEnumerable()
            .SelectMany(c => c)
            .Distinct()
            .ToList();

        if (schemaLanguages != null && schemaLanguages.All(string.IsNullOrEmpty)) schemaLanguages = null;
        if (dependsOnModels != null && dependsOnModels.All(string.IsNullOrEmpty)) dependsOnModels = null;
        if (issuers != null && issuers.All(string.IsNullOrEmpty)) issuers = null;

#pragma warning disable CS8604 // Possible null reference argument.
        return context.Repositories
            .Include(r => r.SubsidiarySites)
            .Include(r => r.ParentSites)
            .Include(r => r.Models
                .Where(m => schemaLanguages == null || schemaLanguages.Any(s => m.SchemaLanguage == s))
                .Where(m => dependsOnModels == null || dependsOnModels.Any(d => m.DependsOnModel.Contains(d)))
                .Where(m => issuers == null || issuers.Any(i => m.Issuer == i))
                .Where(m => m.PublishingDate == null || publishedFrom == null || DateOnly.FromDateTime(m.PublishingDate.Value) >= publishedFrom)
                .Where(m => m.PublishingDate == null || publishedTo == null || DateOnly.FromDateTime(m.PublishingDate.Value) <= publishedTo)
                .Where(m => !EF.Functions.ILike(m.File, "obsolete/%"))
                .Where(m =>
                    EF.Functions.ILike(m.Name, searchPattern, @"\")
                    || EF.Functions.ILike(m.Version, searchPattern, @"\")
                    || EF.Functions.ILike(m.File, searchPattern, @"\")
                    || EF.Functions.ILike(m.Title, searchPattern, @"\")
                    || modelsNamesFoundFromCatalogs.Contains(m.Name)
                    || m.Tags.Contains(query)
                    || m.DependsOnModel.Contains(query)))
            .AsNoTracking()
            .ToDictionaryAsync(r => r.HostNameId);
#pragma warning restore CS8604 // Possible null reference argument.
    }

    /// <summary>
    /// Remove subsidiary repositories that contain no models.
    /// </summary>
    /// <returns><c>true</c> if the <paramref name="repository"/> or any subsidiary repository contains some models, <c>false</c> otherwise.</returns>
    private bool PruneEmptyRepositories(Repository repository)
    {
        repository.SubsidiarySites = repository.SubsidiarySites
            .Where(r => PruneEmptyRepositories(r))
            .ToHashSet();

        return repository.Models.Any() || repository.SubsidiarySites.Any();
    }

    internal string? EscapeLikePattern(string pattern)
    {
        return pattern
            ?.Replace(@"\", @"\\", StringComparison.OrdinalIgnoreCase)
            ?.Replace("_", @"\_", StringComparison.OrdinalIgnoreCase)
            ?.Replace("%", @"\%", StringComparison.OrdinalIgnoreCase);
    }
}
