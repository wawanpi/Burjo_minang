<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // GET /api/owner/users
    public function index(): JsonResponse
    {
        $users = User::whereIn('role', ['admin', 'pelanggan'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'total'        => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    // POST /api/owner/users
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        return response()->json(new UserResource($user), 201);
    }

    // GET /api/owner/users/{user}
    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user));
    }

    // PUT /api/owner/users/{user}
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->only(['name', 'email', 'role']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json(new UserResource($user));
    }

    // DELETE /api/owner/users/{user}
    public function destroy(User $user): JsonResponse
    {
        // Proteksi: owner tidak bisa menghapus dirinya sendiri
        if ($user->role === 'owner') {
            return response()->json(['message' => 'Tidak dapat menghapus akun owner.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus.'], 200);
    }
}