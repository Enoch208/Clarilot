CREATE LIGHTNING DATABASE LOTS_FILES DESCRIBE BY "Synthetic receiving ledger";

CREATE LIGHTNING FILESTORE TABLE receiving_lots FROM LOTS_FILES FORMAT CSV OPTIONS (
  path "dffs://receiving_lots.csv",
  header "true",
  delimiter ",",
  inferSchema "false"
);
