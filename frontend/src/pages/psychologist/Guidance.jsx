import PageHeader from "../../components/common/PageHeader";

export default function PsychologistGuidance() {
  return (
    <>
      <PageHeader
        title="الإرشاد والدعم النفسي"
        subtitle="إطار عمل مقترح داخل المنصة الأكاديمية — يمكن ربطه لاحقاً بنماذج طلبات وجدولة مواعيد."
      />

      <div className="section-card mb-3">
        <h4 className="section-title">مجالات الدعم</h4>
        <ul className="list-clean" style={{ paddingRight: 18, listStyle: "disc" }}>
          <li>الضغوط الأكاديمية والامتحانات</li>
          <li>التواصل والاندماج في بيئة التدريب الميداني</li>
          <li>قلق الأداء والخوف من التقييم</li>
          <li>إدارة الوقت أثناء التدريب</li>
        </ul>
      </div>

      <div className="section-card mb-3">
        <h4 className="section-title">إرشادات سرية ومهنية</h4>
        <p className="text-soft">
          يُفضّل أن تُسجَّل الملاحظات الحساسة في النظام المعتمد لدى الجامعة فقط بعد توفر
          صلاحيات وتدفق عمل رسمي. هذه الصفحة توفر مرجعاً إرشادياً عاماً للطلبة والأخصائي.
        </p>
      </div>

      <div className="alert-info alert-custom">
        <strong>للطلبة:</strong> إذا كنت في أزمة نفسية حادة، يُنصح بالتواصل مع خطوط الطوارئ
        أو العيادة الجامعية وفق تعليمات مؤسستك، وليس الاعتماد على هذه الواجهة وحدها.
      </div>
    </>
  );
}
