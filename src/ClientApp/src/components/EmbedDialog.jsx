import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  FormControl,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import InputAdornment from "@mui/material/InputAdornment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FilterValues } from "./FilterValues";

export function EmbedDialog(props) {
  const { open, setOpen } = props;
  const [width, setWidth] = useState(900);
  const [height, setHeight] = useState(750);
  const [border, setBorder] = useState(true);
  const [hideFilter, setHideFilter] = useState(false);
  const [schemaLanguages, setSchemaLanguages] = useState([]);
  const [repositoryNames, setRepositoryNames] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [dependsOnModels, setDependsOnModels] = useState([]);
  const [url, setUrl] = useState("");

  const { t } = useTranslation("common");

  const handleClose = () => {
    setOpen(false);
  };

  const handleFilterChange = (event) => {
    url.searchParams.delete("hideFilter");
    const checked = event.target.checked;
    setHideFilter(checked);
    !!checked && url.searchParams.append("hideFilter", checked);
  };

  const handleSchemaLanguageSelect = (event) => {
    url.searchParams.delete(FilterValues.SchemaLanguages);
    const value = event.target.value;
    const values = typeof value === "string" ? value.split(",") : value;
    setSchemaLanguages(values);
    values.forEach((language) => {
      !!language && url.searchParams.append(FilterValues.SchemaLanguages, language);
    });
  };

  const handleRepositoryNamesChange = (event) => {
    url.searchParams.delete(FilterValues.RepositoryNames);
    const value = event.target.value;
    const values = typeof value === "string" ? value.split(",") : value;
    setRepositoryNames(values);
    values.forEach((name) => {
      !!name && url.searchParams.append(FilterValues.RepositoryNames, name);
    });
  };

  const handleIssuersChange = (event) => {
    url.searchParams.delete(FilterValues.Issuers);
    const value = event.target.value;
    const values = typeof value === "string" ? value.split(",") : value;
    setIssuers(values);
    values.forEach((issuer) => {
      !!issuer && url.searchParams.append(FilterValues.Issuers, issuer);
    });
  };
  const handleDepensOnModelsChange = (event) => {
    url.searchParams.delete(FilterValues.DependsOnModels);
    const value = event.target.value;
    const values = typeof value === "string" ? value.split(",") : value;
    setDependsOnModels(values);
    values.forEach((model) => {
      !!model && url.searchParams.append(FilterValues.DependsOnModels, model);
    });
  };

  useEffect(() => setUrl(new URL(window.location.origin)), []);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth={true} maxWidth="lg">
      <DialogTitle>{t("generate-embed-tag")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t("generate-embed-tag-instructions")}</DialogContentText>
        <Stack mt={5} mb={5} direction="row" justifyContent="flex-start" alignItems="flex-end">
          <TextField
            margin="dense"
            onChange={(e) => setWidth(e.target.value)}
            slotProps={{
              input: { endAdornment: <InputAdornment position="start">px</InputAdornment> },
            }}
            value={width}
            label={t("width")}
            sx={{ marginRight: 5 }}
            type="number"
            variant="standard"
          />
          <TextField
            margin="dense"
            onChange={(e) => setHeight(e.target.value)}
            slotProps={{
              input: { endAdornment: <InputAdornment position="start">px</InputAdornment> },
            }}
            value={height}
            label={t("height")}
            sx={{ marginRight: 5 }}
            type="number"
            variant="standard"
          />
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={border} onChange={(e) => setBorder(e.target.checked)} />}
              label={t("border")}
            />
          </FormGroup>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={hideFilter} onChange={handleFilterChange} />}
              label={t("hide-filter")}
            />
          </FormGroup>
        </Stack>

        <Accordion elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t("additional-optional-filter-criteria")}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DialogContentText>{t("additional-optional-filter-criteria-instructions")}</DialogContentText>

            <Stack mt={5} direction="row" alignItems="flex-end">
              <FormControl fullWidth>
                <TextField
                  select
                  label={t("chose-one-or-more-schema-languages")}
                  SelectProps={{
                    multiple: true,
                    value: schemaLanguages,
                    onChange: handleSchemaLanguageSelect,
                  }}
                >
                  <MenuItem value={"ili1"}>ili1</MenuItem>
                  <MenuItem value={"ili2_2"}>ili2_2</MenuItem>
                  <MenuItem value={"ili2_3"}>ili2_3</MenuItem>
                  <MenuItem value={"ili2_4"}>ili2_4</MenuItem>
                  {/* </Select> */}
                </TextField>
              </FormControl>
            </Stack>
            <DialogContentText mt={5}>{t("comma-seperated-filter-criteria-instructions")}</DialogContentText>

            <TextField
              margin="dense"
              fullWidth
              onChange={handleRepositoryNamesChange}
              value={repositoryNames}
              label={t("model-repositories")}
              placeholder="models.geo.admin.ch,models.so.ch, ..."
              sx={{ marginRight: 5 }}
              type="text"
              variant="standard"
            />
            <TextField
              margin="dense"
              fullWidth
              onChange={handleIssuersChange}
              value={issuers}
              label={t("issuers")}
              placeholder="http://www.interlis.ch/models,http://www.geo.admin.ch, ..."
              sx={{ marginRight: 5 }}
              type="text"
              variant="standard"
            />
            <TextField
              margin="dense"
              fullWidth
              onChange={handleDepensOnModelsChange}
              value={dependsOnModels}
              placeholder="CHAdminCodes_V2.ch,Dictionaries_V2, ..."
              label={t("referenced-models")}
              sx={{ marginRight: 5 }}
              type="text"
              variant="standard"
            />
          </AccordionDetails>
        </Accordion>

        <Stack direction="row" alignItems="flex-end">
          <TextField
            value={`<iframe src="https://ilimodels.ch/${
              url.search
            }"width="${width}" height="${height}" style="border: ${
              border ? "1px solid darkgrey" : "none"
            } " sandbox="allow-scripts allow-same-origin allow-storage-access-by-user-activation allow-forms"></iframe>`}
            sx={{ bgcolor: "action.hover", marginTop: 5 }}
            type="text"
            fullWidth
            variant="outlined"
          />
          <Tooltip title={t("copy-to-clipboard")}>
            <IconButton
              onClick={() => {
                navigator.clipboard.writeText(
                  `<iframe src="https://ilimodels.ch/${url.search}"width="${width}" height="${height}" style="border: ${
                    border ? "1px solid darkgrey" : "none"
                  } " sandbox="allow-scripts allow-same-origin allow-storage-access-by-user-activation allow-forms"></iframe>`,
                );
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack direction="row" alignItems="flex-end">
          <TextField
            value={`<embed type="text/html" src="https://ilimodels.ch/${
              url.search
            }"width="${width}" height="${height}" style="border: ${border ? "1px solid darkgrey" : "none"}"></embed>`}
            sx={{ bgcolor: "action.hover", marginTop: 5 }}
            type="text"
            fullWidth
            variant="outlined"
          />
          <Tooltip title={t("copy-to-clipboard")}>
            <IconButton
              onClick={() => {
                navigator.clipboard.writeText(
                  `<embed type="text/html" src="https://ilimodels.ch//${
                    url.search
                  }"width="${width}" height="${height}" style="border: ${
                    border ? "1px solid darkgrey" : "none"
                  }"></embed>`,
                );
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
