import { useState, useEffect } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TreeView } from "@mui/x-tree-view/TreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { SchemaLanguages } from "./SchemaLanguages";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export function Filter(props) {
  const {
    models,
    filteredModels,
    setFilteredModels,
    setPage,
    repositoryTree,
    filterDefaultValues,
    setFilterDefaultValues,
    setFilterPanelExpanded,
  } = props;
  const [filterApplied, setFilterApplied] = useState(false);
  const [hideReferencedModelResults, setHideReferencedModelResults] = useState(false);
  const [allIssuerSelected, setAllIssuerSelected] = useState(true);
  const [allSchemaLanguageSelected, setAllSchemaLanguageSelected] = useState(true);

  const { t } = useTranslation("common");
  const {
    control,
    getValues,
    register,
    reset,
    setValue,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm();

  const onSubmit = (data) => {
    setFilterDefaultValues(data);
    let filtered = models;
    if (Array.isArray(data.modelRepository)) {
      filtered = filtered.filter((m) => data.modelRepository.some((repo) => m.modelRepository.includes(repo)));
    }
    if (Array.isArray(data.issuer)) {
      filtered = filtered.filter(
        (m) => data.issuer.includes(m.issuer) || (m.issuer == null && data.issuer.includes("-")),
      );
    }
    if (Array.isArray(data.schemaLanguage)) {
      filtered = filtered.filter((m) => data.schemaLanguage.includes(m.schemaLanguage));
    }
    if (Array.isArray(data.referencedModels) && data.referencedModels.length > 0) {
      filtered = filtered.filter((m) => m.dependsOnModel.some((m) => data.referencedModels.includes(m)));
    }
    if (data.publishedFrom != null) {
      filtered = filtered.filter((m) => new Date(m.publishingDate) >= data.publishedFrom);
    }
    if (data.publishedTo != null) {
      filtered = filtered.filter((m) => new Date(m.publishingDate) <= data.publishedTo);
    }
    if (hideReferencedModelResults) {
      filtered = filtered.filter((m) => m.isDependOnModelResult === false);
    }
    setFilteredModels(filtered);
    setPage(1);
  };

  // Get and sort filter options
  const getIssuerWithoutPrefix = (issuer) => issuer.replace("https://", "").replace("http://", "").replace("www.", "");

  const schemaLanguageOptions = [...new Set(models.map((m) => m.schemaLanguage))].sort((a, b) => a.localeCompare(b));
  const issuerOptions = [...new Set(models.map((m) => (m.issuer == null ? "-" : m.issuer)))].sort((a, b) =>
    getIssuerWithoutPrefix(a).localeCompare(getIssuerWithoutPrefix(b)),
  );
  const currentDependsOnModelOptions = [...new Set(filteredModels.flatMap((m) => m.dependsOnModel))].sort((a, b) =>
    a.localeCompare(b),
  );

  useEffect(() => {
    // Set default checkboxes checked for tree
    if (!filterDefaultValues) {
      setChildrenCheckStatus(repositoryTree, true);
      checkAllSchemaLanguage(true);
      checkAllIssuer(true);
    } else {
      // Immediately submit filter form if filter default values were passed to component
      reset(filterDefaultValues);
      handleSubmit(onSubmit)();
      setFilterApplied(true);
    }
  }, []);

  const updateIfAllChecked = (fieldName, optionsArray, setter) => {
    setter(allChecked(fieldName, optionsArray));
  };

  const allChecked = (fieldName, optionsArray) =>
    Object.entries(optionsArray).every(([k]) => getValues(fieldName + k) === true);

  const allSame = (fieldName, optionsArray) => {
    return Object.entries(optionsArray).every(([k]) => getValues(fieldName + k) === getValues(fieldName + 0));
  };

  const checkAllSchemaLanguage = (checked) => {
    setAllSchemaLanguageSelected(checked);
    Object.entries(schemaLanguageOptions).forEach(([k]) => {
      setValue("schemaLanguage" + k, checked);
    });
    checked ? setValue("schemaLanguage", null) : setValue("schemaLanguage", []);
  };

  const checkAllIssuer = (checked) => {
    setAllIssuerSelected(checked);
    Object.entries(issuerOptions).forEach(([k]) => {
      setValue("issuer" + k, checked);
    });
    checked ? setValue("issuer", null) : setValue("issuer", []);
  };

  const resetFilter = () => {
    reset({ keepDefaultValues: true });
    setFilterDefaultValues(null);
    setFilteredModels(models);
    setFilterApplied(false);
    setHideReferencedModelResults(false);
    checkAllSchemaLanguage(true);
    checkAllIssuer(true);
    setChildrenCheckStatus(repositoryTree, true);
  };

  function getAllRepoNames(repositoryTree) {
    return [repositoryTree.name, ...repositoryTree.subsidiarySites.flatMap((r) => getAllRepoNames(r))];
  }

  function setChildrenCheckStatus(repositoryTree, checked) {
    const reposToCheck = getAllRepoNames(repositoryTree);
    reposToCheck.forEach((name) => setValue("modelRepository" + name, checked));
  }

  const renderTree = (repositoryTree) => (
    <TreeItem key={repositoryTree.name} nodeId={repositoryTree.name}>
      {repositoryTree.models.length > 0 && (
        <FormGroup>
          <FormControlLabel
            control={
              <Controller
                name={"modelRepository" + repositoryTree.name}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    {...field}
                    // The additional register with the same name for all mapped checkboxes
                    // allows to pass all values of this type as an array to the filter.
                    {...register("modelRepository")}
                    checked={!!watch("modelRepository" + repositoryTree.name)}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      setChildrenCheckStatus(repositoryTree, e.target.checked);
                    }}
                    value={repositoryTree.name}
                  />
                )}
              />
            }
            label={new URL(repositoryTree.uri).hostname}
          />
        </FormGroup>
      )}
      {Array.isArray(repositoryTree.subsidiarySites)
        ? repositoryTree.subsidiarySites.map((node) => renderTree(node))
        : null}
    </TreeItem>
  );

  return (
    <Paper sx={{ padding: 3, marginTop: 2, bgcolor: "action.hover" }}>
      <form onSubmit={handleSubmit(onSubmit)} name="search-form">
        <Stack mb={5} direction="row" alignItems="flex-start" justifyContent="flex-start">
          <Button type="submit" onClick={() => setFilterApplied(true)} disabled={!isDirty} variant="outlined">
            {t("apply-filter")}
          </Button>
          {filterApplied && (
            <Button type="reset" onClick={resetFilter} variant="text">
              {t("reset")}
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }}></Box>
          <IconButton onClick={() => setFilterPanelExpanded(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="h6"> {t("model-repositories")}</Typography>
            <TreeView sx={{ marginLeft: -2 }} expanded={getAllRepoNames(repositoryTree)}>
              {renderTree(repositoryTree)}
            </TreeView>
          </Box>
          <Box>
            <Typography variant="h6">{t("issuer")}</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allIssuerSelected}
                    indeterminate={!allSame("issuer", issuerOptions)}
                    onChange={(e) => {
                      checkAllIssuer(e.target.checked);
                    }}
                  />
                }
                label={t("all")}
              />
            </FormGroup>
            <Box sx={{ maxHeight: 900, overflowY: "auto", overflowX: "hidden" }}>
              {Object.entries(issuerOptions).map(([k, v]) => (
                <FormGroup sx={{ marginLeft: 2 }} key={k}>
                  <FormControlLabel
                    control={
                      <Controller
                        name={"issuer" + k}
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            {...field}
                            {...register("issuer")}
                            checked={!!watch("issuer" + k)}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              updateIfAllChecked("issuer", issuerOptions, setAllIssuerSelected);
                            }}
                            value={v}
                          />
                        )}
                      />
                    }
                    label={v}
                  />
                </FormGroup>
              ))}
            </Box>
          </Box>
          <Box>
            {schemaLanguageOptions && schemaLanguageOptions?.length > 0 && (
              <>
                <Typography variant="h6"> {t("schema-language")}</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allSchemaLanguageSelected}
                        indeterminate={!allSame("schemaLanguage", schemaLanguageOptions)}
                        onChange={(e) => {
                          checkAllSchemaLanguage(e.target.checked);
                        }}
                      />
                    }
                    label={t("all")}
                  />
                </FormGroup>
                {Object.entries(schemaLanguageOptions).map(([k, v]) => (
                  <FormGroup sx={{ marginLeft: 2 }} key={k}>
                    <FormControlLabel
                      control={
                        <Controller
                          name={"schemaLanguage" + k}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              {...field}
                              {...register("schemaLanguage")}
                              checked={!!watch("schemaLanguage" + k)}
                              onChange={(e) => {
                                field.onChange(e.target.checked);
                                updateIfAllChecked(
                                  "schemaLanguage",
                                  schemaLanguageOptions,
                                  setAllSchemaLanguageSelected,
                                );
                              }}
                              value={v}
                            />
                          )}
                        />
                      }
                      label={SchemaLanguages[v]}
                    />
                  </FormGroup>
                ))}
              </>
            )}
          </Box>
        </Stack>
        <Box>
          {models.some((m) => m.isDependOnModelResult === true) && (
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={hideReferencedModelResults}
                    onChange={(e) => setHideReferencedModelResults(e.target.checked)}
                  />
                }
                label={t("hide-results-for-depends-on-models")}
              />
            </FormGroup>
          )}
          <Typography mt={8} variant="h6">
            {t("referenced-models")}
          </Typography>
          <Controller
            name="referencedModels"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <Autocomplete
                {...field}
                multiple
                options={currentDependsOnModelOptions}
                noOptionsText={t("no-depends-on-model")}
                onChange={(e, data) => {
                  field.onChange(data);
                }}
                value={field.value}
                renderInput={(params) => (
                  <TextField {...params} type="text" variant="standard" placeholder={t("model-name")} />
                )}
              />
            )}
          />
          <Typography mt={8} variant="h6">
            {t("last-updated")}
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={2}>
            <Typography>{t("from")}</Typography>
            <Controller
              name="publishedFrom"
              control={control}
              defaultValue={null}
              render={({ field }) => <DatePicker {...field} />}
            />
            <Typography>{t("to")}</Typography>
            <Controller
              name="publishedTo"
              control={control}
              defaultValue={null}
              render={({ field }) => <DatePicker {...field} />}
            />
          </Stack>
        </Box>
      </form>
    </Paper>
  );
}
