<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeatureFlag;
use Illuminate\Http\Request;

class FeatureFlagController extends Controller
{
    public function index(Request $request)
    {
        $flags = FeatureFlag::all();
        return response()->json($flags);
    }

    public function update(Request $request, FeatureFlag $featureFlag)
    {
        $request->validate(['is_open' => 'required|boolean']);
        $featureFlag->update(['is_open' => $request->is_open]);
        return response()->json($featureFlag);
    }

    public function check($name)
    {
        $flag = FeatureFlag::where('name', $name)->first();
        return response()->json(['name' => $name, 'is_open' => $flag?->is_open ?? false]);
    }
}