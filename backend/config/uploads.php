<?php

declare(strict_types=1);

require_once __DIR__ . '/env.php';

/**
 * Resolves where uploaded files live on disk and how they're addressed on
 * the web, from the single UPLOADS_PATH env var. Shared by install.php (which
 * creates the directories) and backend/helpers/Upload.php (which writes into
 * them), so both always agree on the same location.
 */

/**
 * Absolute base directory for uploaded files, resolved from UPLOADS_PATH.
 * A relative UPLOADS_PATH is resolved against backend/ (this file's parent),
 * matching install.php's historical resolution. No trailing slash.
 */
function uploads_base_dir(): string
{
    $uploadsPath = env_get('UPLOADS_PATH', '../uploads');
    $backendDir = dirname(__DIR__);

    $base = str_starts_with($uploadsPath, '/')
        ? $uploadsPath
        : $backendDir . '/' . $uploadsPath;

    return rtrim($base, '/');
}

/** Web-facing base path uploads are served under (Apache serves uploads/ as static files at this path). */
function uploads_public_base(): string
{
    return '/uploads';
}
