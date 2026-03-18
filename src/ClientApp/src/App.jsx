import { useMemo } from "react";
import { Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { Detail } from "./components/Detail";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/de-ch";
import "dayjs/locale/fr-ch";
import "dayjs/locale/it-ch";
import { deDE, frFR, itIT } from "@mui/material/locale";
import { deDE as dataGridDeDE, frFR as dataGridFrFR, itIT as dataGridItIT } from "@mui/x-data-grid/locales";
import { deDE as datePickerDeDE, frFR as datePickerFrFR, itIT as datePickerItIT } from "@mui/x-date-pickers/locales";
import { useTranslation } from "react-i18next";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./custom.css";

const locales = {
  de: {
    muiCore: deDE,
    dataGrid: dataGridDeDE,
    datePicker: datePickerDeDE,
    dateAdapter: "de-ch",
  },
  fr: {
    muiCore: frFR,
    dataGrid: dataGridFrFR,
    datePicker: datePickerFrFR,
    dateAdapter: "fr-ch",
  },
  it: {
    muiCore: itIT,
    dataGrid: dataGridItIT,
    datePicker: datePickerItIT,
    dateAdapter: "it-ch",
  },
};

export default function App() {
  const { i18n } = useTranslation();

  const theme = useMemo(
    () =>
      createTheme(
        {
          palette: {
            primary: {
              main: "#007CC3",
              contrastText: "#fff",
            },
          },
        },
        locales[i18n.language].muiCore,
        locales[i18n.language].dataGrid,
        locales[i18n.language].datePicker,
      ),
    [i18n.language],
  );

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locales[i18n.language].dateAdapter}>
        <CssBaseline />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/detail/:md5/:name" element={<Detail />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
