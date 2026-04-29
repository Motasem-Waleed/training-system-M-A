<?php

namespace App\Http\Middleware;

use App\Helpers\ActivityLogger;
use Closure;
use Illuminate\Http\Request;
use Throwable;
use Symfony\Component\HttpFoundation\Response;

class LogActivityMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);
        try {
            $response = $next($request);
        } catch (Throwable $exception) {
            if (! $request->is('up') && ! $request->is('api/activity-logs*')) {
                $durationMs = (microtime(true) - $start) * 1000;
                ActivityLogger::log(
                    'http',
                    'exception',
                    sprintf('%s %s failed with exception', $request->method(), $request->path()),
                    null,
                    [
                        'new' => [
                            'query' => $request->query(),
                            'body' => $request->all(),
                            'duration_ms' => round($durationMs, 2),
                            'exception_class' => $exception::class,
                            'exception_message' => $exception->getMessage(),
                        ],
                    ],
                    $request->user()
                );
            }

            throw $exception;
        }

        if ($this->shouldSkip($request, $response)) {
            return $response;
        }

        $durationMs = (microtime(true) - $start) * 1000;
        if ($this->shouldLogSuccessfulRequest($request, $response, $durationMs)) {
            ActivityLogger::logHttpRequest($request, $response, $durationMs);
        }

        return $response;
    }

    private function shouldSkip(Request $request, mixed $response): bool
    {
        if (! $response instanceof Response) {
            return true;
        }

        if ($request->is('up') || $request->is('api/activity-logs*')) {
            return true;
        }

        return false;
    }

    private function shouldLogSuccessfulRequest(Request $request, Response $response, float $durationMs): bool
    {
        $status = $response->getStatusCode();

        if ($status >= 400) {
            return true;
        }

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return true;
        }

        // Dashboard and polling reads are very frequent; logging each one adds DB writes and SQLite locks.
        return $durationMs >= 2000;
    }
}
