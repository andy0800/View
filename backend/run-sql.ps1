# Quick SQL Execution Script
$env:PGPASSWORD = 'Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf'

# Execute SQL file
psql -h dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com -p 5432 -U viewapp_postgres_user -d viewapp_postgres -f add-24hr-reward-system.sql

# Clear password
Remove-Item Env:\PGPASSWORD

