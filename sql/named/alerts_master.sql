WITH shortage_ranked AS (
  SELECT
    ndc_product_key,
    shortage_status,
    availability,
    update_date,
    generic_name,
    package_ndc,
    source_last_updated,
    ROW_NUMBER() OVER (
      PARTITION BY ndc_product_key
      ORDER BY CASE WHEN shortage_status = 'Current' THEN 0 ELSE 1 END, package_ndc
    ) AS rn
  FROM fda.shortages_by_ndc
),
receipt_ranked AS (
  SELECT
    receipt_id,
    CAST(store_id AS INT) AS store_id,
    product_ndc_key,
    lot_no,
    received_at,
    supplier,
    ROW_NUMBER() OVER (
      PARTITION BY store_id, product_ndc_key, upper(lot_no)
      ORDER BY received_at DESC, receipt_id
    ) AS rn
  FROM lots_files.receiving_lots
)
SELECT
  d.dispense_id,
  d.rx_id,
  d.patient_id,
  p.full_name AS patient_name,
  d.store_id,
  s.name AS store_name,
  s.city AS store_city,
  d.product_ndc_raw,
  d.product_ndc_key,
  d.ndc_parse_status,
  d.lot_no,
  d.qty,
  d.dispensed_at,
  f.drug_label,
  r.recall_number,
  r.classification,
  r.recall_status,
  r.report_date,
  r.recall_initiation_date,
  r.recalling_firm,
  r.product_description,
  r.reason_for_recall,
  r.code_info,
  r.recall_ndc_raw,
  r.source_last_updated AS recalls_last_updated,
  l.receipt_id,
  l.lot_no AS receipt_lot_no,
  l.supplier,
  l.received_at,
  sh.shortage_status,
  sh.availability AS shortage_availability,
  sh.update_date AS shortage_update_date,
  sh.generic_name AS shortage_generic_name,
  sh.package_ndc AS shortage_package_ndc,
  sh.source_last_updated AS shortages_last_updated
FROM pharmacy_pg.dispensing d
JOIN pharmacy_pg.patients p ON p.patient_id = d.patient_id
JOIN pharmacy_pg.stores s ON s.store_id = d.store_id
LEFT JOIN pharmacy_pg.formulary f ON f.product_ndc_key = d.product_ndc_key
JOIN fda.recalls_by_ndc r ON r.ndc_product_key = d.product_ndc_key
LEFT JOIN receipt_ranked l
  ON l.rn = 1
  AND l.product_ndc_key = d.product_ndc_key
  AND upper(l.lot_no) = upper(d.lot_no)
  AND l.store_id = d.store_id
LEFT JOIN shortage_ranked sh ON sh.rn = 1 AND sh.ndc_product_key = d.product_ndc_key
WHERE d.synthetic = true
  AND d.dispensed_at <= current_timestamp()
ORDER BY r.report_date DESC, d.dispense_id
