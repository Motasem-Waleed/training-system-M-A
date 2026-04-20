export const ROLES = {
  ADMIN: "admin",
  COORDINATOR: "coordinator",
  SUPERVISOR: "supervisor",
  MENTOR: "mentor",
  PRINCIPAL: "principal",
  SCHOOL_MANAGER: "school_manager",
  PSYCHOLOGY_CENTER_MANAGER: "psychology_center_manager",
  HEALTH: "health_directorate",
  EDUCATION: "education_directorate",
  STUDENT: "student",
};

/**
 * يعيد مسميات الواجهة حسب نوع موقع التدريب
 * @param {"school"|"health_center"} siteType
 */
export const siteLabels = (siteType = "school") => {
  const isHealth = siteType === "health_center";
  return {
    siteName: isHealth ? "المركز النفسي" : "المدرسة",
    mentorLabel: isHealth ? "الأخصائي النفسي المرشد" : "المعلم المرشد",
    managerLabel: isHealth ? "مدير المركز النفسي" : "مدير المدرسة",
    requestTitle: isHealth ? "طلبات التدريب — مراجعة وتعيين الأخصائي" : "طلبات التدريب — مراجعة وتعيين المرشد",
    approveBtn: isHealth ? "قبول وتعيين الأخصائيين" : "قبول وتعيين المرشدين",
    mentorSelect: isHealth ? "اختر الأخصائي النفسي المرشد" : "اختر المعلم المرشد",
    mentorCol: isHealth ? "الأخصائي النفسي المرشد" : "المعلم المرشد",
    traineeTitle: isHealth ? "المتدربون في المركز" : "الطلبة المتدربون",
  };
};