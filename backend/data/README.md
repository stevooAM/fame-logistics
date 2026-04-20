# Customer Seed Data

Place `fame_logistic_customers.xlsx` in this directory before the first deployment.

The file is gitignored (sensitive client data — 197 customer records).

On container startup, `entrypoint.sh` runs:

    python manage.py seed_customers

The command auto-detects the file at `backend/data/fame_logistic_customers.xlsx`.
If the file is absent, the command prints a warning and exits 0 — the server still starts.

To seed manually inside a running container:

    docker compose exec backend python manage.py seed_customers
    # or with an explicit path:
    docker compose exec backend python manage.py seed_customers --file /path/to/file.xlsx
