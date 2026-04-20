import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../app/layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/auth/Login";

// Admin
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import UsersList from "../pages/Admin/Users/UsersList";
import UserForm from "../pages/admin/Users/UserForm";
import RolesList from "../pages/admin/Roles/RolesList";
import RoleForm from "../pages/admin/Roles/RoleForm";
import PermissionsList from "../pages/admin/Permissions/PermissionsList";
import DepartmentsList from "../pages/admin/Departments/DepartmentsList";
import DepartmentForm from "../pages/admin/Departments/DepartmentForm";
import CoursesList from "../pages/admin/Courses/CoursesList";
import CourseForm from "../pages/admin/Courses/CourseForm";
import SectionsList from "../pages/Admin/Sections/SectionsList";
import SectionForm from "../pages/Admin/Sections/SectionForm";
import EnrollmentsList from "../pages/Admin/Enrollments/EnrollmentsList";
import EnrollmentForm from "../pages/Admin/Enrollments/EnrollmentForm";
import TrainingSitesList from "../pages/admin/TrainingSites/TrainingSitesList";
import TrainingSiteForm from "../pages/admin/TrainingSites/TrainingSiteForm";
import TrainingPeriodsList from "../pages/admin/TrainingPeriods/TrainingPeriodsList";
import TrainingPeriodForm from "../pages/admin/TrainingPeriods/TrainingPeriodForm";
import AnnouncementsList from "../pages/admin/Announcements/AnnouncementsList";
import AnnouncementForm from "../pages/admin/Announcements/AnnouncementForm";
import BackupsList from "../pages/admin/Backups/BackupsList";
import ActivityLogsList from "../pages/admin/ActivityLogs/ActivityLogsList";
import FeatureFlagsList from "../pages/admin/FeatureFlags/FeatureFlagsList";
import EvaluationTemplatesList from "../pages/admin/EvaluationTemplates/EvaluationTemplatesList";
import EvaluationTemplateForm from "../pages/admin/EvaluationTemplates/EvaluationTemplateForm";

// ✅ Reports (FIXED)
import ReportsDashboard from "../pages/reports/ReportsDashboard";

// Student
import TrainingRequest from "../pages/student/TrainingRequest";
import StudentDashboard from "../pages/dashboard/StudentDashboard";
import Schedule from "../pages/student/Schedule";
import Portfolio from "../pages/student/Portfolio";
import TrainingLog from "../pages/student/TrainingLog";
import Assignments from "../pages/student/Assignments";
import NotificationsUpdates from "../pages/student/NotificationsUpdates";
import StudentAttendance from "../pages/student/Attendance";

// Common
import Profile from "../pages/common/Profile";
import ChangePassword from "../pages/common/ChangePassword";
import Notifications from "../pages/common/Notifications";

// Supervisor
import SupervisorDashboard from "../pages/dashboard/SupervisorDashboard";
import Tasks from "../pages/supervisor/Tasks";
import FieldVisits from "../pages/supervisor/FieldVisits";
import Sections from "../pages/supervisor/Sections";
import Evaluations from "../pages/supervisor/Evaluations";
import SupervisorReports from "../pages/supervisor/Reports";
import Submissions from "../pages/supervisor/Submissions";


// Mentor (المعلم المرشد — دور teacher)
import MentorDashboard from "../pages/dashboard/MentorDashboard";
import MentorAttendance from "../pages/mentor/Attendance";
import MentorStudents from "../pages/mentor/MentorStudents";
import MentorTasks from "../pages/mentor/MentorTasks";
import MentorEvaluations from "../pages/mentor/MentorEvaluations";
import MentorSchedule from "../pages/mentor/MentorSchedule";

// Psychologist
import PsychologistDashboard from "../pages/dashboard/PsychologistDashboard";
import PsychologistStudents from "../pages/psychologist/Students";
import PsychologistGuidance from "../pages/psychologist/Guidance";

// Coordinator
import CoordinatorDashboard from "../pages/dashboard/CoordinatorDashboard";
import CoordinatorStudents from "../pages/coordinator/Students";
import CoordinatorDistribution from "../pages/coordinator/Distribution";
import CoordinatorStatistics from "../pages/coordinator/Statistics";

// Principal
import PrincipalDashboard from "../pages/dashboard/PrincipalDashboard";
import PrincipalProfile from "../pages/principal/Profile";
import MentorAssignment from "../pages/principal/MentorAssignment";
import TraineeStudents from "../pages/principal/TraineeStudents";

// Health Directorate
import HealthDirectorateDashboard from "../pages/dashboard/HealthDirectorateDashboard";
import HealthTrainingSites from "../pages/healthDirectorate/HealthTrainingSites";

// Education Directorate
import EducationDirectorateDashboard from "../pages/dashboard/EducationDirectorateDashboard";
import TrainingSites from "../pages/educationDirectorate/TrainingSites";
import EducationOfficialLetters from "../pages/educationDirectorate/OfficialLetters";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Admin Routes */}
          <Route path="/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/users/create" element={<UserForm />} />
          <Route path="/admin/users/edit/:id" element={<UserForm />} />

          <Route path="/admin/roles" element={<RolesList />} />
          <Route path="/admin/roles/create" element={<RoleForm />} />
          <Route path="/admin/roles/edit/:id" element={<RoleForm />} />

          <Route path="/admin/permissions" element={<PermissionsList />} />

          <Route path="/admin/departments" element={<DepartmentsList />} />
          <Route path="/admin/departments/create" element={<DepartmentForm />} />
          <Route path="/admin/departments/edit/:id" element={<DepartmentForm />} />

          <Route path="/admin/courses" element={<CoursesList />} />
          <Route path="/admin/courses/create" element={<CourseForm />} />
          <Route path="/admin/courses/edit/:id" element={<CourseForm />} />

          <Route path="/admin/sections" element={<SectionsList />} />
          <Route path="/admin/sections/create" element={<SectionForm />} />
          <Route path="/admin/sections/edit/:id" element={<SectionForm />} />

          <Route path="/admin/enrollments" element={<EnrollmentsList />} />
          <Route path="/admin/enrollments/create" element={<EnrollmentForm />} />
          <Route path="/admin/enrollments/edit/:id" element={<EnrollmentForm />} />

          <Route path="/admin/training-sites" element={<TrainingSitesList />} />
          <Route path="/admin/training-sites/create" element={<TrainingSiteForm />} />
          <Route path="/admin/training-sites/edit/:id" element={<TrainingSiteForm />} />

          <Route path="/admin/training-periods" element={<TrainingPeriodsList />} />
          <Route path="/admin/training-periods/create" element={<TrainingPeriodForm />} />
          <Route path="/admin/training-periods/edit/:id" element={<TrainingPeriodForm />} />

          <Route path="/admin/announcements" element={<AnnouncementsList />} />
          <Route path="/admin/announcements/create" element={<AnnouncementForm />} />
          <Route path="/admin/announcements/edit/:id" element={<AnnouncementForm />} />

          <Route path="/admin/backups" element={<BackupsList />} />
          <Route path="/admin/activity-logs" element={<ActivityLogsList />} />
          <Route path="/admin/feature-flags" element={<FeatureFlagsList />} />

          <Route path="/admin/evaluation-templates" element={<EvaluationTemplatesList />} />
          <Route path="/admin/evaluation-templates/create" element={<EvaluationTemplateForm />} />
          <Route path="/admin/evaluation-templates/edit/:id" element={<EvaluationTemplateForm />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsDashboard />} />

          {/* Student */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/schedule" element={<Schedule />} />
          <Route path="/student/portfolio" element={<Portfolio />} />
          <Route path="/student/training-log" element={<TrainingLog />} />
          <Route path="/student/assignments" element={<Assignments />} />
          <Route path="/student/training-request" element={<TrainingRequest />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/notifications-updates" element={<NotificationsUpdates />} />

          {/* Supervisor */}
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
          <Route path="/supervisor/tasks" element={<Tasks />} />
          <Route path="/supervisor/field-visits" element={<FieldVisits />} />
          <Route path="/supervisor/sections" element={<Sections />} />
          <Route path="/supervisor/evaluations" element={<Evaluations />} />
          <Route path="/supervisor/reports" element={<SupervisorReports />} />
          <Route path="/supervisor/submissions" element={<Submissions />} />
          

          {/* Mentor / المعلم المرشد */}
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          <Route path="/mentor/students" element={<MentorStudents />} />
          <Route path="/mentor/tasks" element={<MentorTasks />} />
          <Route path="/mentor/attendance" element={<MentorAttendance />} />
          <Route path="/mentor/evaluations" element={<MentorEvaluations />} />
          <Route path="/mentor/schedule" element={<MentorSchedule />} />

          {/* الأخصائي النفسي */}
          <Route path="/psychologist/dashboard" element={<PsychologistDashboard />} />
          <Route path="/psychologist/students" element={<PsychologistStudents />} />
          <Route path="/psychologist/guidance" element={<PsychologistGuidance />} />

          {/* Coordinator */}
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/students" element={<CoordinatorStudents />} />
          <Route path="/coordinator/distribution" element={<CoordinatorDistribution />} />
          <Route path="/coordinator/statistics" element={<CoordinatorStatistics />} />

          {/* Principal */}
          <Route path="/principal/dashboard" element={<PrincipalDashboard siteType="school" />} />
          <Route path="/principal/profile" element={<PrincipalProfile />} />
          <Route path="/principal/mentor-assignment" element={<MentorAssignment siteType="school" />} />
          <Route path="/principal/trainee-students" element={<TraineeStudents siteType="school" />} />

          {/* Psychology Center */}
          <Route path="/psychology-center/dashboard" element={<PrincipalDashboard siteType="health_center" />} />
          <Route path="/psychology-center/profile" element={<PrincipalProfile siteType="health_center" />} />
          <Route path="/psychology-center/mentor-assignment" element={<MentorAssignment siteType="health_center" />} />
          <Route path="/psychology-center/trainee-students" element={<TraineeStudents siteType="health_center" />} />

          {/* Health */}
          <Route path="/health/dashboard" element={<HealthDirectorateDashboard />} />
          <Route path="/health/training-sites" element={<HealthTrainingSites />} />

          {/* Education */}
          <Route path="/education/dashboard" element={<EducationDirectorateDashboard />} />
          <Route path="/education/training-sites" element={<TrainingSites />} />
          <Route path="/education/official-letters" element={<EducationOfficialLetters />} />

          {/* Common */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* 404 — أي رابط غير معروف */}
          <Route path="*" element={
            <div style={{ padding: 40, textAlign: "center" }}>
              <h2>الصفحة غير موجودة</h2>
              <p>الرابط الذي تحاول الوصول إليه غير متاح.</p>
              <a href="/principal/dashboard" style={{ color: "var(--primary)", fontWeight: "bold" }}>العودة للرئيسية</a>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}