<?php

namespace App\Providers;

use App\Helpers\ActivityLogger;
use App\Models\ActivityLog;
use App\Models\ActivityLogDetail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\PersonalAccessToken;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->ensureSqliteDatabaseFileExists();
        $this->registerModelActivityListeners();
    }

    /**
     * SQLite لا يُنشئ الملف تلقائياً؛ عند استنساخ المشروع يكون database.sqlite مفقوداً فيُسبب 500.
     */
    private function ensureSqliteDatabaseFileExists(): void
    {
        if (config('database.default') !== 'sqlite') {
            return;
        }

        $path = config('database.connections.sqlite.database');
        if (! is_string($path) || $path === '' || $path === ':memory:') {
            return;
        }

        if (file_exists($path)) {
            return;
        }

        File::ensureDirectoryExists(dirname($path));
        touch($path);
    }

    private function registerModelActivityListeners(): void
    {
        Event::listen('eloquent.created: *', function (string $eventName, array $data): void {
            $model = $data[0] ?? null;
            if (! $model instanceof Model || $this->shouldSkipModelLogging($model)) {
                return;
            }

            ActivityLogger::logModelChange('created', $model, null, $model->getAttributes());
        });

        Event::listen('eloquent.updated: *', function (string $eventName, array $data): void {
            $model = $data[0] ?? null;
            if (! $model instanceof Model || $this->shouldSkipModelLogging($model)) {
                return;
            }

            $changes = $model->getChanges();
            unset($changes['updated_at']);
            if ($changes === []) {
                return;
            }

            $old = [];
            foreach (array_keys($changes) as $field) {
                $old[$field] = $model->getOriginal($field);
            }

            ActivityLogger::logModelChange('updated', $model, $old, $changes);
        });

        Event::listen('eloquent.deleted: *', function (string $eventName, array $data): void {
            $model = $data[0] ?? null;
            if (! $model instanceof Model || $this->shouldSkipModelLogging($model)) {
                return;
            }

            ActivityLogger::logModelChange('deleted', $model, $model->getOriginal(), null);
        });
    }

    private function shouldSkipModelLogging(Model $model): bool
    {
        return $model instanceof ActivityLog
            || $model instanceof ActivityLogDetail
            || $model instanceof PersonalAccessToken;
    }
}
