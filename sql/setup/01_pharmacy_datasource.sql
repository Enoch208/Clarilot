CREATE DATASOURCE pharmacy_pg DESCRIBE BY "Synthetic pharmacy Postgres" OPTIONS (
  jdbcdriver "org.postgresql.Driver",
  jdbcurl "jdbc:postgresql://host.docker.internal:54360/clarilot",
  username "clarilot",
  password "${PG_PASSWORD}",
  fetchsize "1000"
);

REGISTER DATASOURCE TABLES ('dispensing', 'patients', 'stores', 'formulary', 'prescriptions') FROM pharmacy_pg;
