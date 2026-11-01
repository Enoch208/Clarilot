CREATE LIGHTNING DATABASE FDA_RAW DESCRIBE BY "openFDA public drug reports";

CREATE LIGHTNING REST TABLE recalls FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/enforcement.json?search=_exists_%3Aopenfda.product_ndc%20AND%20report_date%3A%5B20260701%20TO%2020261231%5D&sort=report_date%3Adesc&limit=1000",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.recalls;
