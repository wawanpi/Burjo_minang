import{c as e,d as t,n,t as r}from"./app-cmzFoquQ.js";var i=t(e(),1),a=r(),o=e=>new Intl.NumberFormat(`id-ID`,{minimumFractionDigits:0}).format(e),s=e=>{if(!e)return`—`;let t=new Date(e);return`${(e=>String(e).padStart(2,`0`))(t.getDate())} ${[`Jan`,`Feb`,`Mar`,`Apr`,`Mei`,`Jun`,`Jul`,`Ags`,`Sep`,`Okt`,`Nov`,`Des`][t.getMonth()]} ${t.getFullYear()}`},c=e=>{let t=new Date(e),n=[`Jan`,`Feb`,`Mar`,`Apr`,`Mei`,`Jun`,`Jul`,`Ags`,`Sep`,`Okt`,`Nov`,`Des`],r=e=>String(e).padStart(2,`0`);return`${r(t.getDate())} ${n[t.getMonth()]} ${t.getFullYear()}, ${r(t.getHours())}:${r(t.getMinutes())} WIB`};function l({orders:e,totalPendapatan:t,tipeLabel:r,dari:l,sampai:u}){(0,i.useEffect)(()=>{let e=setTimeout(()=>{window.print()},500);return()=>clearTimeout(e)},[]);let d=()=>l&&u?`${s(l)} — ${s(u)}`:l?`Dari ${s(l)}`:u?`Sampai ${s(u)}`:`Seluruh Periode`,f=e=>{let t=e||`dine_in`;return t===`dine_in`?{label:`🍽️ Dine In`,bg:`#dbeafe`,color:`#1e40af`}:t===`take_away`?{label:`🛍️ Take Away`,bg:`#fef3c7`,color:`#92400e`}:t===`online`?{label:`🌐 Online`,bg:`#d1fae5`,color:`#065f46`}:{label:t,bg:`#f3f4f6`,color:`#374151`}};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n,{title:`Cetak Laporan Keuangan — Burjo Minang RM`}),(0,a.jsx)(`style`,{children:`
                /* ── Reset & Base ── */
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 12px;
                    color: #1a1a1a;
                    background: #fff;
                    padding: 24px;
                    line-height: 1.5;
                }

                /* ── Header ── */
                .print-header {
                    text-align: center;
                    border-bottom: 2px solid #d97706;
                    padding-bottom: 16px;
                    margin-bottom: 20px;
                }
                .print-header h1 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #92400e;
                    margin-bottom: 4px;
                }
                .print-header p {
                    font-size: 12px;
                    color: #6b7280;
                }

                /* ── Info Box ── */
                .info-box {
                    display: flex;
                    justify-content: space-between;
                    background: #fffbeb;
                    border: 1px solid #fbbf24;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 20px;
                    font-size: 12px;
                }
                .info-box .label { color: #92400e; font-weight: 600; }
                .info-box .value { font-weight: 700; color: #78350f; font-size: 14px; }

                /* ── Table ── */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                thead th {
                    background: #f9fafb;
                    border-bottom: 2px solid #e5e7eb;
                    padding: 8px 10px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                tbody td {
                    padding: 8px 10px;
                    border-bottom: 1px solid #f3f4f6;
                    font-size: 12px;
                    color: #374151;
                }
                tbody tr:hover { background: #f9fafb; }

                /* Tipe Pesanan Badges */
                .badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                }

                /* ── Total Row ── */
                .total-row td {
                    font-weight: 700;
                    font-size: 13px;
                    border-top: 2px solid #e5e7eb;
                    border-bottom: none;
                    padding-top: 10px;
                }

                /* ── Footer ── */
                .print-footer {
                    text-align: center;
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 24px;
                    padding-top: 12px;
                    border-top: 1px solid #e5e7eb;
                }

                /* ── Print Styles ── */
                @media print {
                    body { padding: 0; }
                    @page { margin: 15mm; }
                    .no-print { display: none !important; }
                }
            `}),(0,a.jsxs)(`div`,{children:[(0,a.jsxs)(`div`,{className:`print-header`,children:[(0,a.jsx)(`h1`,{children:`📊 Laporan Keuangan — Burjo Minang RM`}),(0,a.jsxs)(`p`,{children:[`Periode: `,d(),` \xA0·\xA0 Tipe: `,(0,a.jsx)(`strong`,{children:r}),` \xA0·\xA0 Semua transaksi `,(0,a.jsx)(`strong`,{children:`Lunas`})]}),(0,a.jsxs)(`p`,{style:{marginTop:`4px`,fontSize:`11px`},children:[`Dicetak: `,c(new Date)]})]}),(0,a.jsxs)(`div`,{className:`info-box`,children:[(0,a.jsx)(`div`,{children:(0,a.jsx)(`span`,{className:`label`,children:`Total Pendapatan`})}),(0,a.jsx)(`div`,{children:(0,a.jsxs)(`span`,{className:`value`,children:[`Rp `,o(t)]})})]}),(0,a.jsxs)(`table`,{children:[(0,a.jsx)(`thead`,{children:(0,a.jsxs)(`tr`,{children:[(0,a.jsx)(`th`,{style:{width:`40px`},children:`#`}),(0,a.jsx)(`th`,{children:`Pelanggan`}),(0,a.jsx)(`th`,{children:`Tanggal`}),(0,a.jsx)(`th`,{style:{textAlign:`right`},children:`Total`}),(0,a.jsx)(`th`,{children:`Metode`}),(0,a.jsx)(`th`,{style:{textAlign:`center`},children:`Tipe Pesanan`})]})}),(0,a.jsxs)(`tbody`,{children:[e.length===0?(0,a.jsx)(`tr`,{children:(0,a.jsx)(`td`,{colSpan:6,style:{textAlign:`center`,padding:`32px`,color:`#9ca3af`},children:`Tidak ada data transaksi.`})}):e.map((e,t)=>{let n=f(e.tipe_pesanan);return(0,a.jsxs)(`tr`,{children:[(0,a.jsx)(`td`,{style:{color:`#9ca3af`},children:t+1}),(0,a.jsx)(`td`,{style:{fontWeight:500},children:e.user?.name||`—`}),(0,a.jsx)(`td`,{children:s(e.tanggal_pesan)}),(0,a.jsxs)(`td`,{style:{textAlign:`right`,fontWeight:600},children:[`Rp `,o(e.total_harga)]}),(0,a.jsx)(`td`,{children:e.payment?.metode_pembayaran||`-`}),(0,a.jsx)(`td`,{style:{textAlign:`center`},children:(0,a.jsx)(`span`,{className:`badge`,style:{background:n.bg,color:n.color},children:n.label})})]},e.id)}),e.length>0&&(0,a.jsxs)(`tr`,{className:`total-row`,children:[(0,a.jsxs)(`td`,{colSpan:3,style:{textAlign:`right`},children:[`Total (`,e.length,` transaksi)`]}),(0,a.jsxs)(`td`,{style:{textAlign:`right`},children:[`Rp `,o(t)]}),(0,a.jsx)(`td`,{colSpan:2})]})]})]}),(0,a.jsx)(`div`,{className:`print-footer`,children:(0,a.jsx)(`p`,{children:`Dokumen ini digenerate otomatis oleh sistem Burjo Minang RM.`})}),(0,a.jsxs)(`div`,{className:`no-print`,style:{textAlign:`center`,marginTop:`20px`},children:[(0,a.jsx)(`button`,{onClick:()=>window.print(),style:{padding:`8px 16px`,background:`#d97706`,color:`white`,border:`none`,borderRadius:`4px`,cursor:`pointer`,fontWeight:`bold`},children:`🖨️ Cetak Ulang`}),(0,a.jsx)(`button`,{onClick:()=>window.close(),style:{padding:`8px 16px`,background:`#e5e7eb`,color:`#374151`,border:`none`,borderRadius:`4px`,cursor:`pointer`,fontWeight:`bold`,marginLeft:`8px`},children:`Tutup`})]})]})]})}export{l as default};