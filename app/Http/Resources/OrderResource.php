<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'user'              => new UserResource($this->whenLoaded('user')),
            'tanggal_pesan'     => $this->tanggal_pesan?->toISOString(),
            'total_harga'       => (float) $this->total_harga,
            'status_pesanan'    => $this->status_pesanan,
            'tipe_pesanan'      => $this->tipe_pesanan ?? 'dine_in',
            'waktu_pengambilan' => $this->waktu_pengambilan,
            // Bug E-1: hitung mundur ditampilkan berdasarkan keberadaan waktu_pengambilan,
            // bukan tipe_pesanan === 'online' (nilai 'online' tak pernah dipakai), selaras DashboardController.
            'sisa_menit'        => $this->waktu_pengambilan ? (int) round(now()->diffInMinutes(Carbon::parse($this->waktu_pengambilan), false)) : null,
            'durasi_menit'      => $this->tipe_pesanan !== 'online' ? (int) abs(now()->diffInMinutes(Carbon::parse($this->created_at))) : null,
            'jumlah_orang'      => $this->jumlah_orang,
            'status_pembayaran' => $this->payment?->status_pembayaran,
            'metode_pembayaran' => $this->payment?->metode_pembayaran,
            'payment'           => $this->whenLoaded('payment'),
            'order_items'       => $this->whenLoaded('orderItems'),
        ];
    }
}