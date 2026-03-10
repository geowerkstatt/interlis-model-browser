using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using ModelRepoBrowser.Crawler;
using ModelRepoBrowser.Models;
using ModelRepoBrowser.TestHelpers;
using Moq;
using RichardSzalay.MockHttp;
using System.Net;
using System.Text;

namespace ModelRepoBrowser;

[TestClass]
public class RepositoryCrawlerTest
{
    private FakeLogger<RepositoryCrawler> logger;
    private Mock<IHttpClientFactory> httpClientFactory;
    private RepositoryCrawler repositoryCrawler;
    private MockHttpMessageHandler mockHttp;
    private Dictionary<string, MockedRequest> mockRequests;

    [TestInitialize]
    public void Initialize()
    {
        mockHttp = new MockHttpMessageHandler();
        mockRequests = SetupHttpMockFiles();

        SetupRepositoryCrawlerInstance(mockHttp.ToHttpClient());
    }

    private Dictionary<string, MockedRequest> SetupHttpMockFiles()
    {
        var mockRequests = new Dictionary<string, MockedRequest>();
        foreach (var dir in Directory.GetDirectories("./Testdata"))
        {
            foreach (var file in Directory.GetFiles(dir))
            {
                var url = $"https://{Path.GetFileName(dir)}/{Path.GetFileName(file)}";
                mockRequests.Add(url, mockHttp
                    .When(url)
                    .Respond("application/xml", new FileStream(file, FileMode.Open, FileAccess.Read)));
            }

            mockHttp
                .When(HttpMethod.Head, $"https://{Path.GetFileName(dir)}/")
                .Respond(HttpStatusCode.OK);
        }

        mockHttp.Fallback.Respond(HttpStatusCode.NotFound);
        return mockRequests;
    }

    private void SetupRepositoryCrawlerInstance(HttpClient httpClient)
    {
        logger = new FakeLogger<RepositoryCrawler>();
        httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory
            .Setup(cf => cf.CreateClient(""))
            .Returns(httpClient);
        repositoryCrawler = new RepositoryCrawler(logger, httpClientFactory.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        httpClientFactory.VerifyAll();
    }

    [TestMethod]
    public async Task CrawlerFindsAllRepositoriesInTree()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.interlis.testdata" });
        Assert.IsNotNull(result);
        result
            .AssertSingleItem("https://models.interlis.testdata/", AssertModelsInterlisCh)
            .AssertSingleItem("https://models.geo.admin.testdata/", AssertModelsGeoAdminCh)
            .AssertAllNotNull()
            .AssertCount(3);
    }

    [TestMethod]
    public async Task CrawlerProducesErrorLogsIfIlisiteXmlIsNotFound()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://undefined.models.testdata" });
        Assert.IsNotNull(result);
        result.AssertCount(0);
        Assert.AreEqual(1, logger.Collector.GetSnapshot().Count(l => l.Level == LogLevel.Error && l.Message.Contains("Analysis of https://undefined.models.testdata/ failed.")));
    }

    [TestMethod]
    public async Task CrawlerProducesWarningLogsIfIlidataXmlIsNotFound()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.interlis.testdata" });
        Assert.IsNotNull(result);
        result.Keys
            .AssertContains("https://models.interlis.testdata/")
            .AssertContains("https://models.multiparent.testdata/")
            .AssertContains("https://models.geo.admin.testdata/")
            .AssertCount(3);
        Assert.AreEqual(1, logger.Collector.GetSnapshot().Count(l => l.Level == LogLevel.Warning && l.Message.Contains("Could not analyse https://models.interlis.testdata/ilidata.xml.")));
    }

    private void AssertModelsInterlisCh(Repository repository)
    {
        Assert.AreEqual("https://models.interlis.testdata/", repository.HostNameId);
        Assert.AreEqual(new Uri("https://models.interlis.testdata/"), repository.Uri);
        Assert.AreEqual("interlis.ch", repository.Name);
        Assert.AreEqual("Allgemeine technische INTERLIS-Modelle", repository.Title);
        Assert.AreEqual("Modell-Ablage des INTERLIS-Kernteams", repository.ShortDescription);
        Assert.AreEqual("http://www.interlis.ch", repository.Owner);
        Assert.AreEqual("mailto:info@interlis.ch", repository.TechnicalContact);
        repository.SubsidiarySites
            .AssertSingleItem(ss => "https://models.geo.admin.testdata/".Equals(ss.HostNameId, StringComparison.OrdinalIgnoreCase), AssertModelsGeoAdminCh)
            .AssertCount(2);
        repository.ParentSites.AssertCount(0);
        repository.Models
            .AssertCount(76)
            .AssertAllNotNull();
        repository.Catalogs
            .AssertCount(0);
    }

    private void AssertModelsGeoAdminCh(Repository repository)
    {
        Assert.AreEqual("https://models.geo.admin.testdata/", repository.HostNameId);
        Assert.AreEqual(new Uri("https://models.geo.admin.testdata/"), repository.Uri);
        Assert.AreEqual("models.geo.admin.ch", repository.Name);
        Assert.AreEqual("Geobasisdaten-Modell-Ablage", repository.Title);
        Assert.AreEqual("Modell-Ablage fuer Datenmodelle der Geobasisdaten des Bundesrechts", repository.ShortDescription);
        Assert.AreEqual("http://www.geo.admin.ch", repository.Owner);
        Assert.AreEqual("mailto:models@geo.admin.ch", repository.TechnicalContact);
        repository.SubsidiarySites
            .AssertCount(1)
            .AssertAllNotNull();
        repository.ParentSites
            .AssertCount(1)
            .AssertAllNotNull();
        repository.Models
            .AssertCount(1258)
            .AssertAllNotNull();
        repository.Catalogs
            .AssertCount(165)
            .AssertSingleItem(
            c => "ch.admin.geo.models.bearbeitungsstatus_kataloge_20140701".Equals(c.Identifier, StringComparison.Ordinal),
            AssertBearbeitungstatusCatalog);
    }

    private void AssertBearbeitungstatusCatalog(Catalog catalog)
    {
        Assert.AreEqual("ch.admin.geo.models.bearbeitungsstatus_kataloge_20140701", catalog.Identifier);
        Assert.AreEqual("2014-07-01", catalog.Version);
        Assert.AreEqual(null, catalog.PrecursorVersion);
        Assert.AreEqual(new DateTime(2014, 7, 1, 0, 0, 0, DateTimeKind.Utc), catalog.PublishingDate);
        Assert.AreEqual("mailto:models@geo.admin.ch", catalog.Owner);
        Assert.AreEqual(string.Empty, catalog.Title);
        catalog.File
            .AssertContains("https://models.geo.admin.testdata/BLW/bearbeitungsstatus_kataloge_20140701.xml")
            .AssertCount(1);
        catalog.ReferencedModels
            .AssertContains("Biodiversitaetsfoerderflaechen_Qualitaetsstufe_II_und_Vernetzung_LV95_V1_3")
            .AssertContains("Bearbeitungsstatus_V1_2")
            .AssertCount(23)
            .AssertAllNotNull();
    }

    [TestMethod]
    public async Task CrawlerPerformsHttpsUpgrade()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .Expect(HttpMethod.Head, "https://models.interlis.testdata")
            .Respond(HttpStatusCode.OK);
        mockHttp
            .Expect("https://models.interlis.testdata/ilisite.xml")
            .Respond(HttpStatusCode.NotFound);
        mockHttp
            .Expect("https://models.interlis.testdata/ilimodels.xml")
            .Respond(HttpStatusCode.NotFound);
        mockHttp
            .Expect("https://models.interlis.testdata/ilidata.xml")
            .Respond(HttpStatusCode.NotFound);

        SetupRepositoryCrawlerInstance(mockHttp.ToHttpClient());
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "http://models.interlis.testdata" });

        result.AssertCount(0);
        mockHttp.VerifyNoOutstandingExpectation();
    }

    [TestMethod]
    public async Task CrawlerUsesFallbackUrlIfHttpsFails()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .Expect(HttpMethod.Head, "https://models.interlis.testdata")
            .Respond(HttpStatusCode.HttpVersionNotSupported);
        mockHttp
            .Expect("http://models.interlis.testdata/ilisite.xml")
            .Respond(HttpStatusCode.NotFound);
        mockHttp
            .Expect("http://models.interlis.testdata/ilimodels.xml")
            .Respond(HttpStatusCode.NotFound);
        mockHttp
            .Expect("http://models.interlis.testdata/ilidata.xml")
            .Respond(HttpStatusCode.NotFound);

        SetupRepositoryCrawlerInstance(mockHttp.ToHttpClient());
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "http://models.interlis.testdata" });

        result.AssertCount(0);
        mockHttp.VerifyNoOutstandingExpectation();
    }

    [TestMethod]
    public async Task CrawlerSkipsMultipleOccurences()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.interlis.testdata" });
        result
            .AssertSingleItem("https://models.multiparent.testdata/", AssertModelsMultiparentCh)
            .AssertCount(3)
            .AssertAllNotNull();
    }

    private void AssertModelsMultiparentCh(Repository repository)
    {
        Assert.AreEqual("https://models.multiparent.testdata/", repository.HostNameId);
        Assert.AreEqual(new Uri("https://models.multiparent.testdata/"), repository.Uri);
        Assert.AreEqual("Minimal Multi Parent Repo", repository.Name);
        Assert.IsNull(repository.Title);
        Assert.IsNull(repository.ShortDescription);
        Assert.IsNull(repository.Owner);
        Assert.IsNull(repository.TechnicalContact);
        repository.SubsidiarySites
            .AssertCount(0);
        repository.ParentSites
            .AssertSingleItem(ps => "https://models.interlis.testdata/".Equals(ps.HostNameId, StringComparison.OrdinalIgnoreCase), AssertModelsInterlisCh)
            .AssertSingleItem(ps => "https://models.geo.admin.testdata/".Equals(ps.HostNameId, StringComparison.OrdinalIgnoreCase), AssertModelsGeoAdminCh)
            .AssertCount(2);
        repository.Models
            .AssertCount(7);
        repository.Catalogs
            .AssertCount(0);
    }

    [TestMethod]
    public async Task CrawlerDoesSupportBadFormattedXml()
    {
        mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When($"https://models.interlis.testdata/ilidata.xml")
            .Respond("application/xml", new MemoryStream(Encoding.UTF8.GetBytes("Bad Formatted xml stream")));
        mockHttp
            .When($"https://models.geo.admin.testdata/ilimodels.xml")
            .Respond("application/xml", new MemoryStream(Encoding.UTF8.GetBytes("Bad Formatted xml stream")));
        mockHttp
            .When($"https://models.multiparent.testdata/ilisite.xml")
            .Respond("application/xml", new MemoryStream(Encoding.UTF8.GetBytes("Bad Formatted xml stream")));

        SetupHttpMockFiles();
        SetupRepositoryCrawlerInstance(mockHttp.ToHttpClient());

        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.interlis.testdata" });
        result
            .AssertCount(2)
            .AssertAllNotNull();
    }

    [TestMethod]
    public async Task CrawlerCompletesMissingMD5()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.multiparent.testdata" });
        Assert.IsNotNull(result);
        result.AssertCount(1).Single().Value.Models.AssertCount(7);

        await repositoryCrawler.FetchInterlisFiles(Enumerable.Empty<InterlisFile>(), result.Values);
        Assert.IsNotNull(result);
        result.AssertCount(1);

        result.AssertSingleItem("https://models.multiparent.testdata/", repository =>
        {
            repository.Models
                .AssertCount(7)
                .AssertSingleItem(m => m.Name == "Test_Model_Without_MD5", m => Assert.AreEqual("EB137F3B28D3D06C41F20237886A8B41", m.MD5))
                .AssertSingleItem(m => m.Name == "Test_Model_With_Empty_MD5", m => Assert.AreEqual("EB137F3B28D3D06C41F20237886A8B41", m.MD5))
                .AssertSingleItem(m => m.Name == "Test_Model_Without_MD5_And_Invalid_File", m => Assert.AreEqual(null, m.MD5))
                .AssertSingleItem(m => m.Name == "Test_Model_With_Correct_MD5", m => Assert.AreEqual("eb137f3b28d3d06c41f20237886a8b41", m.MD5))
                .AssertSingleItem(m => m.Name == "Test_Model_With_Wrong_MD5", m => Assert.AreEqual("85d9577a5d8d9115484cdf2c0917c802", m.MD5))
                .AssertSingleItem(m => m.Name == "TwoModelsInOneFile_Model1", m => Assert.AreEqual("17dd3681a880848baef146904991c36b", m.MD5))
                .AssertSingleItem(m => m.Name == "TwoModelsInOneFile_Model2", m => Assert.AreEqual("17dd3681a880848baef146904991c36b", m.MD5));
        });
    }

    [TestMethod]
    public async Task CrawlerFetchesFileOnce()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.multiparent.testdata" });
        Assert.IsNotNull(result);
        result.AssertCount(1).Single().Value.Models.AssertCount(7);

        await repositoryCrawler.FetchInterlisFiles(Enumerable.Empty<InterlisFile>(), result.Values);
        Assert.IsNotNull(result);
        result.AssertCount(1);

        Assert.AreEqual(1, mockHttp.GetMatchCount(mockRequests["https://models.multiparent.testdata/TwoModelsInOneFile.ili"]));
        Assert.AreEqual(3, mockHttp.GetMatchCount(mockRequests["https://models.multiparent.testdata/TestModel.ili"]), "Missing or wrong MD5 hashes in ilimodels.xml lead to refetches.");
    }

    [TestMethod]
    public async Task CrawlerUsesExistingFile()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.multiparent.testdata" });
        Assert.IsNotNull(result);
        result.AssertCount(1).Single().Value.Models.AssertCount(7);

        var expectedContent = "Expected Content NISECTIOUSIS";
        await repositoryCrawler.FetchInterlisFiles([new InterlisFile { MD5 = "17DD3681A880848BAEF146904991C36B", Content = expectedContent }], result.Values);
        Assert.IsNotNull(result);
        result.AssertCount(1);

        Assert.AreEqual(0, mockHttp.GetMatchCount(mockRequests["https://models.multiparent.testdata/TwoModelsInOneFile.ili"]));
        result.Single().Value.Models
            .AssertSingleItem(m => m.Name == "TwoModelsInOneFile_Model1", m => Assert.AreEqual(expectedContent, m.FileContent.Content))
            .AssertSingleItem(m => m.Name == "TwoModelsInOneFile_Model2", m => Assert.AreEqual(expectedContent, m.FileContent.Content));
    }

    [TestMethod]
    public async Task ReplacedCatalogsReferencedByPrecurserVersionAreDiscarded()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.geo.admin.testdata" });

        result.AssertSingleItem("https://models.geo.admin.testdata/", repository =>
        {
            repository.Catalogs
                .AssertContainsNot(m => m.Identifier == "ch.admin.geo.models.UtilizzazionePrincipale_CH_V1_1" && m.Version == "2019-08-09")
                .AssertSingleItem(m => m.Identifier == "ch.admin.geo.models.UtilizzazionePrincipale_CH_V1_1", c =>
                {
                    Assert.AreEqual("2021-11-01", c.Version);
                    Assert.AreEqual("2019-08-09", c.PrecursorVersion);
                })
                .AssertContainsNot(m => m.Identifier == "ch.admin.geo.models.SafetyZonePlan_Catalogues_V1_3_20211125" && m.Version == "2021-11-25")
                .AssertSingleItem(m => m.Identifier == "ch.admin.geo.models.SafetyZonePlan_Catalogues_V1_3_20211125", c =>
                {
                    Assert.AreEqual("2022-02-04", c.Version);
                    Assert.AreEqual("2021-11-25", c.PrecursorVersion);
                })
                .AssertContainsNot(m => m.Identifier == "ch.admin.geo.models.OeREBKRM_V2_0_Texte_20220301" && m.Version == "2022-05-17")
                .AssertContainsNot(m => m.Identifier == "ch.admin.geo.models.OeREBKRM_V2_0_Texte_20220301" && m.Version == "2022-03-01")
                .AssertSingleItem(m => m.Identifier == "ch.admin.geo.models.OeREBKRM_V2_0_Texte_20220301", c =>
                {
                    Assert.AreEqual("2022-06-07", c.Version);
                    Assert.AreEqual("2022-05-17", c.PrecursorVersion);
                });
        });
    }

    [TestMethod]
    public async Task IgnoreList()
    {
        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions
        {
            RootRepositoryUri = "https://models.interlis.testdata",
            RepositoryIgnoreList = { "http://models.geo.admin.testdata", "http://models.multiparent.testdata/", "https://models.interlis.testdata/only/sub/path/ignored" },
        });

        Assert.IsNotNull(result);
        result
            .AssertSingleItem(kvp => kvp.Key.Equals("https://models.interlis.testdata/", StringComparison.OrdinalIgnoreCase))
            .AssertContainsNot(kvp => kvp.Key.Equals("https://models.geo.admin.testdata/", StringComparison.OrdinalIgnoreCase))
            .AssertAllNotNull()
            .AssertCount(1);
    }

    [TestMethod]
    public async Task CrawlerHandlesTimeouts()
    {
        mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://models.interlis.testdata/ilidata.xml")
            .Throw(new OperationCanceledException());
        mockHttp
            .When("https://models.geo.admin.testdata/ilimodels.xml")
            .Throw(new OperationCanceledException());
        mockHttp
            .When("https://models.multiparent.testdata/ilisite.xml")
            .Throw(new OperationCanceledException());

        SetupHttpMockFiles();
        SetupRepositoryCrawlerInstance(mockHttp.ToHttpClient());

        var result = await repositoryCrawler.CrawlModelRepositories(new RepositoryCrawlerOptions { RootRepositoryUri = "https://models.interlis.testdata" });
        Assert.IsNotNull(result);
        result.Keys
            .AssertContains("https://models.interlis.testdata/")
            .AssertCount(1);

        Assert.AreEqual(1, logger.Collector.GetSnapshot().Count(l => l.Level == LogLevel.Warning && l.Message.Contains("Could not analyse https://models.interlis.testdata/ilidata.xml.")));
        Assert.AreEqual(1, logger.Collector.GetSnapshot().Count(l => l.Level == LogLevel.Error && l.Message.Contains("Analysis of https://models.geo.admin.testdata/ failed.")));
        Assert.AreEqual(1, logger.Collector.GetSnapshot().Count(l => l.Level == LogLevel.Error && l.Message.Contains("Analysis of https://models.multiparent.testdata/ failed.")));
    }
}
