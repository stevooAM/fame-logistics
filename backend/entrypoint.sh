#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --no-input

echo "Seeding customers (skips gracefully if Excel file absent)..."
python manage.py seed_customers

echo "Starting development server..."
exec python manage.py runserver 0.0.0.0:8000
