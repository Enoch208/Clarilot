CREATE LIGHTNING REST TABLE shortages_p00 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=0",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p00;

CREATE LIGHTNING REST TABLE shortages_p01 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=100",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p01;

CREATE LIGHTNING REST TABLE shortages_p02 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=200",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p02;

CREATE LIGHTNING REST TABLE shortages_p03 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=300",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p03;

CREATE LIGHTNING REST TABLE shortages_p04 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=400",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p04;

CREATE LIGHTNING REST TABLE shortages_p05 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=500",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p05;

CREATE LIGHTNING REST TABLE shortages_p06 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=600",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p06;

CREATE LIGHTNING REST TABLE shortages_p07 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=700",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p07;

CREATE LIGHTNING REST TABLE shortages_p08 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=800",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p08;

CREATE LIGHTNING REST TABLE shortages_p09 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=900",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p09;

CREATE LIGHTNING REST TABLE shortages_p10 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=1000",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p10;

CREATE LIGHTNING REST TABLE shortages_p11 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=1100",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p11;

CREATE LIGHTNING REST TABLE shortages_p12 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=1200",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p12;

CREATE LIGHTNING REST TABLE shortages_p13 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=1300",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p13;

CREATE LIGHTNING REST TABLE shortages_p14 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=1400",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p14;

CREATE LIGHTNING REST TABLE shortages_p15 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=1500",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p15;

CREATE LIGHTNING REST TABLE shortages_p16 FROM FDA_RAW REQUEST (
  endpoint "https://api.fda.gov/drug/shortages.json?limit=100&skip=1600",
  method "get",
  response_type "json",
  http_encoding "URLENCODED",
  insecure_ssl "false"
) HEADER (user-agent "ClarilotDemo/1.0") BODY ();

CACHE TABLE FDA_RAW.shortages_p16;
