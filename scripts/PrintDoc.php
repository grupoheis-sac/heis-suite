<?php
// scripts/PrintDoc.php
// Receptor local de tramas binarias ESC/POS (58mm/80mm + QR nativo) con soporte CORS + Chrome Private Network Access (PNA)
// Para instalar en el terminal POS: Copiar a C:\xampp\htdocs\SERVER_PRINTPOS\PrintDoc.php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Private-Network: true"); // Crítico para peticiones desde https://suite.grupoheis.com hacia 127.0.0.1
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!$payload) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Payload JSON inválido.']);
    exit;
}

// 1. Respuesta al botón "Probar Ping" de ConfiguracionView.jsx
if (($payload['action'] ?? '') === 'PING') {
    echo json_encode([
        'ok' => true,
        'message' => 'SERVER_PRINTPOS activo y listo.',
        'printer' => $payload['printerName'] ?? 'POS-80',
    ]);
    exit;
}

// 2. Sanitización estricta del nombre de impresora para evitar Command Injection
$printerName = preg_replace('/[^a-zA-Z0-9_\-\s]/', '', $payload['printerName'] ?? 'POS-80');
$rawBase64 = $payload['rawEscPosBase64'] ?? '';

if (empty($rawBase64)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Trama rawEscPosBase64 vacía.']);
    exit;
}

$binaryEscPos = base64_decode($rawBase64, true);
if ($binaryEscPos === false) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Codificación Base64 corrupta.']);
    exit;
}

// 3. Envío directo en modo RAW al Spooler local (Windows SMB share \\localhost\POS-80 o puerto directo)
$tempFile = tempnam(sys_get_temp_dir(), 'heis_pos_');
file_put_contents($tempFile, $binaryEscPos);

if (PHP_OS_FAMILY === 'Windows') {
    $destino = "\\\\localhost\\" . $printerName;
    $copied = @copy($tempFile, $destino);
    @unlink($tempFile);

    if (!$copied) {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'message' => "No se pudo escribir en la impresora compartida '$destino'. Verifica que esté compartida en Windows.",
        ]);
        exit;
    }
} else {
    // Entorno Linux / CUPS en modo raw
    $cmd = sprintf('lp -d %s -o raw %s 2>&1', escapeshellarg($printerName), escapeshellarg($tempFile));
    exec($cmd, $output, $returnVar);
    @unlink($tempFile);

    if ($returnVar !== 0) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => implode("\n", $output)]);
        exit;
    }
}

echo json_encode([
    'ok' => true,
    'bytesSent' => strlen($binaryEscPos),
    'printer' => $printerName,
]);
