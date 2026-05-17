<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'user'                => new UserResource($this->whenLoaded('user')),
            'tanggal_pesan'       => $this->tanggal_pesan?->toISOString(),
            'total_harga'         => (float) $this->total_harga,
            'status_pembayaran'   => $this->status_pembayaran,
            'metode_pembayaran'   => $this->metode_pembayaran,
        ];
    }
}