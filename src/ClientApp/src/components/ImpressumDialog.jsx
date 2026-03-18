import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export function ImpressumDialog(props) {
  const { open, setOpen } = props;
  const { t } = useTranslation("impressum");

  const handleClose = () => setOpen(false);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth={true} maxWidth="lg">
      <DialogTitle>
        <Typography variant="h4"> {t("impressum")}</Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("sponsoring")}
          </Typography>
          <Typography variant="body"> Strategie Geoinformation Schweiz </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("project-team")}
          </Typography>
          <Typography variant="body">
            Pasquale Di Donato (swisstopo), Kuno Epper (Kt. SZ), Romedi Filli (Kt. SH), Frank Gottsmann (swisstopo),
            Peter Staub (KGK), Rolf Zürcher (swisstopo)
          </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("realisation")}
          </Typography>
          <Typography variant="body"> GeoWerkstatt GmbH, Aarau </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            Github
          </Typography>
          <Typography variant="body">
            <a href="https://github.com/GeoWerkstatt/interlis-model-browser" target="_blank" rel="noreferrer">
              https://github.com/GeoWerkstatt/interlis-model-browser
            </a>
          </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("technical-notices")}
          </Typography>
          <Typography variant="body"> {t("technical-notices-text")} </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("contact-address")}
          </Typography>
          <Typography variant="body">
            GEOWERKSTATT, Bleichemattstrasse 2, 5000 Aarau, Schweiz, office@geowerkstatt.ch{" "}
          </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("responsible-person")}
          </Typography>
          <Typography variant="body"> .... responsible person </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("disclaimer")}
          </Typography>
          <Typography variant="body"> {t("disclaimer-text")} </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("disclaimer-for-links")}
          </Typography>
          <Typography variant="body"> {t("disclaimer-for-links-text")} </Typography>
          <Typography variant="h5" sx={{ mt: 4 }}>
            {t("copyrights")}
          </Typography>
          <Typography variant="body"> {t("copyrights-text")} </Typography>
          <Typography sx={{ mt: 6 }} variant="subtitle2">
            {t("source")}:{" "}
            <a href="https://www.swissanwalt.ch/" target="_blank" rel="noreferrer">
              SwissAnwalt
            </a>
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
