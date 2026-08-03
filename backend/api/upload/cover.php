<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Upload.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * POST /api/upload/cover.php
 * multipart/form-data with a single field "file" — a post cover image.
 *
 * Requires an authenticated admin session + CSRF header. Validates real
 * MIME type, extension, size, and dimensions server-side; re-encodes and
 * downscales via GD when available (see backend/helpers/Upload.php).
 * Stores the file under uploads/blog/covers/ and records it in `uploads`.
 */

const COVER_MAX_DIMENSION_PX = 1920;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

try {
    $meta = upload_process_image($_FILES['file'] ?? [], 'covers', COVER_MAX_DIMENSION_PX);
} catch (UploadValidationException $e) {
    json_response($e->getCode(), ['error' => $e->getMessage()]);
}

try {
    $pdo = Database::getConnection();

    $insert = $pdo->prepare(
        'INSERT INTO uploads
            (disk_path, public_url, original_name, mime_type, size_bytes, width, height, uploaded_by)
         VALUES
            (:disk_path, :public_url, :original_name, :mime_type, :size_bytes, :width, :height, :uploaded_by)'
    );
    $insert->execute([
        'disk_path' => $meta['disk_path'],
        'public_url' => $meta['public_url'],
        'original_name' => $meta['original_name'],
        'mime_type' => $meta['mime_type'],
        'size_bytes' => $meta['size_bytes'],
        'width' => $meta['width'],
        'height' => $meta['height'],
        'uploaded_by' => (int) $admin['id'],
    ]);

    $uploadId = (int) $pdo->lastInsertId();

    json_response(201, ['data' => [
        'id' => $uploadId,
        'url' => $meta['public_url'],
        'original_name' => $meta['original_name'],
        'mime_type' => $meta['mime_type'],
        'size_bytes' => $meta['size_bytes'],
        'width' => $meta['width'],
        'height' => $meta['height'],
    ]]);
} catch (Throwable $e) {
    @unlink($meta['disk_path']);
    error_log('[upload/cover] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
