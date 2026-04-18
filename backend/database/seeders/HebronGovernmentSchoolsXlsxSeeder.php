<?php

namespace Database\Seeders;

use App\Models\TrainingSite;
use App\Support\SimpleXlsxReader;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * يستورد مدارس من ملف الإكسل في جذر المشروع إلى جدول training_sites.
 *
 * الملف المتوقع: «بيانات المدارس الحكومية - الخليل.xlsx»
 * يُفضَّل أن يحتوي الصف الأول على عناوين أعمدة عربية؛ يُعاد تعيينها تلقائياً.
 */
class HebronGovernmentSchoolsXlsxSeeder extends Seeder
{
    private const XLSX_FILENAME = 'بيانات المدارس الحكومية - الخليل.xlsx';

    public function run(): void
    {
        $path = dirname(base_path()).DIRECTORY_SEPARATOR.self::XLSX_FILENAME;

        if (! is_readable($path)) {
            $this->command?->warn('تخطّي: لم يُعثر على ملف البيانات: '.$path);

            return;
        }

        try {
            $rows = SimpleXlsxReader::firstSheetRows($path);
        } catch (\Throwable $e) {
            $this->command?->error('فشل قراءة الإكسل: '.$e->getMessage());

            return;
        }

        if ($rows === []) {
            $this->command?->warn('الملف لا يحتوي صفوفاً.');

            return;
        }

        $headers = array_shift($rows);
        $map = $this->buildColumnMap($headers);

        if (! isset($map['name'])) {
            $this->command?->error('لم يُعثر على عمود اسم المدرسة في الصف الأول. العناوين: '.json_encode($headers, JSON_UNESCAPED_UNICODE));

            return;
        }

        $imported = 0;
        foreach ($rows as $row) {
            $record = $this->rowToRecord($row, $map);
            if ($record === null) {
                continue;
            }

            TrainingSite::query()->updateOrCreate(
                ['name' => $record['name']],
                $record
            );
            $imported++;
        }

        $this->command?->info("تم استيراد/تحديث {$imported} مدرسة من ملف الإكسل.");
    }

    /**
     * يطابق عناوين الأعمدة مع حقول الجدول.
     *
     * @param  list<string>  $headers
     * @return array<string, int>  مفتاح الحقل => فهرس العمود
     */
    private function buildColumnMap(array $headers): array
    {
        $map = [];
        foreach ($headers as $i => $h) {
            $key = $this->normalizeHeader((string) $h);
            if ($key === '') {
                continue;
            }

            $field = match (true) {
                Str::contains($key, ['اسم المدرسة', 'اسم مدرسة', 'المدرسة', 'المؤسسة', 'الاسم']) && ! Str::contains($key, ['مدير', 'مشرف']) => 'name',
                Str::contains($key, ['مديرية', 'المديرية', 'منطقة', 'directorate']) => 'directorate',
                Str::contains($key, ['موقع', 'العنوان', 'مكان', 'البلدة', 'location', 'المنطقة']) && ! Str::contains($key, ['مدير']) => 'location',
                Str::contains($key, ['هاتف', 'جوال', 'phone', 'تليفون']) => 'phone',
                Str::contains($key, ['سعة', 'capacity', 'عدد', 'طاقة']) => 'capacity',
                Str::contains($key, ['ملاحظات', 'وصف', 'description', 'تفاصيل']) => 'description',
                default => null,
            };

            if ($field !== null && ! isset($map[$field])) {
                $map[$field] = $i;
            }
        }

        if (! isset($map['name']) && isset($headers[0])) {
            $map['name'] = 0;
        }
        if (count($headers) > 1 && ! isset($map['directorate'])) {
            $map['directorate'] = 1;
        }
        if (count($headers) > 2 && ! isset($map['location'])) {
            $map['location'] = 2;
        }

        return $map;
    }

    private function normalizeHeader(string $h): string
    {
        $h = trim(preg_replace('/\s+/u', ' ', $h) ?? '');

        return $h;
    }

    /**
     * @param  list<string>  $row
     * @param  array<string, int>  $map
     */
    private function rowToRecord(array $row, array $map): ?array
    {
        $name = trim($row[$map['name']] ?? '');
        if ($name === '') {
            return null;
        }

        $directorateRaw = isset($map['directorate']) ? trim((string) ($row[$map['directorate']] ?? '')) : '';
        $directorate = $this->normalizeDirectorate($directorateRaw);

        $location = isset($map['location']) ? trim((string) ($row[$map['location']] ?? '')) : '';
        if ($location === '') {
            $location = 'الخليل';
        }

        $phone = isset($map['phone']) ? trim((string) ($row[$map['phone']] ?? '')) : '';
        $phone = $phone !== '' ? $phone : null;

        $capacity = null;
        if (isset($map['capacity'])) {
            $c = trim($row[$map['capacity']] ?? '');
            if ($c !== '' && is_numeric($c)) {
                $capacity = (int) $c;
            }
        }

        $description = null;
        if (isset($map['description'])) {
            $d = trim($row[$map['description']] ?? '');
            $description = $d !== '' ? $d : null;
        }

        return [
            'name' => $name,
            'location' => $location,
            'phone' => $phone,
            'description' => $description,
            'is_active' => true,
            'directorate' => $directorate,
            'capacity' => $capacity ?? 10,
            'site_type' => 'school',
            'governing_body' => 'directorate_of_education',
            'school_type' => 'public',
        ];
    }

    /**
     * قيمة عمود المديرية → واحدة من قيم enum الجدول: وسط، شمال، جنوب، يطا.
     */
    private function normalizeDirectorate(string $raw): string
    {
        $n = mb_strtolower($raw, 'UTF-8');

        if (Str::contains($n, ['شمال', 'north'])) {
            return 'شمال';
        }
        if (Str::contains($n, ['جنوب', 'south'])) {
            return 'جنوب';
        }
        if (Str::contains($n, ['يطا', 'yatta'])) {
            return 'يطا';
        }
        if (Str::contains($n, ['وسط', 'الخليل', 'hebron'])) {
            return 'وسط';
        }

        return 'وسط';
    }
}
