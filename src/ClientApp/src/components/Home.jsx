import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router";
import { Autocomplete, Box, Button, CircularProgress, IconButton, TextField, Tooltip, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useForm } from "react-hook-form";
import { Results } from "./Results";
import { FilterValues } from "./FilterValues";
import { getAllModels, sortRepositoryTree, filterRepoTree } from "./Utils";

export function Home() {
  const { register, handleSubmit, watch, reset } = useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [models, setModels] = useState(null);
  const [inputValue, setInputValue] = useState(searchParams.get("query") || "");
  const [value, setValue] = useState("");
  const [hideFilter, setHideFilter] = useState(false);
  const [schemaLanguages, setSchemaLanguages] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [repositoryNames, setRepositoryNames] = useState([]);
  const [dependsOnModels, setDependsOnModels] = useState([]);
  const [repositoryTree, setRepositoryTree] = useState();
  const [searchOptions, setSearchOptions] = useState([]);
  const [loading, setLoading] = useState();
  const [searchUrl, setSearchUrl] = useState();
  const location = useLocation();
  const [filterDefaultValues, setFilterDefaultValues] = useState();

  const { t } = useTranslation("common");

  const getSearchUrl = () => {
    var url = new URL(window.location);
    issuers.forEach((issuer) => {
      if (!url.searchParams.getAll(FilterValues.Issuers).includes(issuer)) {
        url.searchParams.append(FilterValues.Issuers, issuer);
      }
    });
    repositoryNames.forEach((name) => {
      if (!url.searchParams.getAll(FilterValues.RepositoryNames).includes(name)) {
        url.searchParams.append(FilterValues.RepositoryNames, name);
      }
    });
    schemaLanguages.forEach((language) => {
      if (!url.searchParams.getAll(FilterValues.SchemaLanguages).includes(language)) {
        url.searchParams.append(FilterValues.SchemaLanguages, language);
      }
    });
    dependsOnModels.forEach((model) => {
      if (!url.searchParams.getAll(FilterValues.DependsOnModels).includes(model)) {
        url.searchParams.append(FilterValues.DependsOnModels, model);
      }
    });
    if (searchParams.get("hideFilter") === undefined) {
      url.searchParams.append("hideFilter", !!hideFilter);
    }
    setSearchUrl(url);
    return url;
  };

  async function search(searchString) {
    const url = getSearchUrl();
    setFilterDefaultValues(null);
    searchParams.delete("query");
    searchParams.append("query", searchString);
    setSearchParams(searchParams);
    setLoading(true);
    url.searchParams.set("query", searchString);

    const response = await fetch("/search" + url.search);
    if (response.ok) {
      if (response.status === 204 /* No Content */) {
        setModels([]);
        setLoading(false);
      } else {
        const repositoryTree = await response.json();
        // Filter returned repo tree on client to mimic client filter behaviour. Should be moved to backend.
        const filteredTree = filterRepoTree(repositoryTree, searchParams.getAll(FilterValues.RepositoryNames));
        sortRepositoryTree(filteredTree.subsidiarySites);
        setRepositoryTree(filteredTree);
        const models = getAllModels(filteredTree);

        models.sort(
          (a, b) =>
            (b.name.toLowerCase() === searchString.toLowerCase()) -
              (a.name.toLowerCase() === searchString.toLowerCase()) ||
            a.isDependOnModelResult - b.isDependOnModelResult ||
            new Date(b.publishingDate) - new Date(a.publishingDate),
        );
        setModels(models);
        setLoading(false);
      }
    } else {
      setModels([]);
      setLoading(false);
    }
  }

  async function getSearchOptions(searchString) {
    removeQueryParams();
    const url = getSearchUrl();
    if (searchString.length < 3) {
      setSearchOptions([]);
    } else {
      url.searchParams.append("query", searchString);
      const response = await fetch("/search/suggest/" + url.search);
      if (response.ok && response.status !== 204 /* No Content */) {
        const suggestions = await response.json();
        setSearchOptions([...new Set(suggestions)]);
      }
    }
  }

  const onSubmit = (data) => search(data.searchInput);
  const removeQueryParams = () => {
    searchParams.delete("query");
    setSearchParams(searchParams);
  };

  const clear = () => {
    reset({ searchInput: "" });
    setInputValue("");
    setValue("");
    setSearchOptions([]);
    setModels(null);
    removeQueryParams();
  };

  // If component is first loaded with search params present in URL the search should immediately be executed.
  // On first load the hideFilter state and all permanent filters should be set for all following requests.
  useEffect(() => {
    setHideFilter(searchParams.get("hideFilter"));
    searchParams.get(FilterValues.SchemaLanguages)
      ? setSchemaLanguages(searchParams.getAll(FilterValues.SchemaLanguages))
      : setSchemaLanguages([]);
    searchParams.get(FilterValues.Issuers) ? setIssuers(searchParams.getAll(FilterValues.Issuers)) : setIssuers([]);
    searchParams.get(FilterValues.RepositoryNames)
      ? setRepositoryNames(searchParams.getAll(FilterValues.RepositoryNames))
      : setRepositoryNames([]);
    searchParams.get(FilterValues.DependsOnModels)
      ? setDependsOnModels(searchParams.getAll(FilterValues.DependsOnModels))
      : setDependsOnModels([]);
    if (inputValue !== "") {
      search(inputValue);
    } else {
      // Case if user is returning to an empty search after filtering.
      if (location.state || Array.from(searchParams.keys()).includes("query")) {
        search("");
      }
    }
    setFilterDefaultValues(location.state?.filterDefaultValues || null);
  }, []);

  return (
    <Box name="home">
      <form onSubmit={handleSubmit(onSubmit)} name="search-form">
        <Stack mt={20} direction="row" justifyContent="space-between" alignItems="strech">
          <Autocomplete
            freeSolo
            inputValue={inputValue}
            value={value}
            // fired when search option is selected
            onChange={(event, value) => {
              if (value !== null) {
                search(value);
              }
            }}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
              getSearchOptions(newInputValue);
            }}
            options={searchOptions}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                fullWidth
                label={t("search-instructions")}
                variant="outlined"
                {...register("searchInput")}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    style: {
                      padding: 10,
                    },
                    startAdornment: <SearchIcon color="disabled" />,
                    endAdornment: (
                      <Tooltip title={t("reset-search")}>
                        <IconButton
                          sx={{ visibility: watch("searchInput") !== "" || models?.length > 0 ? "visible" : "hidden" }}
                          onClick={clear}
                        >
                          <ClearIcon />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                }}
              />
            )}
          />
          <Button
            sx={{
              marginLeft: "-5px",
              marginBottom: "8px",
              marginTop: "16px",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            type="submit"
            variant="contained"
            aria-label="search"
            color="primary"
          >
            {t("search")}
          </Button>
        </Stack>
      </form>
      {!models && loading && (
        <Box mt={10}>
          <CircularProgress />
        </Box>
      )}
      {models !== null && (
        <Results
          searchUrl={searchUrl}
          models={models}
          repositoryTree={repositoryTree}
          filterDefaultValues={filterDefaultValues}
          setFilterDefaultValues={setFilterDefaultValues}
        ></Results>
      )}
    </Box>
  );
}
