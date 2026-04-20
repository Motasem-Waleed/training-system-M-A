<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;

class LogActivityMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // سجّل فقط الطلبات الناجحة POST/PUT/DELETE
        if (in_array($request->method(), ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            $user = auth('sanctum')->user();
            if ($user) {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => $request->method(),
                    'description' => "{$request->method()} {$request->path()}",
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }
        }

        return $response;
    }
}
