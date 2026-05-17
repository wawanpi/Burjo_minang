<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'user'           => new UserResource($this->whenLoaded('user')),
            'menu'           => [
                'id'        => $this->menu?->id,
                'nama_menu' => $this->menu?->nama_menu,
            ],
            'rating'         => $this->rating,
            'komentar'       => $this->komentar,
            'tanggal_ulasan' => $this->tanggal_ulasan?->toISOString(),
        ];
    }
}