<?php

namespace App\Providers;

use Illuminate\Support\Facades\File;
use Illuminate\Support\ServiceProvider;

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
}
