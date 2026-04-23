import { useMemo } from "react";
import { getFieldStaffRoleKey, normalizeRole, ROLES } from "../utils/roles";
import { readStoredUser } from "../utils/session";

/**
 * Hook يحدد دور المستخدم ضمن مجموعة الكادر الميداني الموحد
 * (المعلم المرشد، المشرف الأكاديمي، الأخصائي النفسي، مدير المدرسة، المشرف الميداني).
 *
 * الأدوار الخلفية (backend role names):
 *   teacher             → mentor
 *   academic_supervisor → supervisor
 *   psychologist        → psychologist
 *   school_manager      → principal
 *   field_supervisor    → field_supervisor (مع نوع فرعي: mentor_teacher | school_counselor | psychologist)
 *
 * يوفّر:
 *  - roleKey       : المفتاح الموحّد (mentor | supervisor | psychologist | principal | field_supervisor)
 *  - rawRole       : اسم الدور الأصلي من قاعدة البيانات
 *  - label         : التسمية العربية
 *  - isMentor / isSupervisor / isPsychologist / isPrincipal / isFieldSupervisor : اختصارات
 *  - targetRole    : القيمة المطلوبة لفلترة قوالب التقييم (تُرسل كـ target_role للـ API)
 *  - basePath      : المسار الأساسي الموحّد (/field-staff)
 *  - supervisorSubtype : النوع الفرعي للمشرف الميداني (mentor_teacher | school_counselor | psychologist)
 *  - subtypeLabel  : التسمية العربية للنوع الفرعي
 */

// التسميات حسب النوع الفرعي للمشرف الميداني
const SUBTYPE_LABELS = {
  mentor_teacher: "المعلم المرشد",
  school_counselor: "المرشد التربوي",
  psychologist: "الأخصائي النفسي",
};

// مصطلحات ديناميكية حسب النوع الفرعي
const SUBTYPE_TERMS = {
  mentor_teacher: {
    dailyReport: "التقرير اليومي للتدريس",
    evaluation: "تقييم الأداء التدريسي",
    lesson: "الحصة / الدرس",
    topic: "موضوع الدرس",
    classroom: "إدارة الصف",
  },
  school_counselor: {
    dailyReport: "التقرير الإرشادي اليومي",
    evaluation: "تقييم الأداء الإرشادي",
    lesson: "النشاط الإرشادي",
    topic: "الحالة / الموقف",
    classroom: "الملاحظة التربوية",
  },
  psychologist: {
    dailyReport: "التقرير المهني اليومي",
    evaluation: "تقييم الأداء المهني",
    lesson: "الجلسة / النشاط",
    topic: "طبيعة الحالة",
    classroom: "الملاحظة العلاجية",
  },
};

const FIELD_STAFF_MAP = {
  [ROLES.MENTOR]: {
    roleKey: "mentor",
    label: "المعلم المرشد (المشرف الميداني)",
    targetRole: ROLES.MENTOR,
  },
  [ROLES.SUPERVISOR]: {
    roleKey: "supervisor",
    label: "المشرف الأكاديمي",
    targetRole: ROLES.SUPERVISOR,
  },
  [ROLES.PSYCHOLOGIST]: {
    roleKey: "psychologist",
    label: "الأخصائي النفسي",
    targetRole: ROLES.PSYCHOLOGIST,
  },
  [ROLES.PRINCIPAL]: {
    roleKey: "principal",
    label: "مدير جهة التدريب",
    targetRole: ROLES.PRINCIPAL,
  },
  [ROLES.FIELD_SUPERVISOR]: {
    roleKey: "field_supervisor",
    label: "المشرف الميداني",
    targetRole: ROLES.FIELD_SUPERVISOR,
  },
};

export default function useFieldStaffRole() {
  const info = useMemo(() => {
    const savedUser = readStoredUser();
    const rawRole = normalizeRole(savedUser?.role?.name || savedUser?.role || "");

    const mapped = FIELD_STAFF_MAP[rawRole];

    if (!mapped) {
      // ليس من الكادر الميداني
      return {
        isFieldStaff: false,
        roleKey: getFieldStaffRoleKey(rawRole),
        rawRole,
        label: "",
        targetRole: rawRole,
        basePath: "",
        isMentor: false,
        isSupervisor: false,
        isPsychologist: false,
        isPrincipal: false,
        isFieldSupervisor: false,
        supervisorSubtype: null,
        subtypeLabel: "",
        terms: {},
      };
    }

    // استخراج النوع الفرعي للمشرف الميداني
    const supervisorSubtype = savedUser?.field_supervisor_profile?.supervisor_type || null;
    const subtypeLabel = SUBTYPE_LABELS[supervisorSubtype] || "";
    const terms = SUBTYPE_TERMS[supervisorSubtype] || {};

    // إذا كان مشرف ميداني، استخدم تسمية النوع الفرعي
    const label = rawRole === "field_supervisor"
      ? (subtypeLabel || mapped.label)
      : mapped.label;

    return {
      isFieldStaff: true,
      roleKey: mapped.roleKey,
      rawRole,
      label,
      targetRole: mapped.targetRole,
      basePath: "/field-staff",
      isMentor: mapped.roleKey === "mentor",
      isSupervisor: mapped.roleKey === "supervisor",
      isPsychologist: mapped.roleKey === "psychologist",
      isPrincipal: mapped.roleKey === "principal",
      isFieldSupervisor: mapped.roleKey === "field_supervisor",
      supervisorSubtype,
      subtypeLabel,
      terms,
    };
  }, []);

  return info;
}

export { SUBTYPE_LABELS, SUBTYPE_TERMS };
