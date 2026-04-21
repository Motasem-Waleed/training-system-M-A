<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    TrainingRequestController,
    TrainingRequestBatchController,
    TrainingAssignmentController,
    EvaluationController,
    UserController,
    AttendanceController,
    TaskController,
    TrainingLogController,
    OfficialLetterController,
    ConversationController,
    AnnouncementController,
    DashboardController,
    TrainingSiteController,
    CourseController,
    SectionController,
    EnrollmentController,
    DepartmentController,
    RoleController,
    PermissionController,
    StudentPortfolioController,
    SupervisorVisitController,
    SupervisorWorkspaceController,
    FieldSupervisorController,
    BackupController,
    ActivityLogController,
    TrainingPeriodController,
    EvaluationTemplateController,
    NotificationController,
    NoteController,
    WeeklyScheduleController,
    FeatureFlagController,
    PortfolioEntryController,
    TaskSubmissionController,
    StudentAttendanceController
};

// Routes publiques
Route::post('/login', [UserController::class, 'login'])->name('login');

// Routes protégées
Route::middleware(['auth:sanctum'])->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/user', [UserController::class, 'currentUser']);

    // Utilisateurs, rôles, départements
    Route::apiResource('users', UserController::class);
    Route::patch('users/{user}/status', [UserController::class, 'changeStatus']);
    Route::post('users/bulk-add', [UserController::class, 'bulkAdd']);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permissions', PermissionController::class);
    Route::apiResource('departments', DepartmentController::class);

    // Cours, sections, inscriptions
    Route::apiResource('courses', CourseController::class);
    Route::apiResource('sections', SectionController::class);
    Route::apiResource('enrollments', EnrollmentController::class);

    // Sites et périodes de stage
    Route::apiResource('training-sites', TrainingSiteController::class);
    Route::apiResource('training-periods', TrainingPeriodController::class);
    Route::patch('training-periods/{training_period}/set-active', [TrainingPeriodController::class, 'setActive']);

    // Demandes de stage
    Route::apiResource('training-requests', TrainingRequestController::class);
    Route::post('training-requests/{training_request}/send-to-directorate', [TrainingRequestController::class, 'sendToDirectorate']);
    Route::post('training-requests/{training_request}/directorate-approve', [TrainingRequestController::class, 'directorateApprove']);
    Route::post('training-requests/{training_request}/send-to-school', [TrainingRequestController::class, 'sendToSchool']);
    Route::post('training-requests/{training_request}/school-approve', [TrainingRequestController::class, 'schoolApprove']);
    Route::post('training-requests/{training_request}/reject', [TrainingRequestController::class, 'reject']);
    Route::post('training-requests/{training_request}/coordinator-review', [TrainingRequestController::class, 'coordinatorReview']);

    // Coordinator batching
    Route::get('training-request-batches', [TrainingRequestBatchController::class, 'index']);
    Route::get('training-request-batches/{training_request_batch}', [TrainingRequestBatchController::class, 'show']);
    Route::post('training-request-batches', [TrainingRequestBatchController::class, 'store']);
    Route::post('training-request-batches/{training_request_batch}/send', [TrainingRequestBatchController::class, 'send']);

    // Affectations
    Route::apiResource('training-assignments', TrainingAssignmentController::class);

    // Présences
    Route::apiResource('attendances', AttendanceController::class);
    Route::patch('attendances/{attendance}/approve', [AttendanceController::class, 'approve']);
    Route::get('attendance-summary', [AttendanceController::class, 'summary']);

    // Journal de stage
    Route::apiResource('training-logs', TrainingLogController::class);
    Route::post('training-logs/{training_log}/submit', [TrainingLogController::class, 'submit']);
    Route::post('training-logs/{training_log}/review', [TrainingLogController::class, 'review']);

    // Tâches
    Route::apiResource('tasks', TaskController::class);
    Route::post('tasks/{task}/submit', [TaskController::class, 'submit']);
    Route::apiResource('task-submissions', TaskSubmissionController::class);
    Route::post('task-submissions/{task_submission}/grade', [TaskSubmissionController::class, 'grade']);

    // Évaluations
    Route::apiResource('evaluations', EvaluationController::class);
    Route::apiResource('evaluation-templates', EvaluationTemplateController::class);
    Route::post('evaluation-templates/{evaluation_template}/items', [EvaluationTemplateController::class, 'addItem']);
    Route::put('evaluation-items/{item}', [EvaluationTemplateController::class, 'updateItem']);
    Route::delete('evaluation-items/{item}', [EvaluationTemplateController::class, 'deleteItem']);

    // Portfolios
    Route::apiResource('student-portfolios', StudentPortfolioController::class);
    Route::post('student-portfolios/{student_portfolio}/entries', [StudentPortfolioController::class, 'addEntry']);
    Route::put('portfolio-entries/{entry}', [StudentPortfolioController::class, 'updateEntry']);
    Route::delete('portfolio-entries/{entry}', [StudentPortfolioController::class, 'deleteEntry']);

    // Visites superviseur
    Route::apiResource('supervisor-visits', SupervisorVisitController::class);
    Route::post('supervisor-visits/{supervisor_visit}/complete', [SupervisorVisitController::class, 'complete']);

    // Lettres officielles
    Route::apiResource('official-letters', OfficialLetterController::class);
    Route::post('official-letters/{official_letter}/send', [OfficialLetterController::class, 'send']);
    Route::post('official-letters/{official_letter}/receive', [OfficialLetterController::class, 'receive']);
    Route::post('official-letters/{official_letter}/approve', [OfficialLetterController::class, 'approve']);

    // Messages
    Route::apiResource('conversations', ConversationController::class);
    Route::post('conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);

    // Annonces
    Route::apiResource('announcements', AnnouncementController::class);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);

    // Notes
    Route::apiResource('notes', NoteController::class);

    // Planning hebdomadaire
    Route::apiResource('weekly-schedules', WeeklyScheduleController::class);

    // Feature flags
    Route::get('feature-flags', [FeatureFlagController::class, 'index']);
    Route::patch('feature-flags/{feature_flag}', [FeatureFlagController::class, 'update']);
    Route::get('feature-flags/check/{name}', [FeatureFlagController::class, 'check']);

    // Sauvegardes
    Route::apiResource('backups', BackupController::class);
    Route::post('backups/{backup}/restore', [BackupController::class, 'restore']);
    Route::get('backups/{id}', [BackupController::class, 'show']);
    Route::get('backups/{id}/table/{tableName}', [BackupController::class, 'getTableData']);

    // Logs d'activité
    Route::apiResource('activity-logs', ActivityLogController::class);

    // ========== ROUTES SUPERVISOR WORKSPACE ==========
    Route::prefix('supervisor')->group(function () {
        Route::get('/stats', [SupervisorWorkspaceController::class, 'stats']);
        Route::get('/students', [SupervisorWorkspaceController::class, 'students']);
        Route::get('/sections', [SupervisorWorkspaceController::class, 'sections']);
        Route::get('/students/{studentId}/overview', [SupervisorWorkspaceController::class, 'studentOverview']);
        Route::get('/students/{studentId}/attendance', [SupervisorWorkspaceController::class, 'studentAttendance']);
        Route::post('/students/{studentId}/attendance-comment', [SupervisorWorkspaceController::class, 'attendanceComment']);
        Route::post('/students/{studentId}/attendance-alert', [SupervisorWorkspaceController::class, 'attendanceAlert']);
        Route::get('/students/{studentId}/daily-logs', [SupervisorWorkspaceController::class, 'studentDailyLogs']);
        Route::get('/students/{studentId}/portfolio', [SupervisorWorkspaceController::class, 'studentPortfolio']);
        Route::get('/students/{studentId}/tasks', [SupervisorWorkspaceController::class, 'studentTasks']);
        Route::get('/students/{studentId}/task-submissions', [SupervisorWorkspaceController::class, 'studentTaskSubmissions']);
        Route::get('/students/{studentId}/field-evaluations', [SupervisorWorkspaceController::class, 'studentFieldEvaluations']);
        Route::get('/students/{studentId}/academic-evaluation', [SupervisorWorkspaceController::class, 'studentAcademicEvaluation']);
        Route::get('/students/{studentId}/messages', [SupervisorWorkspaceController::class, 'studentMessages']);
        Route::post('/students/{studentId}/messages', [SupervisorWorkspaceController::class, 'sendMessage']);
        Route::get('/students/{studentId}/timeline', [SupervisorWorkspaceController::class, 'studentTimeline']);
        Route::post('/students/{studentId}/escalate', [SupervisorWorkspaceController::class, 'escalate']);
    });

    // ========== ROUTES FIELD SUPERVISOR WORKSPACE ==========
    Route::prefix('field-supervisor')->group(function () {
        // Dashboard
        Route::get('/dashboard', [FieldSupervisorController::class, 'dashboard']);
        
        // Students
        Route::get('/students', [FieldSupervisorController::class, 'students']);
        Route::get('/students/{studentId}', [FieldSupervisorController::class, 'studentOverview']);
        
        // Attendance
        Route::get('/students/{studentId}/attendance', [FieldSupervisorController::class, 'studentAttendance']);
        Route::post('/attendance', [FieldSupervisorController::class, 'recordAttendance']);
        
        // Daily Reports
        Route::get('/report-templates', [FieldSupervisorController::class, 'getReportTemplates']);
        Route::get('/students/{studentId}/daily-reports', [FieldSupervisorController::class, 'studentDailyReports']);
        Route::get('/daily-reports/{reportId}', [FieldSupervisorController::class, 'getDailyReport']);
        Route::post('/daily-reports/{reportId}/confirm', [FieldSupervisorController::class, 'confirmDailyReport']);
        Route::post('/daily-reports/{reportId}/return', [FieldSupervisorController::class, 'returnDailyReport']);
        
        // Evaluations
        Route::get('/evaluation-templates', [FieldSupervisorController::class, 'getEvaluationTemplates']);
        Route::get('/students/{studentId}/evaluation', [FieldSupervisorController::class, 'getStudentEvaluation']);
        Route::post('/students/{studentId}/evaluation-draft', [FieldSupervisorController::class, 'saveEvaluationDraft']);
        Route::post('/students/{studentId}/evaluation-submit', [FieldSupervisorController::class, 'submitEvaluation']);
        
        // Communication
        Route::get('/students/{studentId}/messages', [FieldSupervisorController::class, 'studentMessages']);
        Route::post('/students/{studentId}/messages', [FieldSupervisorController::class, 'sendMessage']);
        Route::post('/students/{studentId}/message-academic-supervisor', [FieldSupervisorController::class, 'messageAcademicSupervisor']);
        
        // Timeline
        Route::get('/students/{studentId}/timeline', [FieldSupervisorController::class, 'studentTimeline']);
    });

    // ========== ROUTES ÉTUDIANTS ==========
    Route::prefix('student')->group(function () {
        Route::get('/training-requests', [TrainingRequestController::class, 'studentIndex']);
        Route::post('/training-requests', [TrainingRequestController::class, 'studentStore']);
        Route::put('/training-requests/{training_request}', [TrainingRequestController::class, 'studentUpdate']);
        Route::get('/schedule', [WeeklyScheduleController::class, 'studentSchedule']);
        
        // Training logs
        Route::get('/training-logs', [TrainingLogController::class, 'getTrainingLogs']);
        Route::post('/training-logs', [TrainingLogController::class, 'store']);
        Route::put('/training-logs/{training_log}', [TrainingLogController::class, 'update']);
        Route::post('/training-logs/{training_log}/submit', [TrainingLogController::class, 'submit']);
        
        // Portfolio
        Route::get('/portfolio', [StudentPortfolioController::class, 'show']);
        Route::post('/portfolio/entries', [PortfolioEntryController::class, 'store']);
        Route::put('/portfolio/entries/{entry}', [PortfolioEntryController::class, 'update']);
        Route::delete('/portfolio/entries/{entry}', [PortfolioEntryController::class, 'destroy']);
        
        // Tâches étudiant
        Route::get('/tasks', [TaskController::class, 'studentIndex']);
        Route::post('/tasks/{task}/submit', [TaskSubmissionController::class, 'store']);
        
        // Notifications étudiant
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    });

    // ========== ROUTES مدير جهة التدريب ==========
    Route::prefix('school-manager')->group(function () {
        Route::get('/mentor-requests', [TrainingRequestController::class, 'schoolManagerMentorRequests']);
        Route::get('/teachers', [TrainingRequestController::class, 'schoolManagerTeachers']);
        Route::post('/mentor-requests/{training_request}/approve', [TrainingRequestController::class, 'schoolManagerApprove']);
    });

    // ========== ROUTES سجل حضور الطالب ==========
    Route::prefix('student')->group(function () {
        Route::get('/attendance', [StudentAttendanceController::class, 'index']);
        Route::post('/attendance', [StudentAttendanceController::class, 'store']);
        Route::get('/attendance/{attendance}', [StudentAttendanceController::class, 'show']);
        Route::put('/attendance/{attendance}', [StudentAttendanceController::class, 'update']);
        Route::delete('/attendance/{attendance}', [StudentAttendanceController::class, 'destroy']);
        Route::get('/attendance/statistics/summary', [StudentAttendanceController::class, 'statistics']);
        Route::post('/attendance/{attendance}/approve', [StudentAttendanceController::class, 'approve']);
    });

    // Portfolio personnel
    Route::get('/my-portfolio', [StudentPortfolioController::class, 'getMyPortfolio']);
});