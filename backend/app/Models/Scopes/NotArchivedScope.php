<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class NotArchivedScope implements Scope
{
    /**
     * Apply the scope: by default, exclude archived records.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->whereNull($model->getTable() . '.archived_at');
    }

    public function extend(Builder $builder): void
    {
        // ->withArchived() : include archived rows
        $builder->macro('withArchived', function (Builder $builder) {
            return $builder->withoutGlobalScope($this);
        });

        // ->onlyArchived() : show only archived rows
        $builder->macro('onlyArchived', function (Builder $builder) {
            $model = $builder->getModel();
            return $builder->withoutGlobalScope($this)
                ->whereNotNull($model->getTable() . '.archived_at');
        });
    }
}
