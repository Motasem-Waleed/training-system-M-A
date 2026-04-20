<?php
$log = file_get_contents('storage/logs/laravel.log');
$lines = explode("\n", $log);
$lastLines = array_slice($lines, -150);

$errorFound = false;
foreach ($lastLines as $line) {
    if (strpos($line, 'local.ERROR') !== false || strpos($line, 'Exception') !== false || strpos($line, 'ErrorException') !== false) {
        echo $line . "\n";
        $errorFound = true;
    }
    if ($errorFound && (strpos($line, '#') === 0 || strpos($line, 'Stack trace') !== false)) {
        echo $line . "\n";
    }
}

if (!$errorFound) {
    echo "No errors found in recent logs.\n";
}
