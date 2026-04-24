<?php

namespace App\Enums;

enum BookStatus: string
{
    case DRAFT = 'draft';

    /** طالب أرسل الطلب — بانتظار المنسق */
    case SENT_TO_COORDINATOR = 'sent_to_coordinator';

    /** المنسق يفتح/يعالج الطلب */
    case COORDINATOR_UNDER_REVIEW = 'coordinator_under_review';

    case NEEDS_EDIT = 'needs_edit';
    case COORDINATOR_REJECTED = 'coordinator_rejected';
    case PRELIM_APPROVED = 'prelim_approved';
    case BATCHED_PENDING_SEND = 'batched_pending_send';

    case SENT_TO_DIRECTORATE = 'sent_to_directorate';
    case SENT_TO_HEALTH_MINISTRY = 'sent_to_health_ministry';

    case DIRECTORATE_APPROVED = 'directorate_approved';
    case DIRECTORATE_REJECTED = 'directorate_rejected';
    case HEALTH_MINISTRY_REJECTED = 'health_ministry_rejected';
    case SENT_TO_SCHOOL = 'sent_to_school';
    case SCHOOL_APPROVED = 'school_approved';
    case SCHOOL_REJECTED = 'school_rejected';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'مسودة',
            self::SENT_TO_COORDINATOR => 'مرسل إلى المنسق الأكاديمي',
            self::COORDINATOR_UNDER_REVIEW => 'قيد مراجعة المنسق',
            self::NEEDS_EDIT => 'بحاجة إلى تعديل',
            self::COORDINATOR_REJECTED => 'مرفوض من المنسق',
            self::PRELIM_APPROVED => 'معتمد مبدئيًا — جاهز للتجميع',
            self::BATCHED_PENDING_SEND => 'مجمّع بانتظار الإرسال الرسمي',
            self::SENT_TO_DIRECTORATE => 'مرسل إلى المديرية',
            self::SENT_TO_HEALTH_MINISTRY => 'مرسل إلى وزارة الصحة',
            self::DIRECTORATE_APPROVED => 'موافقة الجهة الرسمية',
            self::DIRECTORATE_REJECTED => 'مرفوض من المديرية',
            self::HEALTH_MINISTRY_REJECTED => 'مرفوض من وزارة الصحة',
            self::SENT_TO_SCHOOL => 'مرسل إلى جهة التدريب',
            self::SCHOOL_APPROVED => 'موافقة جهة التدريب',
            self::SCHOOL_REJECTED => 'مرفوض من جهة التدريب',
            self::REJECTED => 'مرفوض',
        };
    }

    public function isEditableByCoordinator(): bool
    {
        return in_array($this, [
            self::DRAFT,
            self::REJECTED,
            self::COORDINATOR_REJECTED,
            self::DIRECTORATE_REJECTED,
            self::SCHOOL_REJECTED,
        ], true);
    }
}
