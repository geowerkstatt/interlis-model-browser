import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Box, Button, ButtonGroup, Chip, Pagination, Stack, Tooltip, Typography } from "@mui/material";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import SellIcon from "@mui/icons-material/Sell";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import RestoreIcon from "@mui/icons-material/Restore";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FlagIcon from "@mui/icons-material/Flag";
import TitleIcon from "@mui/icons-material/Title";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import HubIcon from "@mui/icons-material/Hub";
import MailIcon from "@mui/icons-material/Mail";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import { useTranslation } from "react-i18next";
import { Filter } from "./Filter";
import { SchemaLanguages } from "./SchemaLanguages";
import { DataGrid, GridToolbarColumnsButton } from "@mui/x-data-grid";

export function Results({ models, repositoryTree, searchUrl, filterDefaultValues, setFilterDefaultValues }) {
  const hideFilter = searchUrl.searchParams.get("hideFilter") === "true";
  const { t } = useTranslation("common");
  const [page, setPage] = useState(1);
  const [filterPanelExpanded, setFilterPanelExpanded] = useState(false);
  const [filteredModels, setFilteredModels] = useState(models);
  const [showResultsAsTable, setShowResultsAsTable] = useState(false);

  const modelsPerPage = 10;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const toggleFilter = () => {
    setFilterPanelExpanded(!filterPanelExpanded);
    setFilteredModels(models);
  };

  useEffect(() => {
    setFilteredModels(models);
    setFilterPanelExpanded(false);
  }, [models]);

  useEffect(() => {
    if (filterDefaultValues) {
      setFilterPanelExpanded(true);
    }
  }, [filterDefaultValues]);

  const resultTableColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: t("model-name"),
        hideable: false,
        flex: 2,
        renderCell: (params) => (
          <Link
            style={{ textDecoration: "inherit", fontWeight: "bold" }}
            to={{ pathname: "/detail/" + params.row.mD5 + "/" + params.row.name }}
            state={{ searchQuery: searchUrl.search, filterDefaultValues: filterDefaultValues }}
          >
            {params.value}
          </Link>
        ),
      },
      {
        field: "isDependOnModelResult",
        headerName: t("search-term-was-found-in-depends-on-model"),
        type: "boolean",
        flex: 0.5,
        initVisible: false,
        renderHeader: () => (
          <Tooltip title={t("search-term-was-found-in-depends-on-model")}>
            <HubIcon sx={{ color: "text.secondary", fontSize: "inherit" }} />
          </Tooltip>
        ),
      },
      {
        field: "tags",
        headerName: t("model-tags"),
        flex: 1,
        initVisible: false,
        renderCell: (params) =>
          params.value.map(
            (tag) => tag.length > 0 && <Chip key={tag} size="small" sx={{ margin: "1px" }} label={tag} />,
          ),
      },
      { field: "title", headerName: t("title"), flex: 1, initVisible: false },
      {
        field: "schemaLanguage",
        headerName: t("schema-language"),
        type: "number",
        valueGetter: (value) => ({ ili1: 1, ili2_1: 2.1, ili2_2: 2.2, ili2_3: 2.3, ili2_4: 2.4 })[value],
        flex: 0.5,
      },
      { field: "modelRepository", headerName: t("model-repository"), flex: 2 },
      { field: "version", headerName: t("latest-version"), flex: 1 },
      { field: "issuer", headerName: t("issuer"), flex: 1.5 },
      {
        field: "publishingDate",
        headerName: t("last-updated"),
        type: "date",
        valueGetter: (value) => (value == null ? null : new Date(value)),
        flex: 1,
      },
      {
        field: "file",
        headerName: t("file"),
        flex: 2,
        initVisible: false,
        renderCell: (params) =>
          params.row.uri ? (
            <a href={params.row.uri} target="_blank" rel="noreferrer">
              {params.value}
            </a>
          ) : (
            params.value
          ),
      },
      {
        field: "dependsOnModel",
        headerName: t("referenced-models"),
        flex: 2,
        initVisible: false,
        renderCell: (params) =>
          params.value.map(
            (tag) => tag.length > 0 && <Chip key={tag} size="small" sx={{ margin: "1px" }} label={tag} />,
          ),
      },
      {
        field: "furtherInformation",
        headerName: t("more-information"),
        flex: 1,
        initVisible: false,
        renderCell: (params) => (
          <a href={params.value} target="_blank" rel="noreferrer">
            {params.value}
          </a>
        ),
      },
      {
        field: "technicalContact",
        headerName: t("technical-contact"),
        flex: 0.5,
        initVisible: false,
        renderCell: (params) =>
          params.value && (
            <a href={params.value} target="_blank" rel="noreferrer">
              <MailIcon />
            </a>
          ),
      },
    ],
    [t],
  );

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" spacing={2}>
        <Typography variant="h4" mt={6} ml={1} sx={{ flexGrow: 1 }}>
          {filteredModels.length + " " + t("models-found", { count: filteredModels.length })}
        </Typography>
        <ButtonGroup>
          <Button startIcon={<ViewListIcon />} onClick={() => setShowResultsAsTable(false)}>
            {t("list-view")}
          </Button>
          <Button startIcon={<GridViewIcon />} onClick={() => setShowResultsAsTable(true)}>
            {t("grid-view")}
          </Button>
        </ButtonGroup>
        {!hideFilter && !filterPanelExpanded && (
          <Button variant="outlined" startIcon={<FilterAltIcon />} onClick={toggleFilter}>
            {t("filter")}
          </Button>
        )}
      </Stack>
      {filterPanelExpanded && !hideFilter && (
        <Filter
          models={models}
          filteredModels={filteredModels}
          repositoryTree={repositoryTree}
          setFilteredModels={setFilteredModels}
          setPage={setPage}
          filterDefaultValues={filterDefaultValues ?? null}
          setFilterDefaultValues={setFilterDefaultValues}
          setFilterPanelExpanded={setFilterPanelExpanded}
        ></Filter>
      )}
      {showResultsAsTable ? (
        <Box sx={{ bgcolor: "background.paper", marginBottom: 8, marginTop: 4 }}>
          {filteredModels?.length > 0 && (
            <DataGrid
              rows={filteredModels}
              columns={resultTableColumns}
              disableColumnMenu
              disableColumnFilter
              disableDensitySelector
              disableRowSelectionOnClick
              autoHeight
              initialState={{
                columns: {
                  columnVisibilityModel: Object.assign(
                    {},
                    ...resultTableColumns.map((c) => ({ [c.field]: c.initVisible ?? true })),
                  ),
                },
              }}
              slots={{
                toolbar: () => (
                  <Stack direction="row" sx={{ marginLeft: "5px" }} spacing={2}>
                    <GridToolbarColumnsButton />
                  </Stack>
                ),
              }}
              sx={{
                // disable cell selection style
                ".MuiDataGrid-cell:focus": {
                  outline: "none",
                },
              }}
            />
          )}
        </Box>
      ) : (
        <Box sx={{ width: "100%", bgcolor: "background.paper", marginBottom: 8 }}>
          {filteredModels &&
            filteredModels
              .slice((page - 1) * modelsPerPage, (page - 1) * modelsPerPage + modelsPerPage)
              .map((model) => (
                <Box key={model.id} mt={6} direction="column" alignItems="flex-start">
                  <Stack direction="row" flexWrap="wrap" alignItems="center">
                    <Button sx={{ color: "text.primary", textTransform: "none" }}>
                      <Link
                        style={{ color: "inherit", textDecoration: "inherit", fontSize: 20, margin: -1 }}
                        to={{ pathname: "/detail/" + model.mD5 + "/" + model.name }}
                        state={{ searchQuery: searchUrl.search, filterDefaultValues: filterDefaultValues }}
                      >
                        {model.name}
                      </Link>
                    </Button>
                    {model.isDependOnModelResult && (
                      <Tooltip title={t("search-term-was-found-in-depends-on-model")}>
                        <HubIcon sx={{ color: "text.secondary", fontSize: 16 }} />
                      </Tooltip>
                    )}
                    {model.tags &&
                      model.tags.map((tag) => tag.length > 0 && <Chip key={tag} sx={{ margin: 1 }} label={tag} />)}
                  </Stack>
                  <Stack
                    direction={{ xs: "column", sm: "column", md: "row" }}
                    alignItems={{ xs: "flex-start", sm: "flex-start", md: "flex-end" }}
                    flexWrap="wrap"
                    sx={{ color: "text.secondary" }}
                  >
                    {!!model.title && (
                      <Box ml={1} mt={1}>
                        <TitleIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                        {t("title")}: {model.title}
                      </Box>
                    )}
                    <Box ml={1} mt={1}>
                      <SellIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                      {t("schema-language")}: {SchemaLanguages[model.schemaLanguage]}
                    </Box>
                    <Box ml={1} mt={1}>
                      <CloudQueueIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                      {t("model-repository")}: {model.modelRepository}
                    </Box>
                    <Box ml={1} mt={1}>
                      <FlagIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                      {t("latest-version")}: {model.version}
                    </Box>
                    <Box ml={1} mt={1}>
                      <EditIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                      {t("issuer")}: {model.issuer}
                    </Box>
                    {model.publishingDate && (
                      <Box ml={1} mt={1}>
                        <RestoreIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                        {t("last-updated")}: {new Date(model.publishingDate).toLocaleDateString()}
                      </Box>
                    )}
                    <Box ml={1} mt={1}>
                      <InsertDriveFileIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                      {t("file")}:{" "}
                      {model.uri ? (
                        <a href={model.uri} target="_blank" rel="noreferrer">
                          {model.file}
                        </a>
                      ) : (
                        model.file
                      )}
                    </Box>
                    {model.furtherInformation && (
                      <Box ml={1} mt={1}>
                        <InfoIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                        <a href={model.furtherInformation} target="_blank" rel="noreferrer">
                          {t("more-information")}
                        </a>
                      </Box>
                    )}
                  </Stack>
                </Box>
              ))}
          {filteredModels && filteredModels.length > modelsPerPage && (
            <Pagination
              sx={{ marginTop: 3 }}
              page={page}
              count={Math.ceil(filteredModels.length / modelsPerPage)}
              onChange={handleChangePage}
            />
          )}
        </Box>
      )}
    </>
  );
}
