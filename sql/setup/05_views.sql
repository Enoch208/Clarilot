CREATE SCHEMASTORE CONTAINER fda;

CREATE OR REPLACE SCHEMASTORE VIEW recalls_by_ndc WITH CONTAINER fda AS
SELECT
  r.recall_number,
  r.classification,
  r.status AS recall_status,
  r.report_date,
  r.recall_initiation_date,
  r.recalling_firm,
  r.product_description,
  r.reason_for_recall,
  r.code_info,
  n AS recall_ndc_raw,
  concat(lpad(split(n, '-')[0], 5, '0'), '-', lpad(split(n, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.recalls
LATERAL VIEW explode(results) recall_rows AS r
LATERAL VIEW explode(r.openfda.product_ndc) recall_ndcs AS n
WHERE n RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})$';

CREATE OR REPLACE SCHEMASTORE VIEW shortages_by_ndc WITH CONTAINER fda AS
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p00
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p01
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p02
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p03
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p04
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p05
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p06
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p07
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p08
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p09
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p10
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p11
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p12
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p13
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p14
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p15
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
UNION ALL
SELECT
  s.status AS shortage_status,
  s.availability,
  s.update_date,
  s.generic_name,
  s.package_ndc,
  concat(lpad(split(s.package_ndc, '-')[0], 5, '0'), '-', lpad(split(s.package_ndc, '-')[1], 4, '0')) AS ndc_product_key,
  meta.last_updated AS source_last_updated
FROM FDA_RAW.shortages_p16
LATERAL VIEW explode(results) shortage_rows AS s
WHERE s.package_ndc RLIKE '^([0-9]{4}-[0-9]{4}|[0-9]{5}-[0-9]{3,4})-[0-9]{1,2}$'
;
