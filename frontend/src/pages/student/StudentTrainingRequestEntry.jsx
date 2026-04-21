import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkFeatureFlag } from "../../services/api";
import TrainingRequest from "./TrainingRequest";

export default function StudentTrainingRequestEntry() {
  const [isOpen, setIsOpen] = useState(null);

  useEffect(() => {
    let mounted = true;
    checkFeatureFlag("training_requests.create")
      .then((res) => {
        if (!mounted) return;
        setIsOpen(Boolean(res?.is_open));
      })
      .catch(() => {
        if (!mounted) return;
        setIsOpen(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (isOpen === null) {
    return (
      <div className="section-card">
        <p>جاري التحقق من إعدادات الميزة...</p>
      </div>
    );
  }

  if (!isOpen) {
    return <Navigate to="/student/training-request-status" replace />;
  }

  return <TrainingRequest />;
}
