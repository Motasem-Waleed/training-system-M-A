<?php

namespace App\Models\Concerns;

use App\Models\Scopes\NotArchivedScope;

trait HidesArchived
{
    public static function bootHidesArchived(): void
    {
        static::addGlobalScope(new NotArchivedScope);
    }
}
