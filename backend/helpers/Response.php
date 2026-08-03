<?php

declare(strict_types=1);

/**
 * Send a JSON response with the given HTTP status code and terminate the
 * request. Every API endpoint in backend/api/** should exit through here so
 * responses are uniformly shaped and never mix JSON with other output.
 */
function json_response(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Decode a JSON request body (php://input) into an associative array.
 * Returns null if the body is missing or not a valid JSON object.
 */
function read_json_body(): ?array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || $raw === '') {
        return null;
    }

    $decoded = json_decode($raw, true);

    return is_array($decoded) ? $decoded : null;
}
