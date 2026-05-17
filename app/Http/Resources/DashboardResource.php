<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'total_pendapatan'  => (float) $this['total_pendapatan'],
            'jumlah_pesanan'    => (int)   $this['jumlah_pesanan'],
            'pesanan_hari_ini'  => (int)   $this['pesanan_hari_ini'],
            'pendapatan_bulan'  => (float) $this['pendapatan_bulan'],
        ];
    }
}