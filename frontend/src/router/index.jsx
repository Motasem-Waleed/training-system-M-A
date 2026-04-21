import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../app/layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/auth/Login";

// Admin
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import UsersList from "../pages/Admin/Users/UsersList";
import UserForm from "../pages/Admin/Users/UserForm";
import AddStudent from "../pages/Admin/Users/AddStudent";
import AddTeacher from "../pages/Admin/Users/AddTeacher";
import AddCounselor from "../pages/Admin/Users/AddCounselor";
import AddPsychologist from "../pages/Admin/Users/AddPsychologist";
import AddAcademicSupervisor from "../pages/Admin/Users/AddAcademicSupervisor";
import AddSchoolManager from "../pages/Admin/Users/AddSchoolManager";
import RolesList from "../pages/Admin/Roles/RolesList";
import RoleForm from "../pages/Admin/Roles/RoleForm";
import PermissionsList from "../pages/Admin/Permissions/PermissionsList";
import DepartmentsList from "../pages/Admin/Departments/DepartmentsList";
import DepartmentForm from "../pages/Admin/Departments/DepartmentForm";
import CoursesList from "../pages/Admin/Courses/CoursesList";
import CourseForm from "../pages/Admin/Courses/CourseForm";
import SectionsList from "../pages/Admin/Sections/SectionsList";
import SectionForm from "../pages/Admin/Sections/SectionForm";
import BulkUploadSections from "../pages/Admin/Sections/BulkUploadSections";
import AddStudentsToSection from "../pages/Admin/Sections/AddStudentsToSection";
import ImportSections from "../pages/Admin/Sections/ImportSections";
import BulkAddStudents from "../pages/Admin/Sections/BulkAddStudents";
import EnrollmentsList from "../pages/Admin/Enrollments/EnrollmentsList";
import EnrollmentForm from "../pages/Admin/Enrollments/EnrollmentForm";
import TrainingSitesList from "../pages/Admin/TrainingSites/TrainingSitesList";
import TrainingSiteForm from "../pages/Admin/TrainingSites/TrainingSiteForm";
import TrainingPeriodsList from "../pages/Admin/TrainingPeriods/TrainingPeriodsList";
import TrainingPeriodForm from "../pages/Admin/TrainingPeriods/TrainingPeriodForm";
import AnnouncementsList from "../pages/Admin/Announcements/AnnouncementsList";
import AnnouncementForm from "../pages/Admin/Announcements/AnnouncementForm";
import BackupsList from "../pages/Admin/Backups/BackupsList";
import BackupDetails from "../pages/Admin/Backups/BackupDetails";
import TableData from "../pages/Admin/Backups/TableData";
import ActivityLogsList from "../pages/Admin/ActivityLogs/ActivityLogsList";
import FeatureFlagsList from "../pages/Admin/FeatureFlags/FeatureFlagsList";
import EvaluationTemplatesList from "../pages/Admin/EvaluationTemplates/EvaluationTemplatesList";
import EvaluationTemplateForm from "../pages/Admin/EvaluationTemplates/EvaluationTemplateForm";

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
import SupervisorWorkspace from "../pages/supervisor/workspace/SupervisorWorkspace";
import FieldVisits from "../pages/supervisor/FieldVisits";
import Sections from "../pages/supervisor/Sections";
import SupervisorReports from "../pages/supervisor/Reports";
import Submissions from "../pages/supervisor/Submissions";


// Mentor (المعلم المرشد — دور teacher) — legacy, kept for reference
import MentorAttendance from "../pages/mentor/Attendance";
import MentorSchedule from "../pages/mentor/MentorSchedule";

// Unified Field Staff pages (mentor, supervisor, psychologist, principal)
import FieldStaffDashboard from "../pages/fieldStaff/Dashboard";
import FieldStaffStudents from "../pages/fieldStaff/Students";
import FieldStaffEvaluations from "../pages/fieldStaff/Evaluations";
import FieldStaffNotes from "../pages/fieldStaff/Notes";
import FieldStaffDailyReports from "../pages/fieldStaff/DailyReports";
import FieldStaffGuidance from "../pages/fieldStaff/Guidance";
import FieldStaffTasks from "../pages/fieldStaff/Tasks";
import FieldStaffFinalEvaluation from "../pages/fieldStaff/FinalEvaluation";

// Coordinator
import CoordinatorDashboard from "../pages/dashboard/CoordinatorDashboard";
import CoordinatorStudents from "../pages/coordinator/Students";
import CoordinatorDistribution from "../pages/coordinator/Distribution";
import CoordinatorStatistics from "../pages/coordinator/Statistics";
import CoordinatorTrainingRequests from "../pages/coordinator/TrainingRequests";

// Principal
import PrincipalDashboard from "../pages/dashboard/PrincipalDashboard";
import PrincipalProfile from "../pages/principal/Profile";
import MentorAssignment from "../pages/principal/MentorAssignment";
import TraineeStudents from "../pages/principal/TraineeStudents";
import PrincipalOfficialLetters from "../pages/principal/OfficialLetters";
import PrincipalTrainingRequests from "../pages/principal/TrainingRequests";

// Health Directorate
import HealthDirectorateDashboard from "../pages/dashboard/HealthDirectorateDashboard";
import HealthTrainingSites from "../pages/healthDirectorate/HealthTrainingSites";

// Education Directorate
import EducationDirectorateDashboard from "../pages/dashboard/EducationDirectorateDashboard";
import TrainingSites from "../pages/educationDirectorate/TrainingSites";
import EducationOfficialLetters from "../pages/educationDirectorate/OfficialLetters";
import HealthOfficialLetters from "../pages/healthDirectorate/OfficialLetters";

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
          <Route path="/admin/users/add/student" element={<AddStudent />} />
          <Route path="/admin/users/edit/student/:id" element={<AddStudent />} />
          <Route path="/admin/users/add/teacher" element={<AddTeacher />} />
          <Route path="/admin/users/edit/teacher/:id" element={<AddTeacher />} />
          <Route path="/admin/users/add/counselor" element={<AddCounselor />} />
          <Route path="/admin/users/edit/counselor/:id" element={<AddCounselor />} />
          <Route path="/admin/users/add/psychologist" element={<AddPsychologist />} />
          <Route path="/admin/users/edit/psychologist/:id" element={<AddPsychologist />} />
          <Route path="/admin/users/add/academic-supervisor" element={<AddAcademicSupervisor />} />
          <Route path="/admin/users/edit/academic-supervisor/:id" element={<AddAcademicSupervisor />} />
          <Route path="/admin/users/add/schoolmanager" element={<AddSchoolManager />} />
          <Route path="/admin/users/edit/schoolmanager/:id" element={<AddSchoolManager />} />
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
          <Route path="/admin/sections/bulk-upload" element={<BulkUploadSections />} />
          <Route path="/admin/sections/:id/add-students" element={<AddStudentsToSection />} />
          <Route path="/admin/sections/import" element={<ImportSections />} />
          <Route path="/admin/sections/add-students-bulk" element={<BulkAddStudents />} />

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
          <Route path="/admin/backups/:id" element={<BackupDetails />} />
          <Route path="/admin/backups/:id/table/:tableName" element={<TableData />} />
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

          {/* ═══════════════════════════════════════════════════════
              Supervisor Routes — مساحة عمل المشرف الأكاديمي الموحدة
          ═══════════════════════════════════════════════════════ */}
          {/* مساحة العمل الموحدة — المركز الرئيسي */}
          <Route path="/supervisor/workspace" element={<SupervisorWorkspace />} />
          <Route path="/supervisor/workspace/:studentId" element={<SupervisorWorkspace />} />

          {/* الصفحات الموحدة — تُوجّه لـ field-staff */}
          <Route path="/supervisor/dashboard" element={<FieldStaffDashboard />} />
          <Route path="/supervisor/students" element={<FieldStaffStudents />} />
          <Route path="/supervisor/evaluations" element={<FieldStaffEvaluations />} />
          <Route path="/supervisor/notes" element={<FieldStaffNotes />} />
          <Route path="/supervisor/tasks" element={<FieldStaffTasks />} />
          <Route path="/supervisor/daily-reports" element={<FieldStaffDailyReports />} />
          <Route path="/supervisor/final-evaluation" element={<FieldStaffFinalEvaluation />} />
          
          {/* صفحات خاصة بالمشرف الأكاديمي */}
          <Route path="/supervisor/field-visits" element={<FieldVisits />} />
          <Route path="/supervisor/sections" element={<Sections />} />
          <Route path="/supervisor/submissions" element={<Submissions />} />
          
          {/* Legacy — يُحتفظ للتوافق */}
          <Route path="/supervisor/reports" element={<SupervisorReports />} />
          

          {/* ═══════════════════════════════════════════════════════
              Unified Field Staff Routes
              (المعلم المرشد، المشرف الأكاديمي، الأخصائي النفسي، مدير المدرسة)
              جميعها تستخدم نفس الصفحات مع Conditional Rendering حسب الدور
          ═══════════════════════════════════════════════════════ */}
          <Route path="/field-staff/dashboard" element={<FieldStaffDashboard />} />
          <Route path="/field-staff/students" element={<FieldStaffStudents />} />
          <Route path="/field-staff/evaluations" element={<FieldStaffEvaluations />} />
          <Route path="/field-staff/notes" element={<FieldStaffNotes />} />
          <Route path="/field-staff/daily-reports" element={<FieldStaffDailyReports />} />
          <Route path="/field-staff/guidance" element={<FieldStaffGuidance />} />
          <Route path="/field-staff/tasks" element={<FieldStaffTasks />} />
          <Route path="/field-staff/final-evaluation" element={<FieldStaffFinalEvaluation />} />

          {/* Legacy Mentor routes — redirect to unified field-staff */}
          <Route path="/mentor/dashboard" element={<FieldStaffDashboard />} />
          <Route path="/mentor/students" element={<FieldStaffStudents />} />
          <Route path="/mentor/student-profiles" element={<FieldStaffStudents />} />
          <Route path="/mentor/tasks" element={<FieldStaffTasks />} />
          <Route path="/mentor/attendance" element={<MentorAttendance />} />
          <Route path="/mentor/evaluations" element={<FieldStaffEvaluations />} />
          <Route path="/mentor/schedule" element={<MentorSchedule />} />
          <Route path="/mentor/daily-reports" element={<FieldStaffDailyReports />} />
          <Route path="/mentor/final-evaluation" element={<FieldStaffFinalEvaluation />} />
          <Route path="/mentor/notes" element={<FieldStaffNotes />} />

          {/* Legacy Psychologist routes — redirect to unified field-staff */}
          <Route path="/psychologist/dashboard" element={<FieldStaffDashboard />} />
          <Route path="/psychologist/students" element={<FieldStaffStudents />} />
          <Route path="/psychologist/guidance" element={<FieldStaffGuidance />} />
          <Route path="/psychologist/notes" element={<FieldStaffNotes />} />

          {/* Coordinator */}
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/students" element={<CoordinatorStudents />} />
          <Route path="/coordinator/distribution" element={<CoordinatorDistribution />} />
          <Route path="/coordinator/statistics" element={<CoordinatorStatistics />} />
          <Route path="/coordinator/training-requests" element={<CoordinatorTrainingRequests />} />

          {/* Principal */}
          <Route path="/principal/dashboard" element={<PrincipalDashboard siteType="school" />} />
          <Route path="/principal/profile" element={<PrincipalProfile />} />
          <Route path="/principal/mentor-assignment" element={<MentorAssignment siteType="school" />} />
          <Route path="/principal/trainee-students" element={<TraineeStudents siteType="school" />} />
          <Route path="/principal/training-requests" element={<PrincipalTrainingRequests />} />
          <Route path="/principal/official-letters" element={<PrincipalOfficialLetters />} />

          {/* Psychology Center */}
          <Route path="/psychology-center/dashboard" element={<PrincipalDashboard siteType="health_center" />} />
          <Route path="/psychology-center/profile" element={<PrincipalProfile siteType="health_center" />} />
          <Route path="/psychology-center/mentor-assignment" element={<MentorAssignment siteType="health_center" />} />
          <Route path="/psychology-center/trainee-students" element={<TraineeStudents siteType="health_center" />} />

          {/* Health */}
          <Route path="/health/dashboard" element={<HealthDirectorateDashboard />} />
          <Route path="/health/training-sites" element={<HealthTrainingSites />} />
          <Route path="/health/official-letters" element={<HealthOfficialLetters siteType="health_center" />} />

          {/* Education */}
          <Route path="/education/dashboard" element={<EducationDirectorateDashboard />} />
          <Route path="/education/training-sites" element={<TrainingSites />} />
          <Route path="/education/official-letters" element={<EducationOfficialLetters siteType="school" />} />

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