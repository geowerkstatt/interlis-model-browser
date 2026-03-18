using Microsoft.Extensions.Logging.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using ModelRepoBrowser.Controllers;

namespace ModelRepoBrowser;

[TestClass]
public class ModelControllerTest
{
    private RepoBrowserContext context;
    private ModelController controller;

    [TestInitialize]
    public void TestInitialize()
    {
        context = ContextFactory.CreateContext();
        controller = new ModelController(new FakeLogger<ModelController>(), context);
    }

    [TestCleanup]
    public void TestCleanup()
    {
        context.Dispose();
    }

    [TestMethod]
    public void ModelDetails()
    {
        var model = controller.ModelDetails("544a7e2f91f51172f1d471dc3b3ce10c", "Cotton_Officer");
        Assert.AreEqual("Cotton_Officer", model.Name);
        Assert.AreEqual("544a7e2f91f51172f1d471dc3b3ce10c", model.MD5);
        Assert.AreEqual("home/scalable_assistant_georgia.json5", model.File);
        Assert.AreEqual("Papua New Guinea interactive Tasty Sleek navigate", model.Title);
        Assert.IsNotNull(model.ModelRepository, "ModelRepository has to be included.");
        Assert.AreEqual("white", model.ModelRepository.Name);
    }

    [TestMethod]
    public void ModelDetailsWithCatalogs()
    {
        var test = context.Catalogs.Take(10);
        var test1 = context.Models.Where(m => m.Name == "Borders_Home Loan Account");
        var model = controller.ModelDetails("2abd30d77a016df846307c50a621139b", "Borders_Home Loan Account");
        Assert.AreEqual("Borders_Home Loan Account", model.Name);
        Assert.AreEqual("2abd30d77a016df846307c50a621139b", model.MD5);
        Assert.AreEqual("usr/libexec/agp.bz2", model.File);
        Assert.AreEqual("copy orange IB Regional Refined", model.Title);
        Assert.IsNotNull(model.ModelRepository, "ModelRepository has to be included.");
        Assert.AreEqual("g7yn9ioz927y65aoioyjvb4v3b84", model.CatalogueFiles[0]);
    }

    [TestMethod]
    public void ModelDetailsNull()
    {
        Assert.AreEqual(null, controller.ModelDetails(null, null));
        Assert.AreEqual(null, controller.ModelDetails("f69ffd618a0998e13bc20b0e3026d19b", null));
        Assert.AreEqual(null, controller.ModelDetails(null, "Global_Licensed"));
    }

    [TestMethod]
    public void ModelDetailsEmptyString()
    {
        Assert.AreEqual(null, controller.ModelDetails(string.Empty, string.Empty));
        Assert.AreEqual(null, controller.ModelDetails("f69ffd618a0998e13bc20b0e3026d19b", string.Empty));
        Assert.AreEqual(null, controller.ModelDetails(string.Empty, "Global_Licensed"));
    }

    [TestMethod]
    public void ModelDetailsWhitespace()
    {
        Assert.AreEqual(null, controller.ModelDetails(" ", " "));
        Assert.AreEqual(null, controller.ModelDetails("f69ffd618a0998e13bc20b0e3026d19b", " "));
        Assert.AreEqual(null, controller.ModelDetails(" ", "Global_Licensed"));
    }

    [TestMethod]
    public void ModelDetailsOnlyFindsExactMatches()
    {
        Assert.AreEqual(null, controller.ModelDetails("544a7e2f91f5", "otton_Office"));
    }
}
