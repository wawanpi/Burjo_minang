<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'no_hp' => [
                'required',
                'string',
                'max:15',
                Rule::unique(User::class)->ignore($this->user()->id),
                'regex:/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/',
            ],
            'foto_profil' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:7168', // 7MB
            ],
        ];

        // Validasi Kondisional: Jika user mengisi salah satu kolom password
        if ($this->filled('password')) {
            $rules['current_password'] = ['required', 'current_password'];
            $rules['password'] = [
                'required',
                'confirmed',
                function ($attribute, $value, $fail) {
                    $passed = 0;
                    if (strlen($value) >= 8) $passed++;
                    if (preg_match('/[A-Z]/', $value)) $passed++;
                    if (preg_match('/[a-z]/', $value)) $passed++;
                    if (preg_match('/[0-9]/', $value)) $passed++;
                    if (preg_match('/[^A-Za-z0-9]/', $value)) $passed++;

                    if ($passed < 2) {
                        $fail('Password harus memenuhi minimal 2 kriteria keamanan.');
                    }
                },
            ];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'foto_profil.max' => 'Ukuran foto maksimal adalah 7MB.',
            'foto_profil.image' => 'File harus berupa gambar.',
            'foto_profil.mimes' => 'Format foto harus berupa JPG, JPEG, PNG, atau WEBP.',
        ];
    }
}
