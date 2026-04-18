<?php

namespace Database\Seeders;

use App\Models\OfficialLetter;
use App\Models\Role;
use App\Models\TrainingPeriod;
use App\Models\TrainingRequest;
use App\Models\TrainingSite;
use App\Models\User;
use Illuminate\Database\Seeder;

class OfficialLettersSeeder extends Seeder
{
    public function run(): void
    {
        $trainingRequest = TrainingRequest::query()
            ->where('letter_number', 'DEMO-TR-ACTIVE-001')
            ->first()
            ?? TrainingRequest::query()->where('book_status', 'school_approved')->first()
            ?? TrainingRequest::query()->latest()->first();

        $coordinatorRoleId = Role::query()->where('name', 'training_coordinator')->value('id');
        $directorateRoleId = Role::query()->where('name', 'education_directorate')->value('id');
        $schoolManagerRoleId = Role::query()->where('name', 'school_manager')->value('id');

        $coordinatorId = User::query()->where('role_id', $coordinatorRoleId)->value('id');
        $directorateUserId = User::query()->where('role_id', $directorateRoleId)->value('id');
        $schoolManagerId = User::query()->where('role_id', $schoolManagerRoleId)->value('id');

        $siteId = $trainingRequest?->training_site_id
            ?? TrainingSite::query()->value('id');

        if (!$siteId) {
            $fallbackSite = TrainingSite::query()->create([
                'name' => 'مدرسة مثال للتدريب',
                'location' => 'الخليل',
                'phone' => '0590000000',
                'description' => 'موقع تدريبي افتراضي لبيانات الكتب الرسمية',
                'is_active' => true,
                'directorate' => 'وسط',
                'capacity' => 20,
                'site_type' => 'school',
                'governing_body' => 'directorate_of_education',
                'school_type' => 'public',
            ]);
            $siteId = $fallbackSite->id;
        }

        if (!$trainingRequest) {
            $trainingRequest = TrainingRequest::query()->create([
                'letter_number' => 'TR-2026-001',
                'letter_date' => now()->toDateString(),
                'book_status' => 'sent_to_directorate',
                'status' => 'pending',
                'requested_at' => now(),
                'training_site_id' => $siteId,
                'training_period_id' => TrainingPeriod::query()->where('is_active', true)->value('id'),
            ]);
        }

        $letters = [
            [
                'letter_number' => 'OL-2026-001',
                'type' => 'to_directorate',
                'status' => 'sent_to_directorate',
                'content' => 'كتاب تحويل طلب تدريب إلى مديرية التربية للمراجعة الأولية.',
                'sent_by' => $coordinatorId,
                'received_by' => null,
                'sent_at' => now()->subDays(7),
                'received_at' => null,
                'rejection_reason' => null,
                'training_site_id' => null,
            ],
            [
                'letter_number' => 'OL-2026-002',
                'type' => 'to_directorate',
                'status' => 'directorate_approved',
                'content' => 'كتاب تم اعتماده من المديرية بعد مراجعة بيانات الطلبة.',
                'sent_by' => $coordinatorId,
                'received_by' => $directorateUserId,
                'sent_at' => now()->subDays(10),
                'received_at' => now()->subDays(9),
                'rejection_reason' => null,
                'training_site_id' => null,
            ],
            [
                'letter_number' => 'OL-2026-003',
                'type' => 'to_school',
                'status' => 'sent_to_school',
                'content' => 'كتاب موجه إلى مدير المدرسة لتوزيع الطلبة على المعلمين المرشدين.',
                'sent_by' => $directorateUserId,
                'received_by' => null,
                'sent_at' => now()->subDays(5),
                'received_at' => null,
                'rejection_reason' => null,
                'training_site_id' => $siteId,
            ],
            [
                'letter_number' => 'OL-2026-004',
                'type' => 'to_school',
                'status' => 'school_received',
                'content' => 'تم استلام الكتاب من المدرسة وجارٍ تنفيذ الإجراءات.',
                'sent_by' => $directorateUserId,
                'received_by' => $schoolManagerId,
                'sent_at' => now()->subDays(4),
                'received_at' => now()->subDays(3),
                'rejection_reason' => null,
                'training_site_id' => $siteId,
            ],
            [
                'letter_number' => 'OL-2026-005',
                'type' => 'to_directorate',
                'status' => 'rejected',
                'content' => 'كتاب مرفوض لعدم اكتمال بيانات بعض الطلبة.',
                'sent_by' => $coordinatorId,
                'received_by' => $directorateUserId,
                'sent_at' => now()->subDays(2),
                'received_at' => now()->subDay(),
                'rejection_reason' => 'الطلب مرفوض بسبب نقص المستندات لعدد من الطلبة.',
                'training_site_id' => null,
            ],
        ];

        foreach ($letters as $entry) {
            OfficialLetter::query()->updateOrCreate(
                ['letter_number' => $entry['letter_number']],
                [
                    'training_request_id' => $trainingRequest->id,
                    'letter_date' => now()->toDateString(),
                    'file_path' => null,
                    ...$entry,
                ]
            );
        }

        $this->command?->info('تم إدخال أمثلة الكتب الرسمية بنجاح.');
    }
}
