<?php

namespace App\Support;

use InvalidArgumentException;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

/**
 * قراءة أول ورقة من ملف ‎.xlsx (Office Open XML) دون تبعيات خارجية.
 */
final class SimpleXlsxReader
{
    /**
     * @return list<list<string>> صفوف من القيم النصية (كل صف مصفوفة مرتبة من العمود A)
     */
    public static function firstSheetRows(string $path): array
    {
        if (! is_readable($path)) {
            throw new InvalidArgumentException('الملف غير قابل للقراءة: '.$path);
        }

        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw new InvalidArgumentException('تعذر فتح ملف الإكسل: '.$path);
        }

        $shared = self::readSharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            throw new RuntimeException('الورقة الأولى (sheet1) غير موجودة في الملف.');
        }

        return self::parseSheet($sheetXml, $shared);
    }

    private static function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $sst = simplexml_load_string($xml);
        if ($sst === false) {
            return [];
        }

        $ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        $sst->registerXPathNamespace('m', $ns);

        $strings = [];
        foreach ($sst->xpath('//m:si') as $si) {
            $si->registerXPathNamespace('m', $ns);
            $parts = $si->xpath('.//m:t');
            $chunk = '';
            foreach ($parts as $t) {
                $chunk .= (string) $t;
            }
            $strings[] = $chunk;
        }

        return $strings;
    }

    private static function parseSheet(string $xml, array $shared): array
    {
        $doc = simplexml_load_string($xml);
        if ($doc === false) {
            return [];
        }

        $ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        $doc->registerXPathNamespace('m', $ns);

        $rows = [];
        foreach ($doc->xpath('//m:sheetData/m:row') as $row) {
            $row->registerXPathNamespace('m', $ns);
            $values = [];
            foreach ($row->xpath('m:c') as $c) {
                $ref = (string) $c['r'];
                if (preg_match('/^([A-Z]+)(\d+)$/i', $ref, $m)) {
                    $idx = self::columnToIndex($m[1]);
                    $values[$idx] = self::cellValue($c, $shared, $ns);
                }
            }
            if ($values === []) {
                continue;
            }
            ksort($values);
            $rows[] = array_values($values);
        }

        return $rows;
    }

    private static function columnToIndex(string $column): int
    {
        $column = strtoupper($column);
        $result = 0;
        $len = strlen($column);
        for ($i = 0; $i < $len; $i++) {
            $result = $result * 26 + (ord($column[$i]) - ord('A') + 1);
        }

        return $result - 1;
    }

    private static function cellValue(SimpleXMLElement $c, array $shared, string $ns): string
    {
        $c->registerXPathNamespace('m', $ns);
        $type = (string) $c['t'];
        $vNodes = $c->xpath('m:v');
        $raw = $vNodes[0] ?? null;
        $rawStr = $raw !== null ? (string) $raw : '';

        if ($type === 's') {
            return $shared[(int) $rawStr] ?? '';
        }

        if ($type === 'inlineStr') {
            $tNodes = $c->xpath('.//m:t');

            return $tNodes ? (string) $tNodes[0] : '';
        }

        return $rawStr;
    }
}
