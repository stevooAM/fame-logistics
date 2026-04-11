"""
Cloud storage utilities for job document attachments.

This module provides a thin wrapper around boto3 to support S3-compatible
object storage. It is tested against Cloudflare R2 but will work with any
S3-compatible provider (AWS S3, MinIO, etc.).

Configuration is driven entirely by environment variables (via Django settings):
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_S3_ENDPOINT_URL     (R2 endpoint or blank for AWS)
  - AWS_STORAGE_BUCKET_NAME (default: fms-documents)
  - AWS_S3_REGION_NAME      (default: auto)
  - AWS_PRESIGNED_URL_EXPIRY (seconds, default: 3600)

If AWS_ACCESS_KEY_ID is empty the module issues a warning on first client
access. Upload operations will fail with StorageError; the application itself
will not crash on startup.
"""

import logging

import boto3
import botocore.exceptions
from django.conf import settings

logger = logging.getLogger(__name__)

# Module-level cached client — created once, reused across calls.
_s3_client = None


class StorageError(Exception):
    """Raised when an upload to cloud storage fails."""


def _get_s3_client():
    """Return a cached boto3 S3 client configured from Django settings.

    Emits a warning if AWS credentials are not configured so that developers
    know why storage calls will fail, without crashing the application.
    """
    global _s3_client

    if _s3_client is not None:
        return _s3_client

    if not settings.AWS_ACCESS_KEY_ID:
        logger.warning(
            "AWS_ACCESS_KEY_ID is not configured. Cloud storage operations "
            "will fail until credentials are set via environment variables."
        )

    _s3_client = boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )
    return _s3_client


def upload_document(file_obj, key: str) -> str:
    """Upload a file-like object to cloud storage under the given key.

    Args:
        file_obj: A Django UploadedFile or any file-like object opened in
                  binary mode.
        key:      The storage path, e.g. ``jobs/{job_id}/documents/{uuid}_{name}``.

    Returns:
        The storage key (not a URL). Use :func:`get_presigned_url` to obtain
        a temporary download link.

    Raises:
        StorageError: If the upload fails for any reason (network error,
                      invalid credentials, bucket not found, etc.).
    """
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    client = _get_s3_client()
    try:
        client.upload_fileobj(file_obj, bucket, key)
        logger.info("Uploaded document to %s/%s", bucket, key)
        return key
    except botocore.exceptions.BotoCoreError as exc:
        logger.exception("Failed to upload document to %s/%s: %s", bucket, key, exc)
        raise StorageError(f"Upload failed for key '{key}': {exc}") from exc
    except Exception as exc:  # noqa: BLE001 — catch-all so callers get StorageError
        logger.exception(
            "Unexpected error uploading document to %s/%s: %s", bucket, key, exc
        )
        raise StorageError(f"Upload failed for key '{key}': {exc}") from exc


def delete_document(key: str) -> None:
    """Delete a document from cloud storage.

    Silently succeeds if the key does not exist (idempotent). Logs errors
    without re-raising so that a failed deletion never blocks the caller
    (e.g. when rolling back a job record update).

    Args:
        key: The storage key returned by :func:`upload_document`.
    """
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    client = _get_s3_client()
    try:
        client.delete_object(Bucket=bucket, Key=key)
        logger.info("Deleted document %s/%s", bucket, key)
    except botocore.exceptions.BotoCoreError as exc:
        logger.error(
            "Failed to delete document %s/%s (non-fatal): %s", bucket, key, exc
        )
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Unexpected error deleting document %s/%s (non-fatal): %s",
            bucket,
            key,
            exc,
        )


def get_presigned_url(key: str, expiry: int | None = None) -> str:
    """Generate a presigned GET URL for a stored document.

    The URL is time-limited; recipients need no credentials to download the
    file during the validity window.

    Args:
        key:    The storage key returned by :func:`upload_document`.
        expiry: URL validity in seconds. Defaults to
                ``settings.AWS_PRESIGNED_URL_EXPIRY`` (3600 s / 1 hour).

    Returns:
        A presigned URL string.

    Raises:
        StorageError: If URL generation fails.
    """
    if expiry is None:
        expiry = settings.AWS_PRESIGNED_URL_EXPIRY

    bucket = settings.AWS_STORAGE_BUCKET_NAME
    client = _get_s3_client()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expiry,
        )
        return url
    except botocore.exceptions.BotoCoreError as exc:
        logger.exception(
            "Failed to generate presigned URL for %s/%s: %s", bucket, key, exc
        )
        raise StorageError(f"Presigned URL generation failed for key '{key}': {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Unexpected error generating presigned URL for %s/%s: %s",
            bucket,
            key,
            exc,
        )
        raise StorageError(f"Presigned URL generation failed for key '{key}': {exc}") from exc
