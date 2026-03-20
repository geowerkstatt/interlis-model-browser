namespace ModelRepoBrowser.Models;

public class SearchQuery
{
    public int Id { get; set; }

    public string Query { get; set; }

    public DateTime SearchedAt { get; set; }

    public string? Language { get; set; }
}
