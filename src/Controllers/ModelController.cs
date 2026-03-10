using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModelRepoBrowser.Models;
using Swashbuckle.AspNetCore.Annotations;

namespace ModelRepoBrowser.Controllers;

[ApiController]
[Route("[controller]")]
public class ModelController : Controller
{
    private readonly ILogger<ModelController> logger;
    private readonly RepoBrowserContext context;

    public ModelController(ILogger<ModelController> logger, RepoBrowserContext context)
    {
        this.logger = logger;
        this.context = context;
    }

    /// <summary>
    /// Retrieve the INTERLIS-Model with the specified <paramref name="md5"/> and <paramref name="name"/>.
    /// </summary>
    /// <param name="md5" example="1fd8e69771af1a3b3177413d5e2f09de">The md5 hash of the model file.</param>
    /// <param name="name" example="SZ_Schutzbauten_Wasser_V1">The name of the model.</param>
    /// <returns>The <see cref="Model"/> with the specified <paramref name="md5"/> and <paramref name="name"/> or <c>null</c> if it does not exist.</returns>
    [HttpGet("{md5}/{name}")]
    [SwaggerResponse(StatusCodes.Status200OK, "The INTERLIS model.", typeof(Model), ContentTypes = new[] { "application/json" })]
    [SwaggerResponse(StatusCodes.Status204NoContent, "The INTERLIS model for the requested md5 and name combination does not exist. No content returned.", ContentTypes = new[] { "application/json" })]
    public Model? ModelDetails(string md5, string name)
    {
        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Get details for Model with hash <{MD5}> and name <{Name}>.", md5.EscapeNewLines(), name.EscapeNewLines());
        }

        var model = context.Models
            .Include(m => m.ModelRepository)
            .Include(m => m.FileContent)
            .Where(m => m.MD5 == md5 && m.Name == name)
            .AsNoTracking()
            .SingleOrDefault();

        if (model != null)
        {
            model.CatalogueFiles = context.Catalogs.Where(c => c.ReferencedModels.Contains(model.Name)).ToList().SelectMany(c => c.File).ToList();
        }

        return model;
    }
}
