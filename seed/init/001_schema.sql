CREATE TABLE stores (
  store_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE patients (
  patient_id INTEGER PRIMARY KEY,
  full_name TEXT NOT NULL,
  preferred_contact TEXT NOT NULL DEFAULT 'review_in_pharmacy',
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE formulary (
  product_ndc_key TEXT PRIMARY KEY,
  drug_label TEXT NOT NULL,
  substitute_product_ndc_key TEXT,
  substitute_label TEXT
);

CREATE TABLE prescriptions (
  rx_id INTEGER PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(patient_id),
  prescribed_product_ndc_raw TEXT NOT NULL,
  drug_label TEXT NOT NULL
);

CREATE TABLE dispensing (
  dispense_id INTEGER PRIMARY KEY,
  rx_id INTEGER NOT NULL REFERENCES prescriptions(rx_id),
  patient_id INTEGER NOT NULL REFERENCES patients(patient_id),
  store_id INTEGER NOT NULL REFERENCES stores(store_id),
  product_ndc_raw TEXT NOT NULL,
  product_ndc_key TEXT,
  ndc_parse_status TEXT NOT NULL,
  lot_no TEXT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  dispensed_at TIMESTAMPTZ NOT NULL,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX dispensing_ndc_idx ON dispensing(product_ndc_key);

CREATE SCHEMA app;

CREATE TABLE app.query_ledger (
  query_id UUID PRIMARY KEY,
  query_name TEXT NOT NULL,
  statement_sha256 TEXT NOT NULL,
  safe_sql TEXT NOT NULL,
  zetaris_principal TEXT,
  source_names JSONB NOT NULL,
  fetched_at JSONB,
  cache_mode TEXT,
  row_count INTEGER,
  latency_ms INTEGER,
  execution_status TEXT NOT NULL,
  error_code TEXT,
  error_summary TEXT,
  classifier_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.outreach_actions (
  action_id UUID PRIMARY KEY,
  dispense_id INTEGER NOT NULL REFERENCES dispensing(dispense_id),
  recall_number TEXT NOT NULL,
  case_key TEXT NOT NULL,
  draft_json JSONB NOT NULL,
  grounding_json JSONB NOT NULL,
  grounding_ok BOOLEAN NOT NULL,
  generator TEXT NOT NULL CHECK (generator IN ('template', 'model')),
  status TEXT NOT NULL CHECK (
    status IN ('DRAFT_PENDING_REVIEW', 'APPROVED_DRAFT', 'REJECTED_DRAFT', 'INVALIDATED_DRAFT')
  ),
  source_query_id UUID NOT NULL REFERENCES app.query_ledger(query_id),
  reviewer_label TEXT,
  decision TEXT CHECK (decision IN ('approve', 'reject')),
  idempotency_key UUID,
  decided_at TIMESTAMPTZ,
  model_name TEXT,
  prompt_digest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dispense_id, recall_number)
);
