/**
 * Application Settings & Constants
 */
const CONFIG = {
  EXCLUDE_SHEETS: ["Dashboard", "Final FORMAT Sheet", "Client Summary", "Client Payment Summary", "How To Use", "Chart Data"],
  GREENWEB_API_URL: "https://api.bdbulksms.net/g_api.php",
  SUMMARY_SHEET_NAME: "Client Payment Summary",
  DATA_START_ROW: 8
};

/**
 * Utility to safely fetch API Keys from Script Properties
 * Set via: Script Properties -> Add "GREENWEB_API_TOKEN"
 */
function getGreenwebApiToken() {
  const token = PropertiesService.getScriptProperties().getProperty("GREENWEB_API_TOKEN");
  if (!token) {
    throw new Error("Missing GREENWEB_API_TOKEN in Script Properties.");
  }
  return token;
}