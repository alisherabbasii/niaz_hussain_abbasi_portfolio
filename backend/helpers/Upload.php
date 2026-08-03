<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/uploads.php';

/**
 * Image upload validation, re-encoding, and storage for
 * backend/api/upload/{cover,editor}.php.
 *
 * Security posture (docs/01-CMS-ARCHITECTURE.md §7.7/§8):
 *  - Real content is sniffed via finfo + getimagesize(), never the client's
 *    Content-Type header or filename.
 *  - The client's filename is only used to sanity-check its extension
 *    against the sniffed type; the stored filename is always a fresh random
 *    one, so the client never controls the on-disk path.
 *  - When GD is available, every image is fully re-decoded and re-encoded
 *    (and downscaled if oversized), which strips any non-pixel payload
 *    (embedded scripts, polyglot bytes, EXIF) and normalizes the format.
 *    GD collapses animated GIFs to their first frame — an accepted
 *    trade-off for the same reason. Hosts without GD still get every other
 *    validation layer; the original (already-validated) bytes are stored
 *    as-is.
 */

/** Thrown for any rejected upload; getCode() is the HTTP status the endpoint should return. */
final class UploadValidationException extends RuntimeException
{
}

/** Hard cap in bytes, overridable via UPLOAD_MAX_BYTES. Default 8 MiB. */
function upload_max_bytes(): int
{
    return (int) env_get('UPLOAD_MAX_BYTES', (string) (8 * 1024 * 1024));
}

/** Images wider or taller than this (in px) are rejected outright rather than resized. */
const UPLOAD_MAX_DIMENSION_PX = 4000;

/** Images smaller than this on either axis are rejected as unusable. */
const UPLOAD_MIN_DIMENSION_PX = 8;

/**
 * Allow-listed image types: IMAGETYPE_* => [canonical extension, mime type,
 * accepted client-filename extensions, GD decode fn, GD encode fn].
 */
function upload_allowed_types(): array
{
    return [
        IMAGETYPE_JPEG => ['jpg', 'image/jpeg', ['jpg', 'jpeg'], 'imagecreatefromjpeg', 'imagejpeg'],
        IMAGETYPE_PNG => ['png', 'image/png', ['png'], 'imagecreatefrompng', 'imagepng'],
        IMAGETYPE_WEBP => ['webp', 'image/webp', ['webp'], 'imagecreatefromwebp', 'imagewebp'],
        IMAGETYPE_GIF => ['gif', 'image/gif', ['gif'], 'imagecreatefromgif', 'imagegif'],
    ];
}

/**
 * Validate an entry from $_FILES, re-encode/downscale it, store it under
 * uploads/blog/{$kind}/, and return its metadata.
 *
 * @param array  $file          A single $_FILES[...] entry.
 * @param string $kind          'covers' or 'content' — selects the storage subdirectory.
 * @param int    $maxDimension  Long-edge target in px to downscale to (only shrinks, never enlarges).
 *
 * @return array{disk_path: string, public_url: string, original_name: string,
 *               mime_type: string, size_bytes: int, width: int, height: int}
 *
 * @throws UploadValidationException on any validation failure (getCode() is the HTTP status).
 */
function upload_process_image(array $file, string $kind, int $maxDimension): array
{
    $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;

    if ($error === UPLOAD_ERR_NO_FILE) {
        throw new UploadValidationException('No file was uploaded.', 400);
    }

    if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
        throw new UploadValidationException('File exceeds the maximum allowed size.', 413);
    }

    if ($error !== UPLOAD_ERR_OK) {
        throw new UploadValidationException('File upload failed. Please try again.', 400);
    }

    $tmpPath = $file['tmp_name'] ?? '';

    if (!is_string($tmpPath) || $tmpPath === '' || !is_uploaded_file($tmpPath)) {
        throw new UploadValidationException('Invalid upload.', 400);
    }

    $sizeBytes = (int) filesize($tmpPath);

    if ($sizeBytes <= 0) {
        throw new UploadValidationException('Uploaded file is empty.', 422);
    }

    if ($sizeBytes > upload_max_bytes()) {
        $maxMb = round(upload_max_bytes() / (1024 * 1024), 1);
        throw new UploadValidationException("File exceeds the maximum allowed size of {$maxMb} MB.", 413);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $sniffedMime = $finfo->file($tmpPath) ?: '';

    $imageInfo = @getimagesize($tmpPath);

    if ($imageInfo === false) {
        throw new UploadValidationException('File is not a valid image.', 422);
    }

    [$width, $height, $imageType] = $imageInfo;

    $allowedTypes = upload_allowed_types();

    if (!isset($allowedTypes[$imageType])) {
        throw new UploadValidationException('Unsupported image type. Allowed formats: JPG, PNG, WEBP, GIF.', 422);
    }

    [$canonicalExt, $expectedMime, $acceptedExtensions, $decodeFn, $encodeFn] = $allowedTypes[$imageType];

    if ($sniffedMime !== $expectedMime || ($imageInfo['mime'] ?? '') !== $expectedMime) {
        throw new UploadValidationException('File content does not match a supported image type.', 422);
    }

    $originalName = is_string($file['name'] ?? null) ? basename($file['name']) : '';
    $originalExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!in_array($originalExt, $acceptedExtensions, true)) {
        throw new UploadValidationException('File extension does not match its content.', 422);
    }

    if ($width < UPLOAD_MIN_DIMENSION_PX || $height < UPLOAD_MIN_DIMENSION_PX) {
        throw new UploadValidationException('Image is too small (minimum ' . UPLOAD_MIN_DIMENSION_PX . 'x' . UPLOAD_MIN_DIMENSION_PX . 'px).', 422);
    }

    if ($width > UPLOAD_MAX_DIMENSION_PX || $height > UPLOAD_MAX_DIMENSION_PX) {
        throw new UploadValidationException('Image dimensions exceed the maximum allowed (' . UPLOAD_MAX_DIMENSION_PX . 'x' . UPLOAD_MAX_DIMENSION_PX . 'px).', 422);
    }

    $destDir = uploads_base_dir() . '/blog/' . $kind;

    if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
        throw new RuntimeException("Failed to create upload directory: {$destDir}");
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $canonicalExt;
    $destPath = $destDir . '/' . $filename;

    $finalMime = $expectedMime;
    $finalWidth = $width;
    $finalHeight = $height;

    $reencoded = function_exists($decodeFn) && function_exists($encodeFn)
        && upload_reencode_image($tmpPath, $destPath, $decodeFn, $encodeFn, $canonicalExt, $width, $height, $maxDimension);

    if ($reencoded) {
        $finalImageInfo = @getimagesize($destPath);
        if ($finalImageInfo !== false) {
            $finalWidth = $finalImageInfo[0];
            $finalHeight = $finalImageInfo[1];
        }
    } elseif (!move_uploaded_file($tmpPath, $destPath)) {
        throw new RuntimeException("Failed to store uploaded file at: {$destPath}");
    }

    $finalSizeBytes = (int) filesize($destPath);

    return [
        'disk_path' => $destPath,
        'public_url' => uploads_public_base() . '/blog/' . $kind . '/' . $filename,
        'original_name' => substr($originalName !== '' ? $originalName : $filename, 0, 255),
        'mime_type' => $finalMime,
        'size_bytes' => $finalSizeBytes,
        'width' => $finalWidth,
        'height' => $finalHeight,
    ];
}

/**
 * Decode $srcPath via GD, downscale it to $maxDimension (long edge, never
 * upscales), and write it to $destPath via GD. Returns false (leaving
 * $destPath untouched) if GD fails to decode the source, so the caller can
 * fall back to storing the original bytes.
 */
function upload_reencode_image(
    string $srcPath,
    string $destPath,
    string $decodeFn,
    string $encodeFn,
    string $canonicalExt,
    int $srcWidth,
    int $srcHeight,
    int $maxDimension
): bool {
    $image = @$decodeFn($srcPath);

    if ($image === false) {
        return false;
    }

    imagealphablending($image, false);
    imagesavealpha($image, true);

    $scale = min(1.0, $maxDimension / max($srcWidth, $srcHeight));
    $targetWidth = $scale < 1.0 ? max(1, (int) round($srcWidth * $scale)) : $srcWidth;
    $targetHeight = $scale < 1.0 ? max(1, (int) round($srcHeight * $scale)) : $srcHeight;

    if ($targetWidth !== $srcWidth || $targetHeight !== $srcHeight) {
        $resized = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $srcWidth, $srcHeight);
        imagedestroy($image);
        $image = $resized;
    }

    $ok = match ($canonicalExt) {
        'jpg' => $encodeFn($image, $destPath, 85),
        'png' => $encodeFn($image, $destPath, 6),
        'webp' => $encodeFn($image, $destPath, 85),
        default => $encodeFn($image, $destPath),
    };

    imagedestroy($image);

    return $ok;
}

/** True if $path resolves to somewhere inside the uploads base directory (defense against path traversal). */
function upload_path_is_within_uploads(string $path): bool
{
    $base = realpath(uploads_base_dir());
    $real = realpath($path);

    if ($base === false || $real === false) {
        return false;
    }

    return str_starts_with($real, $base . DIRECTORY_SEPARATOR);
}
