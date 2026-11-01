SELECT
  dispense_id,
  product_ndc_raw,
  product_ndc_key,
  ndc_parse_status,
  lot_no,
  dispensed_at
FROM pharmacy_pg.dispensing
WHERE synthetic = true
  AND (
    product_ndc_key IS NULL
    OR ndc_parse_status NOT IN ('OK_PRODUCT', 'OK_PACKAGE')
    OR dispensed_at > current_timestamp()
    OR lot_no IS NULL
    OR trim(lot_no) = ''
    OR NOT (upper(lot_no) RLIKE '^[A-Z0-9][A-Z0-9-]{1,30}[A-Z0-9]$')
  )
ORDER BY dispense_id
