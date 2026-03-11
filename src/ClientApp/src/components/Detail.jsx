import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import { Box, Button, CircularProgress, Chip, Stack, TextField, Typography } from "@mui/material";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import SellIcon from "@mui/icons-material/Sell";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import MailIcon from "@mui/icons-material/Mail";
import RestoreIcon from "@mui/icons-material/Restore";
import FlagIcon from "@mui/icons-material/Flag";
import HubIcon from "@mui/icons-material/Hub";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import TitleIcon from "@mui/icons-material/Title";
import { SchemaLanguages } from "./SchemaLanguages";
import { useTranslation } from "react-i18next";
import { getAllModels } from "./Utils";

export function Detail() {
  const [model, setModel] = useState();
  const [loading, setLoading] = useState();
  const { t } = useTranslation("common");

  const location = useLocation();
  const navigate = useNavigate();
  const { md5, name } = useParams();

  const toHome = () => navigate("/");
  const backToSearch = () => {
    navigate(`/${location.state.searchQuery}`, { state: location.state });
  };

  const linkToModelOrSearch = async (modelname) => {
    var url = new URL(window.location);
    url.searchParams.set("query", modelname);
    const response = await fetch("/search" + url.search);
    if (response.ok && response.status !== 204 /* No Content */) {
      const repositoryTree = await response.json();
      const matchingModels = getAllModels(repositoryTree).filter((m) => m.name === modelname);
      // Link to model if only one matches the referenced model name.
      if (matchingModels.length === 1) {
        navigate("/detail/" + matchingModels[0].mD5 + "/" + matchingModels[0].name, { state: location.state });
      } else {
        navigate("/" + url.search);
      }
    }
  };

  useEffect(() => {
    setLoading(true);

    async function getModel(md5, name) {
      const response = await fetch("/model/" + md5 + "/" + name);

      if (response.ok && response.status !== 204 /* No Content */) {
        const model = await response.json();
        setModel(model);
      } else {
        setModel();
      }
      setLoading(false);
    }
    getModel(md5, name);
  }, [md5, name, t]);

  return (
    <Box mt={10}>
      {location?.state !== null ? (
        <Button variant="outlined" onClick={backToSearch} startIcon={<ArrowBackIosIcon />}>
          {t("back-to-search")}
        </Button>
      ) : (
        <Button variant="outlined" onClick={toHome} startIcon={<ArrowBackIosIcon />}>
          {t("to-search")}
        </Button>
      )}
      {!model && loading && (
        <Box mt={10}>
          <CircularProgress />
        </Box>
      )}
      {!model && !loading && (
        <Typography mt={5} variant="h6">
          {t("invalid-model-url")}
        </Typography>
      )}
      {model && (
        <>
          <Stack direction="row" alignItems="flex-end" flexWrap="wrap" sx={{ color: "text.secondary" }}>
            <Typography mt={5} variant="h4">
              {model?.name}
            </Typography>
            <Box>{model.tags && model.tags.map((tag) => <Chip key={tag} sx={{ margin: 1 }} label={tag} />)}</Box>
          </Stack>
          <Stack direction="column" alignItems="flex-start" sx={{ color: "text.secondary" }}>
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
              {t("model-repository")}: {model.modelRepository.title + " [" + model.modelRepository.name + "]"}
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
            {model.dependsOnModel?.length > 0 && (
              <Box ml={1} mt={1}>
                <HubIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                {t("referenced-models")}:
                {model.dependsOnModel &&
                  model.dependsOnModel.map((m) => (
                    <Chip
                      onClick={() => linkToModelOrSearch(m)}
                      sx={{ marginLeft: 1, marginBottom: 1 }}
                      key={m}
                      label={m}
                      variant="outlined"
                    />
                  ))}
              </Box>
            )}
            {model.catalogueFiles?.length > 0 && (
              <Box ml={1} mt={1}>
                <AutoStoriesIcon sx={{ mb: -0.5, mr: 0.5 }} />
                {t("catalogue-files")}:{" "}
                {model.catalogueFiles &&
                  model.catalogueFiles
                    .sort(
                      (a, b) =>
                        (a.match(/\//g) || []).length - (b.match(/\//g) || []).length ||
                        a.localeCompare(b, undefined, { sensitivity: "base" }),
                    )
                    .map((f) => (
                      <Box key={f} sx={{ ml: 4 }}>
                        <Typography variant="body" sx={{ mr: 1, fontSize: 14 }}>
                          <a href={f} target="_blank" rel="noreferrer">
                            {f}
                          </a>
                        </Typography>
                      </Box>
                    ))}
              </Box>
            )}
            {model.technicalContact && (
              <Box ml={1} mt={1}>
                <MailIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                <a href={model.technicalContact} target="_blank" rel="noreferrer">
                  {t("technical-contact")}
                </a>
              </Box>
            )}
            {model.furtherInformation && (
              <Box ml={1} mt={1}>
                <InfoIcon sx={{ marginBottom: -0.5, marginRight: 0.5 }} />
                <a href={model.furtherInformation} target="_blank" rel="noreferrer">
                  {t("more-information")}
                </a>
              </Box>
            )}
            <TextField
              sx={{ bgcolor: "action.hover", marginTop: 5, marginBottom: 5 }}
              variant="outlined"
              multiline
              rows={12}
              fullWidth
              label={t("model-preview")}
              inputProps={{ style: { fontSize: 12, fontFamily: "'Courier New', monospace" } }}
              InputLabelProps={{ style: { fontSize: 22 } }}
              InputProps={{ readOnly: true, style: { fontSize: 22 } }}
              value={model.fileContent?.content ?? t("no-model-preview")}
              focused={false}
            />
          </Stack>
        </>
      )}
    </Box>
  );
}
