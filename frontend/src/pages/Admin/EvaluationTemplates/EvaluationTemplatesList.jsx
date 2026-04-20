import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvaluationTemplates, deleteEvaluationTemplate } from "../../../services/api";

export default function EvaluationTemplatesList() {
  const [templates, setTemplates] = useState([]);
  useEffect(() => { fetch(); }, []);
  const fetch = async () => { const data = await getEvaluationTemplates(); setTemplates(data.data || []); };
  const handleDelete = async (id) => { if (confirm("حذف القالب؟")) { await deleteEvaluationTemplate(id); fetch(); } };
  return (
    <div>
      <div className="page-header"><h1>قوالب التقييم</h1><Link to="/admin/evaluation-templates/create" className="btn-primary">+ إضافة قالب</Link></div>
      <table className="data-table">
        <thead><tr><th>الاسم</th><th>النوع</th><th>الدور المستهدف</th><th>عدد البنود</th><th>إجراءات</th></tr></thead>
        <tbody>{templates.map(t => (
          <tr key={t.id}><td>{t.name}</td><td>{t.form_type === "evaluation" ? "تقييم" : "نموذج طالب"}</td><td>{t.target_role_label || "عام"}</td><td>{t.items?.length || 0}</td>
          <td><Link to={`/admin/evaluation-templates/edit/${t.id}`} className="btn-sm">تعديل</Link><button onClick={() => handleDelete(t.id)} className="btn-sm danger">حذف</button></td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}