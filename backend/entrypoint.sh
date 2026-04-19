#!/bin/sh
set -e

if [ "${DJANGO_RUN_MIGRATIONS_ON_START:-False}" = "True" ]; then
  echo "Running database migrations..."
  python manage.py migrate --no-input
fi

if [ "${DJANGO_RUN_COLLECTSTATIC_ON_START:-False}" = "True" ]; then
  echo "Collecting static files..."
  python manage.py collectstatic --no-input
fi

if [ "${DJANGO_SEED_CUSTOMERS_ON_START:-False}" = "True" ]; then
  echo "Seeding customers (skips gracefully if Excel file absent)..."
  python manage.py seed_customers
fi

exec "$@"
