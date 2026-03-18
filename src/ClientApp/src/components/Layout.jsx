import { useEffect, useState } from "react";
import CodeIcon from "@mui/icons-material/Code";
import {
  AppBar,
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Select,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { EmbedDialog } from "./EmbedDialog";
import { ImpressumDialog } from "./ImpressumDialog";
import { useTranslation } from "react-i18next";
import interlisLogo from "../img/Interlis.png";

export function Layout(props) {
  const [version, setVersion] = useState();
  const [openImpressum, setOpenImpressum] = useState(false);
  const [openEmbed, setOpenEmbed] = useState(false);

  const { t, i18n } = useTranslation("common");

  const handleClickOpenEmbed = () => setOpenEmbed(true);
  const handleClickOpenImpressum = () => setOpenImpressum(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/version");
      setVersion(await response.text());
    }

    fetchData();
  }, []);

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <img alt="interlis-logo" src={interlisLogo} width="20" height="20" />
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
              INTERLIS Model Browser
            </Typography>
            <Tooltip title={t("open-impressum")}>
              <Button variant="text" sx={{ marginRight: 3, color: "white" }} onClick={handleClickOpenImpressum}>
                {t("impressum")}
              </Button>
            </Tooltip>
            <Tooltip title={t("generate-embed-tag")}>
              <CodeIcon sx={{ marginRight: 1 }} onClick={handleClickOpenEmbed}></CodeIcon>
            </Tooltip>
            <FormControl variant="standard">
              <Select
                disableUnderline
                sx={{ ml: 3, color: "white", backgroundColor: "none" }}
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                slotProps={{
                  input: { styles: { color: "white" } },
                }}
              >
                <MenuItem value={"de"}>DE</MenuItem>
                <MenuItem value={"fr"}>FR</MenuItem>
                <MenuItem value={"it"}>IT</MenuItem>
              </Select>
            </FormControl>
          </Toolbar>
        </AppBar>
      </Box>
      <Container>{props.children}</Container>
      <EmbedDialog open={openEmbed} setOpen={setOpenEmbed}></EmbedDialog>
      <ImpressumDialog open={openImpressum} setOpen={setOpenImpressum}></ImpressumDialog>
      <Typography sx={{ position: "fixed", bottom: 1, right: 1, color: "darkgrey" }} variant="caption" gutterBottom>
        Version: {version}
      </Typography>
    </div>
  );
}
