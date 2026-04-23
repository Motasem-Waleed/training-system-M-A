<?php

namespace App\Support;

trait ApiResponse
{
    protected function successResponse(
        mixed $data = null,
        string $message = 'Operation completed successfully.',
        int $status = 200,
        array $extra = []
    ) {
        return response()->json(array_merge([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $extra), $status);
    }

    protected function errorResponse(
        string $message = 'Operation failed.',
        mixed $errors = null,
        int $status = 422
    ) {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
