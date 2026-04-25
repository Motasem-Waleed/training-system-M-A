<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('sections', 'capacity')) {
                $table->integer('capacity')->default(30)->after('name');
            }
            if (!Schema::hasColumn('sections', 'supervisor_id')) {
                $table->foreignId('supervisor_id')->nullable()->constrained('users')->onDelete('set null')->after('capacity');
            }
            if (!Schema::hasColumn('sections', 'created_by')) {
                $table->foreignId('created_by')->constrained('users')->onDelete('cascade')->after('supervisor_id');
            }
            
            // Add indexes
            $table->index(['course_id', 'name']);
            $table->unique(['course_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['capacity', 'supervisor_id', 'created_by']);
            $table->dropUnique(['course_id', 'name']);
        });
    }
};
