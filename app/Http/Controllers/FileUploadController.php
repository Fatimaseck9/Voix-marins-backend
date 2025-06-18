<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FileUploadController extends Controller
{
    public function uploadAudio(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimetypes:audio/webm,audio/mpeg,audio/wav|max:10240'
        ]);
        $path = $request->file('audio')->store('uploads/audio', 'public');
        return response()->json(['url' => asset('storage/' . $path)]);
    }

    public function uploadPV(Request $request)
    {
        $request->validate([
            'audio' => 'required|file|mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document|max:5120'
        ]);
        $path = $request->file('audio')->store('uploads/pv', 'public');
        return response()->json(['url' => asset('storage/' . $path)]);
    }
} 