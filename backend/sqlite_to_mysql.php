<?php

declare(strict_types=1);

/**
 * One-off migration script:
 * Copies all user tables and rows from SQLite to MySQL.
 */

$baseDir = __DIR__;
$envPath = $baseDir . DIRECTORY_SEPARATOR . '.env';
$sqlitePath = $baseDir . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'database.sqlite';

if (!file_exists($envPath)) {
    fwrite(STDERR, "Missing .env file at: {$envPath}\n");
    exit(1);
}

if (!file_exists($sqlitePath)) {
    fwrite(STDERR, "Missing SQLite database at: {$sqlitePath}\n");
    exit(1);
}

$env = parseEnvFile($envPath);

$mysqlHost = $env['DB_HOST'] ?? '127.0.0.1';
$mysqlPort = $env['DB_PORT'] ?? '3306';
$mysqlDb = $env['DB_DATABASE'] ?? '';
$mysqlUser = $env['DB_USERNAME'] ?? 'root';
$mysqlPass = $env['DB_PASSWORD'] ?? '';

if ($mysqlDb === '') {
    fwrite(STDERR, "DB_DATABASE is empty in .env\n");
    exit(1);
}

$sqlite = new PDO('sqlite:' . $sqlitePath, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$mysql = new PDO(
    "mysql:host={$mysqlHost};port={$mysqlPort};dbname={$mysqlDb};charset=utf8mb4",
    $mysqlUser,
    $mysqlPass,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 300,
    ]
);

$mysql->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
$mysql->exec('SET SESSION unique_checks = 0');

$tables = $sqlite->query("
    SELECT name
    FROM sqlite_master
    WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
")->fetchAll(PDO::FETCH_COLUMN);

if (!$tables) {
    fwrite(STDOUT, "No user tables found in SQLite.\n");
    exit(0);
}

fwrite(STDOUT, "Found " . count($tables) . " tables.\n");

$mysql->exec('SET FOREIGN_KEY_CHECKS=0');

try {
    foreach ($tables as $table) {
        $quotedTable = "`" . str_replace("`", "``", $table) . "`";
        fwrite(STDOUT, "Copying table: {$table} ... ");

        if (!mysqlTableExists($mysql, $table)) {
            fwrite(STDOUT, "skipped (table missing in MySQL)\n");
            continue;
        }

        $mysqlColumns = getMySqlColumns($mysql, $table);

        $rows = $sqlite->query("SELECT * FROM \"{$table}\"")->fetchAll();

        if (!$rows) {
            $mysql->exec("DELETE FROM {$quotedTable}");
            fwrite(STDOUT, "done (0 rows)\n");
            continue;
        }

        $sqliteColumns = array_keys($rows[0]);
        $columns = array_values(array_filter($sqliteColumns, static function ($col) use ($mysqlColumns) {
            return in_array($col, $mysqlColumns, true);
        }));

        if (!$columns) {
            fwrite(STDOUT, "skipped (no common columns)\n");
            continue;
        }

        // Clear target table first to avoid duplicates.
        $mysql->exec("DELETE FROM {$quotedTable}");
        $columnList = implode(', ', array_map(static function ($col) {
            return "`" . str_replace("`", "``", (string)$col) . "`";
        }, $columns));
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $insertSql = "INSERT INTO {$quotedTable} ({$columnList}) VALUES ({$placeholders})";
        $stmt = $mysql->prepare($insertSql);

        $batchSize = 500;
        $mysql->beginTransaction();
        $n = 0;
        foreach ($rows as $row) {
            $values = [];
            foreach ($columns as $column) {
                $values[] = $row[$column];
            }
            $stmt->execute($values);
            $n++;
            if ($n % $batchSize === 0) {
                $mysql->commit();
                $mysql->beginTransaction();
            }
        }
        $mysql->commit();

        fwrite(STDOUT, "done (" . count($rows) . " rows)\n");
    }
} catch (Throwable $e) {
    if ($mysql->inTransaction()) {
        $mysql->rollBack();
    }
    $mysql->exec('SET FOREIGN_KEY_CHECKS=1');
    fwrite(STDERR, "Migration failed: " . $e->getMessage() . "\n");
    exit(1);
}

$mysql->exec('SET FOREIGN_KEY_CHECKS=1');
fwrite(STDOUT, "SQLite -> MySQL migration completed successfully.\n");
exit(0);

function parseEnvFile(string $path): array
{
    $vars = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        $eqPos = strpos($line, '=');
        if ($eqPos === false) {
            continue;
        }

        $key = trim(substr($line, 0, $eqPos));
        $value = trim(substr($line, $eqPos + 1));
        $value = trim($value, "\"'");
        $vars[$key] = $value;
    }

    return $vars;
}

function mysqlTableExists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare('SHOW TABLES LIKE ?');
    $stmt->execute([$table]);
    return (bool)$stmt->fetchColumn();
}

function getMySqlColumns(PDO $pdo, string $table): array
{
    $stmt = $pdo->query("DESCRIBE `" . str_replace("`", "``", $table) . "`");
    $cols = [];
    foreach ($stmt->fetchAll() as $row) {
        $cols[] = $row['Field'];
    }
    return $cols;
}
