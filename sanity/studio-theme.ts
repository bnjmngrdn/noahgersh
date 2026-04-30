import { buildLegacyTheme } from "sanity";

/** Light, minimal palette aligned with the public site (black text, white surfaces). */
export const studioTheme = buildLegacyTheme({
  "--black": "#000000",
  "--white": "#ffffff",
  "--gray": "rgba(0, 0, 0, 0.45)",
  "--gray-base": "rgba(0, 0, 0, 0.45)",
  "--component-bg": "#ffffff",
  "--component-text-color": "#000000",
  "--brand-primary": "#000000",
  "--default-button-color": "rgba(0, 0, 0, 0.5)",
  "--default-button-primary-color": "#000000",
  "--default-button-success-color": "#0f9d58",
  "--default-button-warning-color": "#c9a227",
  "--default-button-danger-color": "#b00020",
  "--state-info-color": "#000000",
  "--state-success-color": "#0f9d58",
  "--state-warning-color": "#c9a227",
  "--state-danger-color": "#b00020",
  "--main-navigation-color": "#ffffff",
  "--main-navigation-color--inverted": "#000000",
  "--focus-color": "#000000",
});
