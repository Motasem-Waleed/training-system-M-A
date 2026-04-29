<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'admin';
    }

    public function rules(): array
    {
        $studentRoleId = $this->getStudentRoleId();

        return [
            'university_id' => 'required_if:role_id,' . $studentRoleId . '|nullable|string|max:255|unique:users,university_id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:8',
            'status' => 'required|in:active,inactive,suspended',
            'department_id' => 'required_if:role_id,' . $studentRoleId . '|nullable|exists:departments,id',
            'role_id' => 'required|exists:roles,id',
            'phone' => 'nullable|string|max:20',
            'major' => 'nullable|string|max:255',
            'training_site_id' => 'nullable|exists:training_sites,id',
            'directorate' => 'nullable|in:وسط,شمال,جنوب,يطا',
        ];
    }

    public function messages(): array
    {
        return [
            'university_id.required_if' => 'الرقم الجامعي مطلوب للطلاب.',
            'university_id.unique' => 'الرقم الجامعي مستخدم مسبقاً.',
            'email.unique' => 'البريد الإلكتروني مستخدم مسبقاً.',
            'department_id.required_if' => 'القسم مطلوب للطلاب.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $roleId = $this->input('role_id');
            if (! $roleId) {
                return;
            }

            $role = Role::find($roleId);
            if (! $role) {
                return;
            }

            // ===== 1) القسم (department_id) إلزامي للمشرف الأكاديمي ورئيس القسم =====
            $rolesNeedingDepartment = ['academic_supervisor', 'head_of_department'];
            if (in_array($role->name, $rolesNeedingDepartment, true) && ! $this->filled('department_id')) {
                $label = $role->name === 'head_of_department' ? 'رئيس القسم' : 'المشرف الأكاديمي';
                $validator->errors()->add('department_id', "القسم مطلوب لـ{$label}.");
            }

            // ===== 2) موقع التدريب إلزامي للمعلم/الأخصائي ومدير المدرسة/المركز =====
            $rolesNeedingSite = ['teacher', 'psychologist', 'school_manager', 'psychology_center_manager'];
            if (in_array($role->name, $rolesNeedingSite, true) && ! $this->filled('training_site_id')) {
                $labels = [
                    'teacher' => 'المعلم المرشد',
                    'psychologist' => 'الأخصائي النفسي',
                    'school_manager' => 'مدير المدرسة',
                    'psychology_center_manager' => 'مدير المركز النفسي',
                ];
                $validator->errors()->add(
                    'training_site_id',
                    "موقع التدريب مطلوب لـ{$labels[$role->name]}."
                );
            }

            // ===== 3) مدير واحد فقط لكل موقع تدريب =====
            $singleManagerRoles = ['school_manager', 'psychology_center_manager'];
            $trainingSiteId = $this->input('training_site_id');
            if (in_array($role->name, $singleManagerRoles, true) && $trainingSiteId) {
                $exists = User::where('role_id', $roleId)
                    ->where('training_site_id', $trainingSiteId)
                    ->exists();

                if ($exists) {
                    $label = $role->name === 'psychology_center_manager'
                        ? 'مدير للمركز النفسي'
                        : 'مدير للمدرسة';
                    $validator->errors()->add(
                        'training_site_id',
                        "يوجد بالفعل {$label} مُعيَّن لهذا الموقع. لا يمكن تعيين أكثر من مدير واحد."
                    );
                }
            }
        });
    }

    private function getStudentRoleId(): ?string
    {
        return (string) Role::where('name', 'student')->value('id');
    }
}