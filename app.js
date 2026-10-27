
"use strict";
/* =========================================================
   UTILIDADES
   ========================================================= */
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sept","oct","nov","dic"];
const MESES_L = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
function miles(entero){ return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function eur(n, signo){
  if (n == null) return "sin importe";
  const s = Math.abs(n).toFixed(2).split(".");
  return (n < 0 ? "−" : (signo && n > 0 ? "+" : "")) + miles(s[0]) + "," + s[1] + " €";
}
const eur0 = n => (Math.round(n) < 0 ? "−" : "") + miles(Math.round(Math.abs(n))) + " €";
const pct = v => v == null || !isFinite(v) ? "—" : (v < 0 ? "−" : "") + Math.abs(v).toFixed(1).replace(".", ",") + " %";
const tasa = m => !m.completo ? "mes sin cerrar" : m.ingresos ? pct(m.ahorro / m.ingresos * 100) : "—";
const r2 = n => Math.round(n * 100) / 100;
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const plural = (n, uno, varios) => n + " " + (n === 1 ? uno : varios);
const leer = t => { const [y,m,d] = t.split("-").map(Number); return new Date(y, m - 1, d || 1); };
const iso = d => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
const ym = d => iso(d).slice(0, 7);
const sumar = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const corta = d => String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0");
const larga = d => DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES_L[d.getMonth()];
const nombreMes = k => { const [y, m] = k.split("-").map(Number); return MESES_L[m-1] + " " + y; };
const entre = (a, b) => Math.round((b - a) / 86400000);
const laborable = d => { const r = new Date(d); while (r.getDay() === 0 || r.getDay() === 6) r.setDate(r.getDate() + 1); return r; };
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $ = id => document.getElementById(id);
const ETQ = {exacto: "Exacto", ultimo_real: "Último real", por_confirmar: "Por confirmar", sin_importe: "Sin importe", aviso: "Aviso", hipotesis: "Hipótesis"};
// Iconos de trazo (24×24) para pestañas y tarjetas
const ICO = {
  inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  prevision: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  movimientos: '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
  gastos: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/>',
  recurrentes: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M20 4v5h-5M4 20v-5h5"/>',
  comprar: '<path d="M5 7h14l-1.5 11a2 2 0 0 1-2 1.7h-7A2 2 0 0 1 6.5 18z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
  global: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  faltan: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
  cuenta: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
  bajada: '<path d="M12 4v14M6 12l6 6 6-6"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
  tarjeta: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M15 15h3"/>',
};
const icono = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k] || ""}</svg>`;
const cert = c => `<span class="cert ${c}">${ETQ[c] || c}</span>`;

/* =========================================================
   MODELO
   ========================================================= */
const D = window.DATOS;
const C = D ? D.config : null;
const MOVS = D ? D.movimientos.map(m => ({...m, f: leer(m.fecha)})) : [];
const ULT = MOVS[MOVS.length - 1];
const BASE = ULT ? ULT.f : new Date();
const HOY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

// --- Categorías: primero la que fija el CSV; si no, la primera cuyo patrón encaja
const CATS = C ? C.categorias.map(c => ({...c, re: c.patron ? new RegExp(c.patron, "i") : null})) : [];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
CAT.sin_categoria = {id: "sin_categoria", nombre: "Sin categoría", tipo: "gasto"};
function categorizar(m){
  let pat = null;
  for (const c of CATS) if (c.re && c.re.test(m.concepto)){ pat = c.id; break; }
  if (m.categoria === "neutro") return (pat && ["interno","compra_piso"].includes(CAT[pat].tipo)) ? pat : "interno";
  if (m.categoria && CAT[m.categoria]) return m.categoria;
  return pat || "sin_categoria";
}
for (const m of MOVS){
  m.cat = categorizar(m);
  m.tipo = m.cat === "sin_categoria" ? (m.importe > 0 ? "ingreso" : "gasto") : CAT[m.cat].tipo;
}

// --- Resumen por mes: ingresos y gastos corrientes (sin movimientos entre cuentas ni la compra del piso)
function resumenMeses(){
  const r = {};
  for (const m of MOVS){
    const k = m.fecha.slice(0, 7);
    const x = r[k] || (r[k] = {k, ingresos: 0, gastos: 0, porCat: {}, porIng: {}, interno: 0, compra: 0, hasta: m.f, n: 0});
    x.n++; if (m.f > x.hasta) x.hasta = m.f;
    if (m.tipo === "ingreso"){ x.ingresos += m.importe; x.porIng[m.cat] = (x.porIng[m.cat] || 0) + m.importe; }
    else if (m.tipo === "gasto"){ x.gastos -= m.importe; x.porCat[m.cat] = (x.porCat[m.cat] || 0) - m.importe; }
    else if (m.tipo === "interno") x.interno += m.importe;
    else x.compra += m.importe;
  }
  return Object.values(r).sort((a, b) => a.k < b.k ? -1 : 1).map(x => {
    const finMes = new Date(+x.k.slice(0,4), +x.k.slice(5,7), 0);
    for (const c in x.porCat) x.porCat[c] = r2(x.porCat[c]);
    for (const c in x.porIng) x.porIng[c] = r2(x.porIng[c]);
    return {...x, ingresos: r2(x.ingresos), gastos: r2(x.gastos), ahorro: r2(x.ingresos - x.gastos), interno: r2(x.interno), compra: r2(x.compra), completo: BASE >= finMes, finMes};
  });
}

// --- Ocurrencias de un cargo mensual (día fijo; sábado y domingo pasan al lunes)
function ocurrencias(dia, meses, desde, hasta){
  const r = []; let y = desde.getFullYear(), m = desde.getMonth() - 1;
  if (m < 0){ m = 11; y--; }
  while (new Date(y, m, 1) <= hasta){
    if (!meses || meses.includes(m + 1)){
      const d = laborable(new Date(y, m, Math.min(dia, new Date(y, m + 1, 0).getDate())));
      if (d > desde && d <= hasta) r.push(d);
    }
    m++; if (m > 11){ m = 0; y++; }
  }
  return r;
}

// --- La previsión: solo resta lo que tiene importe real; lo demás se cuenta como «sin importe»
// extra: movimientos hipotéticos (validador de compras). Nunca vienen de datos/.
function prevision(dias, extra){
  const fin = sumar(BASE, dias), ev = [];
  for (const x of extra || []) if (x.fecha > BASE && x.fecha <= fin) ev.push({...x, certeza: "hipotesis", origen: "hipotesis"});
  for (const f of C.fijos){
    if (f.activo === false) continue;
    for (const d of ocurrencias(f.dia, f.meses, BASE, fin)){
      let certeza = f.certeza, nota = f.nota || "";
      if (f.revision && d >= leer(f.revision.desde)){ certeza = "por_confirmar"; nota = f.revision.nota; }
      if (f.importe == null) ev.push({fecha: d, concepto: f.nombre, importe: null, certeza: "sin_importe", clase: f.tipo, nota, origen: "fijo"});
      else ev.push({fecha: d, concepto: f.nombre, importe: f.tipo === "ingreso" ? f.importe : -f.importe, certeza, clase: f.tipo, nota, origen: "fijo"});
    }
  }
  const T = C.tarjetas;
  for (const d of ocurrencias(T.dia_cargo, null, BASE, fin)){
    const liq = (T.liquidaciones || []).find(l => l.cargo && ym(leer(l.cargo)) === ym(d));
    if (liq && liq.importe != null) ev.push({fecha: d, concepto: T.nombre, importe: -liq.importe, certeza: "exacto", clase: "gasto", nota: "Liquidación: " + (liq.fuente || ""), origen: "tarjeta"});
    else ev.push({fecha: d, concepto: T.nombre, importe: null, certeza: "sin_importe", clase: "gasto", nota: T.nota, origen: "tarjeta"});
  }
  for (const p of C.pendientes){
    if (!p.fecha) continue;
    let d = laborable(leer(p.fecha)), nota = p.nota || "";
    if (d <= BASE){ d = sumar(BASE, 1); nota = nota || "Vencido y sin cargar: se reserva desde el primer día"; }
    if (d > fin) continue;
    const imp = p.importe == null ? null : (p.clase === "cobro" ? p.importe : -p.importe);
    ev.push({fecha: d, concepto: p.nombre, importe: imp, certeza: imp == null ? "sin_importe" : (p.certeza || "exacto"), clase: p.clase === "cobro" ? "ingreso" : "gasto", nota, origen: "pendiente"});
  }
  for (const v of C.vencimientos){
    if (!v.fecha) continue;
    const d = leer(v.fecha);
    // Recordatorio para revisarlo antes del vencimiento (aviso_dias)
    if (v.aviso_dias){ const r = laborable(sumar(d, -v.aviso_dias)); if (r > BASE && r <= fin) ev.push({fecha: r, concepto: "Revisar: " + v.nombre.replace(/^Renovación del /, "").replace(/^seguro/, "Seguro"), importe: null, certeza: "aviso", clase: "aviso", nota: `Vence el ${corta(d)}${v.entidad ? " · " + v.entidad : ""}. Compara precios antes de que renueve solo`, origen: "revision"}); }
    if (d <= BASE || d > fin) continue;
    if (v.es_cargo) ev.push({fecha: d, concepto: v.nombre, importe: v.importe == null ? null : -v.importe, certeza: v.importe == null ? "sin_importe" : "exacto", clase: "gasto", nota: v.nota, origen: "vencimiento"});
    else ev.push({fecha: d, concepto: v.nombre, importe: null, certeza: "aviso", clase: "aviso", nota: v.nota, origen: "vencimiento"});
  }
  // Orden prudente dentro del día: gastos conocidos, sin importe, avisos y, al final, ingresos
  const orden = e => e.clase === "ingreso" ? 3 : e.certeza === "aviso" ? 2 : e.importe == null ? 1 : 0;
  ev.sort((a, b) => a.fecha - b.fecha || orden(a) - orden(b) || (a.importe || 0) - (b.importe || 0));
  let s = ULT.saldo, min = {saldo: s, fecha: BASE, previos: 0}, sinAntes = 0;
  for (const e of ev){
    if (e.importe != null) s = r2(s + e.importe);
    else if (e.certeza === "sin_importe") sinAntes++;
    e.saldo = s;
    if (e.importe != null && s < min.saldo) min = {saldo: s, fecha: e.fecha, previos: sinAntes};
  }
  // Tope de cada cargo sin importe: lo máximo que puede ser sin que la cuenta baje de 0 dentro del horizonte
  for (let k = 0; k < ev.length; k++){
    const e = ev[k]; if (e.certeza !== "sin_importe") continue;
    let t = e.saldo, tf = e.fecha;
    for (let j = k + 1; j < ev.length; j++) if (ev[j].importe != null && ev[j].saldo < t){ t = ev[j].saldo; tf = ev[j].fecha; }
    e.tope = t; e.topeFecha = tf;
  }
  const porDia = []; let i = 0, sd = ULT.saldo;
  for (let d = new Date(BASE); d <= fin; d = sumar(d, 1)){
    const del = [];
    while (i < ev.length && iso(ev[i].fecha) === iso(d)){ del.push(ev[i]); sd = ev[i].saldo; i++; }
    porDia.push({fecha: new Date(d), saldo: sd, ev: del});
  }
  const con = ev.filter(e => e.importe != null);
  return {
    dias, fin, ev, porDia, min, final: s,
    sin: ev.filter(e => e.certeza === "sin_importe"),
    porConfirmar: ev.filter(e => e.certeza === "por_confirmar"),
    ingresos: r2(con.filter(e => e.importe > 0).reduce((a, e) => a + e.importe, 0)),
    gastos: r2(-con.filter(e => e.importe < 0).reduce((a, e) => a + e.importe, 0)),
  };
}

// --- Saldo real al cerrar cada día (del extracto), los últimos «dias» hasta el día anterior a BASE
function historiaSaldo(dias){
  const r = [], desde = sumar(BASE, -dias);
  let j = 0, s = null;
  for (let d = new Date(desde); d < BASE; d = sumar(d, 1)){
    const k = iso(d), mov = [];
    while (j < MOVS.length && MOVS[j].fecha <= k){ if (MOVS[j].fecha === k) mov.push(MOVS[j]); s = MOVS[j].saldo; j++; }
    if (s != null) r.push({fecha: new Date(d), saldo: s, real: true, mov});
  }
  return r;
}

// --- Indicadores
function fijosMensuales(){
  let ing = 0, gas = 0, deuda = 0;
  for (const f of C.fijos){
    if (f.activo === false || f.importe == null || f.meses) continue;
    if (f.tipo === "ingreso") ing += f.importe; else gas += f.importe;
    if (f.deuda) deuda += f.importe;
  }
  return {ing: r2(ing), gas: r2(gas), deuda: r2(deuda)};
}
const COLCHON_BASE = () => r2(C.reglas.gastos_fijos_mensuales_colchon * (C.reglas.colchon_meses_estable || 3));
const textoTope = e => e.tope < 0
  ? `Antes de este cargo ya vas a quedar en negativo (${eur(e.tope)} el ${corta(e.topeFecha)}).`
  : `Tope: ${eur(e.tope)}. Si pasa de ahí, el ${corta(e.topeFecha)} te quedas en negativo.`;

// --- Lo que falta para que todo sea exacto
function datosQueFaltan(){
  const p = prevision(120), items = [];
  const tj = p.sin.find(e => e.origen === "tarjeta");
  if (tj) items.push({grupo: "Para la previsión", t: `Liquidación de las tarjetas del ${corta(tj.fecha)}`, q: "Importe exacto de la liquidación (en Ruralvía, en el detalle de cada tarjeta). Pásaselo al agente diciendo de dónde sale.", i: "Hasta entonces no se resta y el saldo previsto sale más alto de lo que será. Lo mismo cada mes."});
  for (const x of C.pendientes.filter(x => x.importe == null))
    items.push({grupo: "Para la previsión", t: x.nombre, q: "Falta: importe" + (x.fecha ? "" : " y fecha") + ".", i: (x.nota ? x.nota + ". " : "") + "Sin cifra no se puede reservar."});
  for (const f of C.fijos.filter(f => f.revision))
    if (p.porConfirmar.some(e => e.concepto === f.nombre))
      items.push({grupo: "Para la previsión", t: `Cuota nueva: ${f.nombre}`, q: "La comunicación de CRA con el tipo y la cuota desde el " + corta(leer(f.revision.desde)) + ".", i: "Mientras tanto se resta la última real."});
  for (const v of C.vencimientos){
    const falta = [];
    if (!v.fecha) falta.push(v.mes ? "día exacto" : "fecha");
    if (v.es_cargo && v.importe == null) falta.push("importe");
    if (falta.length) items.push({grupo: "Vencimientos y renovaciones", t: v.nombre, q: "Falta: " + falta.join(" e ") + ".", i: v.nota || ""});
  }
  for (const b of C.bienes.filter(b => b.valor == null))
    items.push({grupo: "Patrimonio", t: b.nombre, q: "Falta: saldo o valor actual.", i: b.nota || ""});
  for (const q of C.preguntas || [])
    items.push({grupo: "Preguntas abiertas", t: q.texto, q: "", i: q.por_que || ""});
  return items;
}

/* =========================================================
   GRÁFICOS (SVG a mano, sin librerías)
   ========================================================= */
function tooltipEn(contenedor){
  let tip = contenedor.querySelector(".tooltip");
  if (!tip){ tip = document.createElement("div"); tip.className = "tooltip"; tip.setAttribute("role", "status"); contenedor.appendChild(tip); }
  return {
    mostrar(html, x, y){
      tip.innerHTML = html; const w = tip.offsetWidth || 200;
      let l = x + 14; if (l + w > contenedor.clientWidth) l = x - w - 14;
      tip.style.left = Math.max(0, l) + "px"; tip.style.top = Math.max(0, y - 30) + "px"; tip.classList.add("visible");
    },
    ocultar(){ tip.classList.remove("visible"); }
  };
}
function pasoNice(rango){ for (const p of [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000]) if (rango / p <= 6) return p; return 100000; }

// Saldo en escalones: real del extracto (línea continua) + previsto (discontinua, con relleno),
// con el colchón y los cargos sin importe marcados. opc.hist = historiaSaldo(n); opc.comparar = otra previsión (sin la compra)
function graficoSaldo(hueco, p, opc){
  opc = opc || {};
  const W = Math.max(320, hueco.clientWidth || 900), estrecho = W < 560, H = estrecho ? 250 : 310;
  const M = {t: 24, r: estrecho ? 14 : 96, b: 30, l: estrecho ? 54 : 66};
  const hist = opc.hist || [], nh = hist.length;
  const dias = hist.concat(p.porDia), n = dias.length, colchon = COLCHON_BASE();
  const vals = dias.map(d => d.saldo).concat([colchon, 0], opc.comparar ? opc.comparar.porDia.map(d => d.saldo) : []);
  const vmin0 = Math.min(...vals), vmax0 = Math.max(...vals), paso = pasoNice(vmax0 - Math.min(0, vmin0));
  const vmin = Math.floor(Math.min(0, vmin0) / paso) * paso, vmax = Math.ceil(vmax0 * 1.06 / paso) * paso;
  const x = i => M.l + (W - M.l - M.r) * (i / Math.max(1, n - 1));
  const y = v => M.t + (H - M.t - M.b) * (1 - (v - vmin) / (vmax - vmin));
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" tabindex="0" aria-label="Saldo ${nh ? "real desde el " + corta(hist[0].fecha) + " y " : ""}previsto hasta el ${corta(p.fin)}. Mínimo previsto ${eur(p.min.saldo)} el ${corta(p.min.fecha)}.">`;
  // Zona por debajo del colchón
  s += `<rect x="${M.l}" y="${y(colchon)}" width="${W - M.l - M.r}" height="${Math.max(0, y(Math.max(vmin, 0)) - y(colchon))}" fill="var(--aviso-suave)" opacity=".55"/>`;
  if (vmin < 0) s += `<rect x="${M.l}" y="${y(0)}" width="${W - M.l - M.r}" height="${y(vmin) - y(0)}" fill="var(--critico-suave)"/>`;
  for (let v = vmin; v <= vmax; v += paso){
    s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "var(--tinta-2)" : "var(--raya-2)"}" stroke-width="1"/>`;
    s += `<text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end" class="num">${eur0(v)}</text>`;
  }
  const marcaQuincena = n <= 130 && !estrecho;
  dias.forEach((d, i) => { const dd = d.fecha.getDate();
    if (dd === 1 || (dd === 15 && marcaQuincena)){ s += `<text x="${x(i)}" y="${H - M.b + 18}" text-anchor="middle">${dd} ${MESES[d.fecha.getMonth()]}</text><line x1="${x(i)}" x2="${x(i)}" y1="${H - M.b}" y2="${H - M.b + 4}" stroke="var(--raya)"/>`; } });
  const yc = y(colchon);
  s += `<line x1="${M.l}" x2="${W - M.r}" y1="${yc}" y2="${yc}" stroke="var(--aviso)" stroke-width="1.5" stroke-dasharray="2 3"/>`;
  s += estrecho ? `<text x="${M.l + 4}" y="${yc - 5}" font-size="11">Colchón base ${eur0(colchon)}</text>`
                : `<text x="${W - M.r + 6}" y="${yc - 2}" font-size="11">Colchón base</text><text x="${W - M.r + 6}" y="${yc + 12}" font-size="11" class="num">${eur0(colchon)}</text>`;
  const escalon = (desde, hasta, val) => { let d = `M ${x(desde)} ${y(val(desde))}`; for (let i = desde + 1; i <= hasta; i++) d += ` H ${x(i)} V ${y(val(i))}`; return d; };
  // Real
  if (nh){
    const dr = escalon(0, nh, i => dias[i].saldo);
    s += `<path d="${dr}" fill="none" stroke="var(--serie)" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<line x1="${x(nh)}" x2="${x(nh)}" y1="${M.t - 6}" y2="${H - M.b}" stroke="var(--tinta-3)" stroke-dasharray="3 3"/>`;
    s += `<text x="${x(nh) + 5}" y="${M.t - 10}" font-size="11" style="font-weight:700">Hoy · ${corta(BASE)}</text>`;
  }
  // Comparación (sin la compra)
  if (opc.comparar){
    const pd = opc.comparar.porDia;
    let dc = `M ${x(nh)} ${y(pd[0].saldo)}`; for (let i = 1; i < pd.length && nh + i < n; i++) dc += ` H ${x(nh + i)} V ${y(pd[i].saldo)}`;
    s += `<path d="${dc}" fill="none" stroke="var(--tinta-3)" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>`;
  }
  // Previsto
  const dp = escalon(nh, n - 1, i => dias[i].saldo);
  s += `<path d="${dp} V ${y(Math.max(vmin, 0))} H ${x(nh)} Z" fill="var(--serie-wash)"/>`;
  s += `<path d="${dp}" fill="none" stroke="var(--serie)" stroke-width="2" stroke-dasharray="6 4" stroke-linejoin="round"/>`;
  // Cargos sin importe e hipótesis
  dias.forEach((q, i) => { if (!q.real && q.ev.some(e => e.certeza === "sin_importe")){
    s += `<circle cx="${x(i)}" cy="${y(q.saldo)}" r="8" fill="var(--hoja)" stroke="var(--critico)" stroke-width="2"/><text x="${x(i)}" y="${y(q.saldo) + 4}" text-anchor="middle" style="fill:var(--critico);font-weight:800" font-size="11">?</text>`; }
    if (!q.real && q.ev.some(e => e.certeza === "hipotesis"))
      s += `<rect x="${x(i) - 6}" y="${y(q.saldo) - 6}" width="12" height="12" rx="3" fill="#6250d6" stroke="var(--hoja)" stroke-width="2"/>`; });
  const iMin = nh + p.porDia.findIndex(q => iso(q.fecha) === iso(p.min.fecha));
  if (iMin >= nh && p.min.saldo < ULT.saldo){
    const px = x(iMin), py = y(p.min.saldo), izq = px > W * (estrecho ? 0.45 : 0.7), arriba = py > H - M.b - 34;
    s += `<circle cx="${px}" cy="${py}" r="6" fill="var(--critico)" stroke="var(--hoja)" stroke-width="2"/>`;
    s += `<text x="${px + (izq ? -10 : 10)}" y="${arriba ? py - 12 : py + 20}" paint-order="stroke" stroke="var(--hoja)" stroke-width="4" text-anchor="${izq ? "end" : "start"}" style="fill:var(--tinta);font-weight:700" class="num">${estrecho ? "" : "Día más justo "}${corta(p.min.fecha)}: ${estrecho ? eur0(p.min.saldo) : eur(p.min.saldo)}</text>`;
  }
  s += `<circle cx="${x(n - 1)}" cy="${y(p.final)}" r="4" fill="var(--serie)" stroke="var(--hoja)" stroke-width="2"/>`;
  const antes = dias[Math.max(0, n - 8)].saldo, abajo = antes > p.final;
  s += estrecho ? `<text x="${x(n - 1)}" y="${y(p.final) + (abajo ? 18 : -10)}" text-anchor="end" style="fill:var(--tinta);font-weight:600" class="num">${eur(p.final)}</text>`
                : `<text x="${x(n - 1) + 8}" y="${y(p.final) + (Math.abs(y(p.final) - yc) < 26 ? (y(p.final) > yc ? 30 : -22) : 4)}" style="fill:var(--tinta);font-weight:600" class="num">${eur(p.final)}</text>`;
  s += `<line class="cur" x1="0" x2="0" y1="${M.t}" y2="${H - M.b}" stroke="var(--tinta-2)" visibility="hidden"/><rect class="zona" x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="transparent"/></svg>`;
  hueco.innerHTML = s;
  const svg = hueco.querySelector("svg"), cur = svg.querySelector(".cur"), fig = hueco.closest("figure") || hueco.parentElement, tt = tooltipEn(fig);
  let act = Math.max(0, iMin);
  const ver = i => {
    act = Math.max(0, Math.min(n - 1, i)); const q = dias[act], cx = x(act);
    const fr = fig.getBoundingClientRect(), sr = svg.getBoundingClientRect(), k = sr.width / W;
    cur.setAttribute("x1", cx); cur.setAttribute("x2", cx); cur.setAttribute("visibility", "visible");
    let h = `<b>${esc(cap(larga(q.fecha)))}</b><div class="fila"><span>${q.real ? "Saldo real" : "Saldo previsto"}</span><b class="num">${eur(q.saldo)}</b></div>`;
    if (q.real){
      const ent = r2(q.mov.filter(m => m.importe > 0).reduce((a, m) => a + m.importe, 0)), sal = r2(q.mov.filter(m => m.importe < 0).reduce((a, m) => a + m.importe, 0));
      if (q.mov.length) h += `<div class="fila"><span>${plural(q.mov.length, "movimiento", "movimientos")}</span><span class="num">${ent ? eur(ent, true) + " " : ""}${sal ? eur(sal) : ""}</span></div>`;
    } else for (const e of q.ev) h += `<div class="fila"><span>${esc(e.concepto)}</span><span class="num">${e.importe == null ? (e.certeza === "aviso" ? "aviso" : "¿?") : eur(e.importe, true)}</span></div>`;
    tt.mostrar(h, sr.left - fr.left + cx * k, sr.top - fr.top + y(q.saldo) * k);
  };
  const oc = () => { tt.ocultar(); cur.setAttribute("visibility", "hidden"); };
  svg.querySelector(".zona").addEventListener("pointermove", ev => { const r = svg.getBoundingClientRect(); ver(Math.round(((ev.clientX - r.left) * W / r.width - M.l) / (W - M.l - M.r) * (n - 1))); });
  svg.querySelector(".zona").addEventListener("pointerleave", oc);
  svg.addEventListener("focus", () => ver(act)); svg.addEventListener("blur", oc);
  svg.addEventListener("keydown", e => { if (e.key === "ArrowRight"){ e.preventDefault(); ver(act + 1); } if (e.key === "ArrowLeft"){ e.preventDefault(); ver(act - 1); } if (e.key === "Escape") oc(); });
}
const leyendaSaldo = (hist, comparar) => `<div class="leyenda">${hist ? `<span><i class="linea" style="background:var(--serie)"></i>Saldo real</span>` : ""}<span><i class="discontinua"></i>Saldo previsto</span>${comparar ? `<span><i class="discontinua" style="border-top-style:dotted;border-top-color:var(--tinta-3)"></i>Sin la compra</span><span><i style="background:#6250d6"></i>La compra (Hipótesis)</span>` : ""}<span><i style="background:var(--aviso-suave);border:1px dashed var(--aviso)"></i>Por debajo del colchón</span><span><b class="mal">?</b> cargo sin importe</span></div>`;

// Mini gráfico de saldo real para la tarjeta del héroe (sin ejes)
function sparkSaldo(hist){
  if (hist.length < 2) return "";
  const W = 300, H = 56, v = hist.map(h => h.saldo).concat([ULT.saldo]), mn = Math.min(...v), mx = Math.max(...v);
  const x = i => i / (v.length - 1) * W, y = a => 4 + (H - 8) * (1 - (a - mn) / ((mx - mn) || 1));
  let d = `M 0 ${y(v[0])}`; for (let i = 1; i < v.length; i++) d += ` H ${x(i)} V ${y(v[i])}`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} V ${H} H 0 Z" fill="rgba(255,255,255,.12)"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

// Columnas agrupadas: ingresos y gastos corrientes por mes
function graficoMeses(hueco, meses){
  const W = Math.max(320, hueco.clientWidth || 700), H = 250, M = {t: 26, r: 10, b: 40, l: 62};
  const max = Math.max(1, ...meses.flatMap(m => [m.ingresos, m.gastos])), paso = pasoNice(max), vmax = Math.ceil(max * 1.1 / paso) * paso;
  const y = v => M.t + (H - M.t - M.b) * (1 - v / vmax), banda = (W - M.l - M.r) / meses.length, bw = Math.min(28, banda / 4);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ingresos y gastos corrientes por mes">`;
  for (let v = 0; v <= vmax; v += paso) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--raya-2)"/><text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end" class="num">${eur0(v)}</text>`;
  meses.forEach((m, i) => {
    const cx = M.l + banda * i + banda / 2;
    [["ingresos", "var(--ingreso)", -bw - 1], ["gastos", "var(--gasto)", 1]].forEach(([k, col, dx]) => {
      const v = m[k], top = y(v), h = y(0) - top, x0 = cx + dx, r = Math.min(4, h);
      s += `<path d="M ${x0} ${y(0)} V ${top + r} Q ${x0} ${top} ${x0 + r} ${top} H ${x0 + bw - r} Q ${x0 + bw} ${top} ${x0 + bw} ${top + r} V ${y(0)} Z" fill="${col}" data-tip="${esc(cap(nombreMes(m.k)))}${m.completo ? "" : " (hasta el " + corta(m.hasta) + ")"}|${k === "ingresos" ? "Ingresos" : "Gastos"}|${eur(v)}"/>`;
      s += `<text x="${x0 + bw / 2}" y="${top - 6}" text-anchor="middle" style="fill:var(--tinta);font-weight:600" font-size="11" class="num">${eur0(v)}</text>`;
    });
    s += `<text x="${cx}" y="${H - M.b + 18}" text-anchor="middle">${cap(MESES_L[+m.k.slice(5) - 1])}${m.completo ? "" : "*"}</text>`;
  });
  hueco.innerHTML = s + `</svg>`;
  conTooltip(hueco);
}
function conTooltip(hueco){
  const svg = hueco.querySelector("svg"), fig = hueco.parentElement, tt = tooltipEn(fig);
  svg.addEventListener("pointermove", ev => {
    const t = ev.target.closest("[data-tip]"); if (!t){ tt.ocultar(); return; }
    const [a, b, c] = t.dataset.tip.split("|"), r = fig.getBoundingClientRect();
    tt.mostrar(`<b>${a}</b><div class="fila"><span>${b}</span><b class="num">${c}</b></div>`, ev.clientX - r.left, ev.clientY - r.top);
  });
  svg.addEventListener("pointerleave", () => tt.ocultar());
}
// Barras horizontales ordenadas (una sola serie)
function graficoBarras(hueco, items, total, etiqueta){
  const W = Math.max(320, hueco.clientWidth || 600), estrecho = W < 520, fila = 30, M = {t: 6, r: estrecho ? 76 : 96, b: 6, l: estrecho ? 130 : 190};
  const H = M.t + M.b + fila * items.length, max = Math.max(1, ...items.map(i => i.v));
  const x = v => M.l + (W - M.l - M.r) * v / max, lim = estrecho ? 18 : 28;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(etiqueta || "Barras")}">`;
  items.forEach((it, i) => {
    const yy = M.t + fila * i, bh = 16, w = Math.max(2, x(it.v) - M.l), r = Math.min(4, w);
    s += `<text x="${M.l - 10}" y="${yy + 17}" text-anchor="end">${esc(it.n.length > lim ? it.n.slice(0, lim - 1) + "…" : it.n)}</text>`;
    s += `<path d="M ${M.l} ${yy + 5} H ${M.l + w - r} Q ${M.l + w} ${yy + 5} ${M.l + w} ${yy + 5 + r} V ${yy + 5 + bh - r} Q ${M.l + w} ${yy + 5 + bh} ${M.l + w - r} ${yy + 5 + bh} H ${M.l} Z" fill="${it.color || "var(--serie)"}" data-tip="${esc(it.n)}|${total ? pct(it.v / total * 100) + " del total" : ""}|${eur(it.v)}"/>`;
    s += `<text x="${M.l + w + 8}" y="${yy + 17}" style="fill:var(--tinta);font-weight:600" class="num">${eur0(it.v)}</text>`;
  });
  hueco.innerHTML = s + `</svg>`;
  conTooltip(hueco);
}

/* =========================================================
   PESTAÑAS
   ========================================================= */
const PESTANAS = [
  ["inicio", "Inicio"], ["calendario", "Calendario"], ["prevision", "Previsión"], ["comprar", "¿Puedo comprarlo?"], ["movimientos", "Movimientos"],
  ["gastos", "Gastos"], ["recurrentes", "Recurrentes"], ["global", "Global"], ["faltan", "Datos que faltan"],
];
const ESTADO = {horizonte: 60, mesCal: ym(HOY > BASE ? HOY : BASE), diaSel: null, mesGastos: null, filtro: {mes: "", cat: "", q: "", tipo: ""},
  compra: {que: "", importe: "", fecha: iso(sumar(HOY > BASE ? HOY : BASE, 1)), forma: "cuenta", tipo: "consumo", cuota: "", plazo: "", entrada: "", reventa: "", ingreso: ""}, evaluada: false};
try { const g = JSON.parse(localStorage.getItem("estado-finanzas") || "{}"); if ([30, 60, 90, 180].includes(g.horizonte)) ESTADO.horizonte = g.horizonte; } catch(e) {}
const guardar = () => { try { localStorage.setItem("estado-finanzas", JSON.stringify({horizonte: ESTADO.horizonte})); } catch(e) {} };

function veredicto(p){
  const colchon = COLCHON_BASE(), m = p.min;
  if (m.saldo < 0) return {clase: "malo", t: `En negativo el ${corta(m.fecha)}`, h: `El ${corta(m.fecha)} te quedas en negativo: <span class="cifra">${eur(m.saldo)}</span>.`};
  if (m.saldo < colchon) return {clase: "justo", t: "Por debajo del colchón", h: `No llegas al colchón: el ${corta(m.fecha)} te quedan <span class="cifra">${eur(m.saldo)}</span>.`};
  return {clase: "bueno", t: "Todo en orden", h: `El saldo no baja de <span class="cifra">${eur(m.saldo)}</span> hasta el ${corta(p.fin)}.`};
}

function selectorHorizonte(){
  return `<span class="segmentos" role="group" aria-label="Horizonte de la previsión">${[30, 60, 90, 180].map(d => `<button type="button" data-horizonte="${d}" aria-pressed="${ESTADO.horizonte === d}">${d} d</button>`).join("")}</span>`;
}

// Mes en curso frente al anterior hasta el mismo día del mes
function esteMes(){
  const meses = resumenMeses(), m = meses[meses.length - 1], ant = meses[meses.length - 2];
  const hastaDia = m.completo ? 31 : m.hasta.getDate();
  let antGasto = null;
  if (ant){ antGasto = 0; for (const x of MOVS) if (x.fecha.startsWith(ant.k) && x.f.getDate() <= hastaDia && x.tipo === "gasto") antGasto -= x.importe; antGasto = r2(antGasto); }
  const cats = Object.entries(m.porCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return {m, ant, hastaDia, antGasto, cats};
}
function barrasHtml(items, max){
  return `<div class="barras">${items.map(it => `<div><div class="bt"><span>${esc(it.n)}</span><b class="num">${eur0(it.v)}</b></div><div class="medidor fino"><i style="width:${Math.max(1.5, it.v / max * 100)}%;background:${it.color || "var(--serie)"}"></i></div></div>`).join("")}</div>`;
}
// Anillo de progreso (0–1)
function anillo(frac, color){
  const r = 22, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return `<svg class="anillo" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--raya-2)" stroke-width="7"/><circle cx="28" cy="28" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/><text x="28" y="32" text-anchor="middle" font-size="13" font-weight="800" style="fill:var(--tinta)">${Math.round(f * 100)}%</text></svg>`;
}
// Fila de movimiento previsto, estilo app
function filaMov(e, conSaldo){
  const tipo = e.certeza === "sin_importe" ? "sin" : e.certeza === "aviso" ? "ven" : e.certeza === "hipotesis" ? "hip" : e.importe > 0 ? "ing" : "gas";
  const ic = {sin: "?", ven: "!", hip: "◆", ing: "↑", gas: "↓"}[tipo];
  const sub = e.certeza === "sin_importe" ? (e.tope != null ? (e.tope < 0 ? "Sin importe · ya sin margen" : `Sin importe · tope ${eur0(e.tope)}`) : "Sin importe")
    : e.certeza === "aviso" ? (e.origen === "revision" ? "Recordatorio" : "Aviso") : ETQ[e.certeza];
  return `<li class="mov ${tipo}"><span class="fd"><b>${e.fecha.getDate()}</b>${MESES[e.fecha.getMonth()]}</span><span class="mi" aria-hidden="true">${ic}</span>
    <span class="mc"><span class="mn">${esc(e.concepto)}</span><span class="ms">${esc(sub)}</span></span>
    <span class="mv"><b class="num ${e.importe > 0 ? "positivo" : e.importe == null && tipo === "sin" ? "mal" : ""}">${e.importe == null ? (tipo === "sin" ? "¿?" : "") : eur(e.importe, true)}</b>${conSaldo && e.importe != null ? `<span class="num">${eur0(e.saldo)}</span>` : ""}</span></li>`;
}

function vistaInicio(el){
  const p = prevision(ESTADO.horizonte), v = veredicto(p), fm = fijosMensuales(), colchon = COLCHON_BASE(), avs = avisos(p);
  const tj = p.sin.find(e => e.origen === "tarjeta"), hist = historiaSaldo(30);
  const em = esteMes(), mes = em.m, margen = r2(fm.ing - fm.gas);
  const reservado = r2(C.pendientes.filter(x => x.importe != null && x.clase !== "cobro").reduce((a, x) => a + x.importe, 0));
  const nomina = p.ev.find(e => e.origen === "fijo" && e.clase === "ingreso" && /nómina/i.test(e.concepto));
  const prox = p.ev.filter(e => e.fecha <= sumar(BASE, 31));
  const dif = em.antGasto != null ? r2(mes.gastos - em.antGasto) : null, fracCol = p.min.saldo / colchon;
  const nFaltan = datosQueFaltan().length;
  el.innerHTML = `
    <div class="heroe ${v.clase}"><div class="fila-h">
      <div>
        <span class="estado"><i></i>${v.t}</span>
        <div class="n" style="margin-top:14px">Saldo en cuenta</div>
        <div class="grande num">${eur(ULT.saldo)}</div>
        <div class="pills">
          <span class="pill ${p.min.saldo < colchon ? "rojo" : ""}">Día más justo <b class="num">${eur(p.min.saldo)}</b> ${corta(p.min.fecha)}</span>
          ${nomina ? `<span class="pill">Nómina <b class="num">${eur(nomina.importe, true)}</b> ${corta(nomina.fecha)}</span>` : ""}
          ${reservado ? `<span class="pill">Comprometido <b class="num">${eur(reservado)}</b></span>` : ""}
        </div>
      </div>
      <div class="saldo-h"><div class="n">Últimos 30 días · real</div>${sparkSaldo(hist)}<div class="d">Datos hasta el ${corta(BASE)}</div></div>
    </div></div>
    <div class="cifras">
      <div class="${fracCol < 1 ? "alerta" : "ok"} con-anillo">${anillo(fracCol, fracCol >= 1 ? "var(--bien)" : fracCol > .5 ? "var(--aviso)" : "var(--critico)")}<div><div class="n">${fracCol < 1 ? "Colchón · te faltan" : "Colchón"}</div><div class="v num ${fracCol < 1 ? "mal" : "bien"}">${fracCol < 1 ? eur0(colchon - p.min.saldo) : "Completo"}</div><div class="d">Objetivo ${eur0(colchon)}</div></div></div>
      <div class="${tj ? "alerta" : "ok"}"><div class="n"><span class="ic">${icono("tarjeta")}</span>Tarjetas ${tj ? corta(tj.fecha) : ""}</div><div class="v num ${tj ? "mal" : ""}">${tj ? "¿?" : "—"}</div><div class="d">${tj ? (tj.tope < 0 ? "Ya sin margen" : `Tope ${eur0(tj.tope)}`) : "Sin cargos pendientes"}</div></div>
      <div><div class="n"><span class="ic">${icono("gastos")}</span>Gastado en ${MESES_L[+mes.k.slice(5) - 1]}</div><div class="v num">${eur0(mes.gastos)}</div><div class="d">${dif != null ? `<span class="${dif > 0 ? "mal" : "bien"}">${dif > 0 ? "▲" : "▼"} ${eur0(Math.abs(dif))}</span> vs ${MESES[+em.ant.k.slice(5) - 1]}` : ""}</div></div>
      <div class="${margen < 0 ? "alerta" : ""}"><div class="n"><span class="ic">${icono("cuenta")}</span>Margen fijo / mes</div><div class="v num ${margen < 0 ? "mal" : ""}">${eur0(margen)}</div><div class="d">${eur0(fm.ing)} − ${eur0(fm.gas)}</div></div>
    </div>
    <figure class="grafico"><div class="tit fila-tit"><span>Saldo real y previsto</span>${selectorHorizonte()}</div>${leyendaSaldo(true)}<div class="hueco"></div></figure>
    <div class="dos">
      <div class="bloque"><h3>Próximos cargos y cobros <button class="enlace" type="button" data-ir="prevision">Ver todo</button></h3><ul class="movs">${prox.map(e => filaMov(e, true)).join("") || `<li class="sub">Nada en 30 días.</li>`}</ul></div>
      <div>
        <div class="bloque"><h3>Alertas <span class="chip">${avs.length}</span></h3><ul class="alertas">${avs.slice(0, 5).map(a => `<li class="${a.nivel}"><span class="ico" aria-hidden="true">${a.nivel === "info" ? "i" : "!"}</span><span>${esc(a.texto)}</span></li>`).join("")}</ul>
          ${avs.length > 5 ? `<details class="mas"><summary>${avs.length - 5} más</summary><ul class="alertas">${avs.slice(5).map(a => `<li class="${a.nivel}"><span class="ico" aria-hidden="true">${a.nivel === "info" ? "i" : "!"}</span><span>${esc(a.texto)}</span></li>`).join("")}</ul></details>` : ""}
          ${nFaltan ? `<button class="enlace" type="button" data-ir="faltan" style="margin-top:10px">${nFaltan} datos pendientes →</button>` : ""}</div>
        <div class="bloque"><h3>En qué gastas · ${MESES_L[+mes.k.slice(5) - 1]} <button class="enlace" type="button" data-ir="gastos">Ver</button></h3>
          ${em.cats.length ? barrasHtml(em.cats.slice(0, 5).map(([c, v]) => ({n: CAT[c].nombre, v})), em.cats[0][1]) : `<p class="sub">Sin gastos aún.</p>`}</div>
      </div>
    </div>`;
  graficoSaldo(el.querySelector(".hueco"), p, {hist});
}

function tablaEventos(lista, p){
  if (!lista.length) return `<p class="sub">No hay movimientos previstos en este periodo.</p>`;
  let h = `<div class="envuelve"><table><thead><tr><th>Fecha</th><th>Concepto</th><th class="der">Importe</th><th>Certeza</th><th class="der">Saldo</th></tr></thead><tbody>`;
  h += `<tr><td class="fecha num">${corta(BASE)}</td><td>Saldo de hoy</td><td></td><td>${cert("exacto")}</td><td class="der num"><b>${eur(ULT.saldo)}</b></td></tr>`;
  let marcado = false;
  for (const e of lista){
    const esMin = !marcado && e.importe != null && iso(e.fecha) === iso(p.min.fecha) && e.saldo === p.min.saldo; if (esMin) marcado = true;
    const cls = esMin ? "minimo" : e.certeza === "sin_importe" ? "sin" : "";
    const nota = e.certeza === "sin_importe" ? (e.tope < 0 ? "Ya sin margen" : "Tope " + eur(e.tope)) : "";
    h += `<tr class="${cls}"><td class="fecha num">${corta(e.fecha)}</td><td>${esc(e.concepto)}${nota ? `<span class="etq">${esc(nota)}</span>` : ""}</td>
      <td class="der num ${e.importe > 0 ? "positivo" : ""} ${e.importe == null && e.certeza === "sin_importe" ? "mal" : ""}">${e.importe == null ? (e.certeza === "aviso" ? "—" : "¿?") : eur(e.importe, true)}</td><td>${cert(e.certeza)}</td>
      <td class="der num ${e.saldo < 0 ? "mal" : ""}">${e.importe == null ? `<span class="tenue">${eur(e.saldo)}</span>` : `<b>${eur(e.saldo)}</b>`}</td></tr>`;
  }
  return h + `</tbody></table></div>`;
}

// Alertas en una línea, de más a menos grave
function avisos(p){
  const l = [], colchon = COLCHON_BASE();
  if (p.min.saldo < 0) l.push({nivel: "grave", texto: `Negativo el ${corta(p.min.fecha)}: ${eur(p.min.saldo)}`});
  else if (p.min.saldo < colchon) l.push({nivel: "grave", texto: `Sin colchón el ${corta(p.min.fecha)}: faltan ${eur(r2(colchon - p.min.saldo))}`});
  const tj = p.sin.find(e => e.origen === "tarjeta");
  if (tj) l.push({nivel: "grave", texto: `Tarjetas del ${corta(tj.fecha)} sin importe · ${tj.tope < 0 ? "sin margen" : "tope " + eur(tj.tope)}`});
  for (const x of C.pendientes){
    if (x.importe != null && x.fecha && leer(x.fecha) <= BASE) l.push({nivel: "aviso", texto: `${x.nombre.replace(/^Honorarios compra: /, "")} sin cobrar · ${eur(x.importe)} reservados`});
    if (!x.fecha || x.importe == null) l.push({nivel: "aviso", texto: `${x.nombre}: ${x.importe == null ? "sin importe" : eur(x.importe)}${x.fecha ? "" : " ni fecha"}`});
  }
  for (const e of p.ev.filter(e => e.origen === "revision")) l.push({nivel: "aviso", texto: `${e.concepto} desde el ${corta(e.fecha)}`});
  const pc = p.porConfirmar[0];
  if (pc) l.push({nivel: "aviso", texto: `Cuota de la hipoteca por confirmar desde el ${corta(pc.fecha)}`});
  const cerrado = resumenMeses().filter(m => m.completo).pop();
  if (cerrado && cerrado.ahorro < 0) l.push({nivel: "aviso", texto: `${cap(MESES_L[+cerrado.k.slice(5) - 1])} cerró en ${eur(cerrado.ahorro)}`});
  const v = entre(BASE, HOY); if (v > 7) l.push({nivel: "aviso", texto: `Datos de hace ${v} días: pásale un extracto al agente`});
  for (const n of C.notas || []) l.push({nivel: n.nivel === "aviso" ? "aviso" : "info", texto: n.texto});
  return l;
}

function vistaCalendario(el){
  const [yy, mm] = ESTADO.mesCal.split("-").map(Number), primero = new Date(yy, mm - 1, 1), ultimo = new Date(yy, mm, 0);
  const p = prevision(Math.max(30, entre(BASE, ultimo) + 1)), colchon = COLCHON_BASE();
  const porDia = {};
  for (const m of MOVS) (porDia[m.fecha] ||= {real: [], prev: []}).real.push(m);
  for (const e of p.ev) (porDia[iso(e.fecha)] ||= {real: [], prev: []}).prev.push(e);
  const venMes = C.vencimientos.filter(v => (v.fecha && v.fecha.slice(0, 7) === ESTADO.mesCal) || (!v.fecha && v.mes === ESTADO.mesCal));
  let h = `<div class="cal-cab"><button type="button" data-cal="-1" aria-label="Mes anterior">‹</button><h3>${cap(nombreMes(ESTADO.mesCal))}</h3><button type="button" data-cal="1" aria-label="Mes siguiente">›</button><button type="button" data-cal="hoy">Hoy</button></div>`;
  h += `<div class="cal">` + ["lun","mar","mié","jue","vie","sáb","dom"].map(d => `<div class="dsem">${d}</div>`).join("");
  const desfase = (primero.getDay() + 6) % 7;
  for (let i = 0; i < desfase; i++) h += `<div class="dia fuera" aria-hidden="true"></div>`;
  for (let d = 1; d <= ultimo.getDate(); d++){
    const f = new Date(yy, mm - 1, d), k = iso(f), x = porDia[k] || {real: [], prev: []};
    const pasado = f <= BASE, cls = ["dia"]; if (pasado) cls.push("pasado"); if (k === iso(HOY)) cls.push("hoy"); if (ESTADO.diaSel === k) cls.push("sel");
    const conImp = x.prev.filter(e => e.importe != null), saldoDia = conImp.length ? conImp[conImp.length - 1].saldo : null;
    if (!pasado && saldoDia != null && saldoDia < colchon && conImp.some(e => e.importe < 0)) cls.push("critico");
    let items = "";
    if (pasado){
      const corr = x.real.filter(m => m.tipo === "ingreso" || m.tipo === "gasto");
      const ent = r2(corr.filter(m => m.importe > 0).reduce((a, m) => a + m.importe, 0));
      const sal = r2(-corr.filter(m => m.importe < 0).reduce((a, m) => a + m.importe, 0));
      if (ent) items += `<span class="it ing num">+${eur0(ent)}</span>`;
      if (sal) items += `<span class="it real num">−${eur0(sal)}</span>`;
      if (x.real.length > corr.length) items += `<span class="it real">↔ entre cuentas</span>`;
    } else {
      for (const e of x.prev.slice(0, 3)) items += `<span class="it ${e.certeza === "sin_importe" ? "sin" : e.certeza === "aviso" ? "ven" : e.importe > 0 ? "ing" : ""}" title="${esc(e.concepto)}">${e.importe == null ? (e.certeza === "aviso" ? "◇ " : "? ") : (e.importe > 0 ? "+" : "−") + eur0(Math.abs(e.importe)) + " "}${esc(e.concepto)}</span>`;
      if (x.prev.length > 3) items += `<span class="it mas">+${x.prev.length - 3} más</span>`;
    }
    const puntos = pasado ? (x.real.length ? `<span class="punto" style="background:var(--tinta-3)"></span>` : "")
                          : x.prev.map(e => `<span class="punto" style="background:${e.certeza === "sin_importe" ? "var(--critico)" : e.certeza === "aviso" ? "var(--aviso)" : e.importe > 0 ? "var(--bien)" : "var(--gasto)"}"></span>`).join("");
    h += `<button type="button" class="${cls.join(" ")}" data-dia="${k}" aria-label="${esc(larga(f))}"><span class="nd num">${d}</span>${items}<span>${puntos}</span>${!pasado && saldoDia != null ? `<span class="neto num ${saldoDia < 0 ? "mal" : ""}">${eur0(saldoDia)}</span>` : ""}</button>`;
  }
  for (let i = (desfase + ultimo.getDate()) % 7; i && i < 7; i++) h += `<div class="dia fuera" aria-hidden="true"></div>`;
  h += `</div><div class="leyenda-cal"><span><b class="positivo">+</b> ingreso</span><span><b>−</b> gasto con importe</span><span class="mal"><b>?</b> cargo sin importe</span><span style="color:var(--aviso)"><b>◇</b> aviso o vencimiento</span><span><span class="muestra"></span>un cargo te deja por debajo del colchón</span><span>Cifra de abajo: saldo previsto al cerrar el día. Días hasta el ${corta(BASE)}: movimientos reales.</span></div>`;
  let det = `<p class="sub">Elige un día para ver el detalle.</p>`;
  if (ESTADO.diaSel){
    const f = leer(ESTADO.diaSel), x = porDia[ESTADO.diaSel] || {real: [], prev: []};
    const filas = x.real.map(m => `<li><span class="nom">${esc(m.concepto)}</span><span class="val num ${m.importe > 0 ? "positivo" : ""}">${eur(m.importe, true)}</span><span class="det">Real · ${esc(CAT[m.cat].nombre)}</span></li>`).join("")
      + x.prev.map(e => `<li><span class="nom">${esc(e.concepto)}</span><span class="val num">${e.importe == null ? (e.certeza === "aviso" ? "—" : "¿?") : eur(e.importe, true)}</span><span class="det">${cert(e.certeza)} ${esc(e.certeza === "sin_importe" ? textoTope(e) : (e.nota || ""))}</span></li>`).join("");
    det = `<p class="sub"><b>${cap(larga(f))}</b></p><ul class="lista">${filas || `<li><span class="det">Sin movimientos.</span></li>`}</ul>`;
  }
  const delMes = p.ev.filter(e => ym(e.fecha) === ESTADO.mesCal);
  const totIn = r2(delMes.filter(e => e.importe > 0).reduce((a, e) => a + e.importe, 0));
  const totOut = r2(-delMes.filter(e => e.importe < 0).reduce((a, e) => a + e.importe, 0));
  const nSin = delMes.filter(e => e.certeza === "sin_importe").length;
  el.innerHTML = `<h2>Calendario</h2><p class="intro">Lo pasado es real; lo que viene, previsto.</p>
    <div class="dos" style="margin-top:0"><div>${h}</div>
    <div><div class="bloque"><h3>Detalle del día</h3>${det}</div>
      <div class="bloque"><h3>Previsto en ${MESES_L[mm - 1]}</h3><ul class="lista">
        <li><span class="nom">Entradas con importe</span><span class="val num positivo">${eur(totIn, true)}</span></li>
        <li><span class="nom">Salidas con importe</span><span class="val num">${eur(-totOut)}</span></li>
        <li><span class="nom">Cargos sin importe</span><span class="val num ${nSin ? "mal" : ""}">${nSin}</span><span class="det">No están restados</span></li></ul></div>
      <div class="bloque"><h3>Vencimientos de ${MESES_L[mm - 1]}</h3>${venMes.length ? `<ul class="lista">${venMes.map(v => `<li><span class="nom">${esc(v.nombre)}</span><span class="val">${v.fecha ? corta(leer(v.fecha)) : "día sin fijar"}</span><span class="det">${esc(v.nota || "")}</span></li>`).join("")}</ul>` : `<p class="sub">Ninguno con fecha conocida.</p>`}</div>
    </div></div>
    <div class="bloque mt"><h3>Todos los vencimientos y renovaciones</h3><div class="envuelve"><table><thead><tr><th>Qué</th><th>Fecha</th><th class="der">Importe</th><th>Nota</th></tr></thead><tbody>
      ${C.vencimientos.map(v => `<tr class="${!v.fecha || (v.es_cargo && v.importe == null) ? "sin" : ""}"><td><b>${esc(v.nombre)}</b></td><td class="num">${v.fecha ? corta(leer(v.fecha)) + "/" + v.fecha.slice(0, 4) : (v.mes ? cap(nombreMes(v.mes)) + ", día sin fijar" : `<span class="mal">Falta</span>`)}</td><td class="der num">${v.importe != null ? eur(v.importe) : (v.es_cargo ? `<span class="mal">Falta</span>` : "—")}</td><td class="tenue">${esc(v.nota || "")}</td></tr>`).join("")}
    </tbody></table></div></div>`;
}

function vistaPrevision(el){
  const p = prevision(ESTADO.horizonte), colchon = COLCHON_BASE();
  const faltaCero = p.min.saldo < 0 ? r2(-p.min.saldo) : 0, faltaColchon = Math.max(0, r2(colchon - p.min.saldo));
  el.innerHTML = `<h2>Previsión</h2><p class="intro">Solo resta importes reales. Lo que no tiene cifra sale con «¿?».</p>
    <div class="controles"><span class="rot">Previsión a</span>${selectorHorizonte()}</div>
    <div class="cifras">
      <div><div class="n">Entradas con importe</div><div class="v num positivo">${eur(p.ingresos, true)}</div><div class="d">Hasta el ${corta(p.fin)}</div></div>
      <div><div class="n">Salidas con importe</div><div class="v num">${eur(-p.gastos)}</div><div class="d">Exactas, último real o por confirmar</div></div>
      <div><div class="n">Saldo al final</div><div class="v num ${p.final < 0 ? "mal" : ""}">${eur(p.final)}</div><div class="d">${corta(p.fin)}, sin restar ${plural(p.sin.length, "cargo sin importe", "cargos sin importe")}</div></div>
      <div><div class="n">${faltaCero ? "Para no quedarte en negativo" : "Para mantener el colchón"}</div><div class="v num ${faltaCero || faltaColchon ? "mal" : "bien"}">${faltaCero ? eur(faltaCero) : (faltaColchon ? eur(faltaColchon) : "Cubierto")}</div><div class="d">${faltaCero || faltaColchon ? "Te faltan el " + corta(p.min.fecha) : "Hasta el " + corta(p.fin)}</div></div>
    </div>
    <figure class="grafico">${leyendaSaldo(true)}<div class="hueco"></div></figure>
    <div class="bloque mt"><h3>Todos los movimientos previstos</h3>${tablaEventos(p.ev, p)}</div>
    <details class="metodo"><summary>Cómo se calcula</summary><ul>
      <li>Parte del saldo del último movimiento cargado (${corta(BASE)}).</li>
      <li><b>Exacto:</b> importe fijo conocido (comunidad, garaje, CC.OO., cuotas de honorarios). <b>Último real:</b> cargos recurrentes que varían (nómina, seguros): se usa el último importe que salió en el banco. <b>Por confirmar:</b> se sabe que va a cambiar (hipoteca desde enero) y se usa el último real hasta tener el nuevo.</li>
      <li><b>Sin importe:</b> tarjetas sin liquidación, pagos sin presupuesto e impuestos sin recibo. Se cuentan y se marcan, pero no se restan. Su <b>tope</b> es el saldo más bajo que queda desde ese día hasta el final del horizonte: si el cargo es mayor, la cuenta baja de 0.</li>
      <li>Si un día cae en sábado o domingo, pasa al lunes. En un mismo día se restan primero los gastos y después los ingresos.</li>
      <li>Las tarjetas, el día a día y los traspasos no se proyectan nunca.</li></ul></details>`;
  graficoSaldo(el.querySelector(".hueco"), p, {hist: historiaSaldo(30)});
}

/* ---------- ¿Puedo comprarlo? (validador de compras) ----------
   Tres respuestas con las reglas de contexto/05: ¿puedo pagarlo?, ¿es buena decisión? y ¿qué pasa con mi patrimonio?
   La compra es siempre una Hipótesis: solo existe en esta pestaña y nunca entra en datos/. */
const REGLAS_COMPRA = {margen_min_tras_cuota: 300, dias_compromisos: 90, dias_horizonte: 90}; // provisionales [DECIDIR] (contexto/05: F4 y F6)
const aNum = s => { s = String(s ?? "").trim().replace(/\s|€/g, ""); if (!s) return null; if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const v = parseFloat(s); return isFinite(v) ? v : null; };
const FORMAS = {cuenta: "Cuenta", tarjeta: "Tarjeta", financiado: "Financiado"};
const TIPOS = {consumo: ["Consumo", "ropa, viaje, móvil"], valor: ["Conserva valor", "oro, reloj, arte"], renta: ["Da ingresos", "alquiler, negocio"]};
// Compras miradas: en la nube (claude.ai, mismas en PC y móvil) si la página lo permite; si no, en este navegador
let COMPRAS = (() => { try { return JSON.parse(localStorage.getItem("compras-evaluadas") || "[]"); } catch(e) { return []; } })(), NUBE = null;
const leerCompras = () => COMPRAS;
function anadirCompra(x){
  x = {...x, ts: Date.now()};
  if (NUBE){ NUBE.doc(String(x.ts)).set(x).catch(() => {}); return; }
  COMPRAS = [x, ...COMPRAS].slice(0, 30); try { localStorage.setItem("compras-evaluadas", JSON.stringify(COMPRAS)); } catch(e) {}
}
function quitarCompra(i){
  const x = COMPRAS[i]; if (!x) return;
  if (NUBE && x._id){ NUBE.doc(x._id).delete().catch(() => {}); return; }
  COMPRAS = COMPRAS.filter((_, k) => k !== i); try { localStorage.setItem("compras-evaluadas", JSON.stringify(COMPRAS)); } catch(e) {}
}
(async () => {
  if (!window.claude || !window.claude.use) return;
  try {
    const db = await window.claude.use("db"), user = await window.claude.use("user");
    const uid = user ? await user.id() : null; if (!db || !uid) return;
    NUBE = db.collection("data/users/" + uid + "/compras");
    NUBE.orderBy("ts", "desc").limit(50).onSnapshot(s => {
      COMPRAS = s.docs.map(d => ({...d.data(), _id: d.id}));
      if (ACTUAL === "comprar" && !(document.activeElement && document.activeElement.matches("input"))) pintar();
    }, () => { NUBE = null; });
  } catch(e) { NUBE = null; }
})();

function eventosCompra(c, d){
  const nombre = c.que || "Compra", imp = aNum(c.importe) || 0, ev = [];
  if (c.forma === "tarjeta"){
    const cargo = laborable(new Date(d.getFullYear(), d.getMonth() + 1, C.tarjetas.dia_cargo));
    ev.push({fecha: cargo, concepto: nombre + " (tarjeta)", importe: -imp, clase: "gasto"});
  } else if (c.forma === "financiado"){
    const ent = aNum(c.entrada) || 0, cuota = aNum(c.cuota) || 0, n = Math.max(0, Math.round(aNum(c.plazo) || 0));
    if (ent) ev.push({fecha: d, concepto: nombre + " (entrada)", importe: -ent, clase: "gasto"});
    for (let k = 1; k <= n; k++) ev.push({fecha: laborable(new Date(d.getFullYear(), d.getMonth() + k, Math.min(d.getDate(), 28))), concepto: nombre + ` (cuota ${k}/${n})`, importe: -cuota, clase: "gasto"});
  } else ev.push({fecha: d, concepto: nombre, importe: -imp, clase: "gasto"});
  // Si da ingresos: entran cada mes desde el mes siguiente (Hipótesis del usuario)
  const ing = c.tipo === "renta" ? aNum(c.ingreso) : null;
  if (ing) for (let k = 1; k <= 24; k++) ev.push({fecha: laborable(new Date(d.getFullYear(), d.getMonth() + k, Math.min(d.getDate(), 28))), concepto: nombre + " (ingreso)", importe: ing, clase: "ingreso"});
  return ev;
}

function evaluarCompra(c, fechaForzada){
  let d = fechaForzada || (c.fecha ? leer(c.fecha) : sumar(BASE, 1));
  if (d <= BASE) d = sumar(BASE, 1);
  const ev = eventosCompra(c, d), fm = fijosMensuales(), colchon = COLCHON_BASE();
  const gastos = ev.filter(e => e.importe < 0), finEv = gastos.reduce((a, e) => e.fecha > a ? e.fecha : a, d);
  const dias = Math.min(400, Math.max(entre(BASE, sumar(d, REGLAS_COMPRA.dias_horizonte)), entre(BASE, finEv) + 1, ESTADO.horizonte));
  const sin = prevision(dias), con = prevision(dias, ev);
  const imp = aNum(c.importe) || 0, fin = c.forma === "financiado";
  const cuota = fin ? (aNum(c.cuota) || 0) : 0, plazo = Math.round(aNum(c.plazo) || 0), entrada = aNum(c.entrada) || 0;
  const ingreso = c.tipo === "renta" ? (aNum(c.ingreso) || 0) : 0, inversion = c.tipo !== "consumo";
  const reventa = inversion ? aNum(c.reventa) : 0;
  // 1 · ¿Puedo pagarlo?
  const tj = con.sin.find(e => e.origen === "tarjeta" && e.fecha >= d) || con.sin[0];
  const r1 = {ok: con.min.saldo >= 0, cifra: con.min.saldo, fecha: con.min.fecha, antes: sin.min.saldo, tope: tj ? tj.tope : null, tjFecha: tj ? tj.fecha : null};
  // 2 · ¿Es buena decisión?
  const r2_ = [];
  r2_.push({n: "Colchón intacto", ok: con.min.saldo >= colchon, c: eur0(con.min.saldo) + " / " + eur0(colchon), yaFallaba: sin.min.saldo < colchon});
  const limC = sumar(d, REGLAS_COMPRA.dias_compromisos);
  const comp = C.pendientes.filter(x => x.clase !== "cobro" && x.importe != null && x.fecha && leer(x.fecha) <= limC);
  r2_.push({n: "Sin pagos grandes en 3 meses", ok: !comp.length, c: comp.length ? eur0(comp.reduce((a, x) => a + x.importe, 0)) + " pendientes" : "Ninguno", yaFallaba: !!comp.length});
  const cerr = resumenMeses().filter(m => m.completo).pop();
  if (cerr) r2_.push({n: "Último mes en positivo", ok: cerr.ahorro > 0, c: cap(MESES[+cerr.k.slice(5) - 1]) + " " + eur0(cerr.ahorro), yaFallaba: cerr.ahorro <= 0});
  if (fin){
    const end = fm.ing ? (fm.deuda + cuota) / fm.ing * 100 : null, lim = C.reglas.tasa_esfuerzo_max_pct;
    r2_.push({n: "Endeudamiento ≤ " + lim + " %", ok: end != null && end <= lim, c: pct(end)});
    const mg = r2(fm.ing + ingreso - fm.gas - cuota);
    r2_.push({n: "Margen tras la cuota ≥ " + eur0(REGLAS_COMPRA.margen_min_tras_cuota), ok: mg >= REGLAS_COMPRA.margen_min_tras_cuota, c: eur0(mg) + "/mes"});
  }
  if (inversion){
    const pasoActual = escaleraExcedente(sin).actual; // índice del primer paso sin completar (contexto/05)
    r2_.push({n: "Invertir con los pasos 1–4 hechos", ok: pasoActual >= 4, c: pasoActual >= 4 ? "Sí" : "Toca el paso " + (pasoActual + 1), yaFallaba: pasoActual < 4});
  }
  const fallan = r2_.filter(x => !x.ok);
  const v2 = !r1.ok ? {cls: "no", t: "No", sub: "Te deja en negativo"}
    : !fallan.length ? {cls: "si", t: "Sí", sub: "Encaja en tus reglas"}
    : fallan.every(x => x.yaFallaba) ? {cls: "medio", t: "Ahora no", sub: "Ya ibas justo sin la compra: es cuestión de momento"}
    : {cls: "no", t: "No", sub: "Rompe tus reglas"};
  // 3 · Patrimonio
  const coste = fin ? r2(entrada + cuota * plazo) : imp;
  const conservas = c.tipo === "consumo" ? 0 : reventa;
  const efecto = conservas == null ? null : r2(conservas - coste);
  const p3 = {coste, conservas, efecto, extraFin: fin && imp ? r2(coste - imp) : null, ingreso, recuperas: ingreso > 0 ? Math.ceil((coste - (conservas || 0)) / ingreso) : null, perdidaVenta: inversion && reventa != null ? r2(imp - reventa) : null, resultadoMes: r2(ingreso - cuota)};
  return {d, ev, sin, con, r1, r2: r2_, v2, p3, dias};
}

// Primer día (hasta 180) en que la compra deja el colchón entero; si no, el primero en que no quedas en negativo
function mejorFecha(c){
  let sinNeg = null;
  for (let k = 1; k <= 180; k++){
    const d = sumar(BASE, k), r = evaluarCompra(c, d);
    if (r.con.min.saldo >= COLCHON_BASE()) return {d, sinNeg};
    if (!sinNeg && r.con.min.saldo >= 0) sinNeg = d;
  }
  return {d: null, sinNeg};
}

function vistaComprar(el){
  const c = ESTADO.compra, lista = leerCompras();
  const valido = aNum(c.importe) > 0 && (c.forma !== "financiado" || (aNum(c.cuota) > 0 && aNum(c.plazo) > 0));
  const r = ESTADO.evaluada && valido ? evaluarCompra(c) : null;
  const mf = r ? mejorFecha(c) : null;
  const seg = (k, obj, sel) => `<span class="segmentos" role="group">${Object.entries(obj).map(([v, n]) => `<button type="button" data-${k}="${v}" aria-pressed="${sel === v}">${Array.isArray(n) ? n[0] : n}</button>`).join("")}</span>`;
  const p3 = r && r.p3;
  el.innerHTML = `<h2>¿Puedo comprarlo?</h2><p class="intro">Tus datos reales + tus reglas. La compra es una ${cert("hipotesis")}: no se guarda.</p>
    <div class="bloque">
      <div class="form-compra">
        <label class="ancho">Qué<input type="text" id="c-que" value="${esc(c.que)}" placeholder="Ruedas, reloj, viaje…"></label>
        <label>Precio (€)<input type="text" inputmode="decimal" id="c-importe" value="${esc(c.importe)}" placeholder="0,00"></label>
        <label>Cuándo<input type="date" id="c-fecha" value="${esc(c.fecha)}" min="${iso(sumar(BASE, 1))}"></label>
        <div class="campo ancho"><span>Qué tipo de compra es <span class="tenue" style="font-weight:500">· ${TIPOS[c.tipo][1]}</span></span>${seg("tipo", TIPOS, c.tipo)}</div>
        <div class="campo ancho"><span>Cómo la pagas</span>${seg("forma", FORMAS, c.forma)}</div>
        ${c.tipo !== "consumo" ? `<label>Valor si lo vendieras (€)<input type="text" inputmode="decimal" id="c-reventa" value="${esc(c.reventa)}" placeholder="Lo que te darían"></label>` : ""}
        ${c.tipo === "renta" ? `<label>Ingreso al mes (€)<input type="text" inputmode="decimal" id="c-ingreso" value="${esc(c.ingreso)}" placeholder="0,00"></label>` : ""}
        ${c.forma === "financiado" ? `<label>Cuota / mes (€)<input type="text" inputmode="decimal" id="c-cuota" value="${esc(c.cuota)}" placeholder="0,00"></label>
          <label>Nº cuotas<input type="number" min="1" id="c-plazo" value="${esc(c.plazo)}" placeholder="12"></label>
          <label>Entrada (€)<input type="text" inputmode="decimal" id="c-entrada" value="${esc(c.entrada)}" placeholder="0"></label>` : ""}
        <div class="botones"><button class="boton" type="button" data-evaluar>Evaluar</button>${r ? `<button class="boton sec" type="button" data-guardar>Guardar</button>` : ""}</div>
      </div>
      ${ESTADO.evaluada && !valido ? `<p class="sub mal" style="margin-top:12px">Falta el precio${c.forma === "financiado" ? ", la cuota o el nº de cuotas" : ""}.</p>` : ""}
    </div>
    ${r ? `
    <div class="tres">
      <div class="resp ${r.r1.ok ? "si" : "no"}"><div class="preg">¿Puedo pagarlo?</div><div class="ans">${r.r1.ok ? "Sí" : "No"}</div>
        <div class="kv"><span>Día más justo</span><b class="num ${r.r1.cifra < 0 ? "mal" : ""}">${eur0(r.r1.cifra)}</b></div>
        <div class="kv"><span>Sin la compra</span><b class="num tenue">${eur0(r.r1.antes)}</b></div>
        ${r.r1.tjFecha ? `<div class="kv"><span>Tope tarjetas ${corta(r.r1.tjFecha)}</span><b class="num ${r.r1.tope < 0 ? "mal" : "ojo"}">${r.r1.tope < 0 ? "Sin margen" : eur0(r.r1.tope)}</b></div>` : ""}</div>
      <div class="resp ${r.v2.cls}"><div class="preg">¿Es buena decisión?</div><div class="ans">${r.v2.t}</div><p class="sub" style="margin:0 0 4px">${r.v2.sub}</p>
        <ul class="checks">${r.r2.map(x => `<li class="${x.ok ? "" : "f"}"><span class="m" aria-hidden="true">${x.ok ? "✓" : "✕"}</span><span>${esc(x.n)}</span><span class="c num ${x.ok ? "bien" : "mal"}">${esc(x.c)}</span></li>`).join("")}</ul></div>
      <div class="resp ${p3.efecto == null ? "" : p3.efecto >= 0 ? "si" : c.tipo === "consumo" ? "" : "no"}"><div class="preg">¿Y tu patrimonio?</div>
        <div class="ans num ${p3.efecto == null ? "tenue" : p3.efecto >= 0 ? "bien" : "mal"}">${p3.efecto == null ? "¿?" : eur0(p3.efecto)}</div>
        <p class="sub" style="margin:0 0 4px">${c.tipo === "consumo" ? "Es gasto: el dinero no vuelve" : p3.conservas == null ? "Pon el valor de reventa" : p3.efecto >= 0 ? "Conservas el valor" : "Pierdes valor al comprar"}</p>
        <div class="kv"><span>Te cuesta</span><b class="num">${eur0(p3.coste)}</b></div>
        ${c.tipo !== "consumo" ? `<div class="kv"><span>Valor que conservas</span><b class="num">${p3.conservas == null ? "—" : eur0(p3.conservas)}</b></div>` : ""}
        ${p3.extraFin ? `<div class="kv"><span>Intereses / extra</span><b class="num mal">${eur0(p3.extraFin)}</b></div>` : ""}
        ${p3.ingreso ? `<div class="kv"><span>Ingreso al mes</span><b class="num bien">${eur(p3.ingreso, true)}</b></div><div class="kv"><span>Lo recuperas en</span><b class="num">${p3.recuperas > 0 ? plural(p3.recuperas, "mes", "meses") : "—"}</b></div>` : ""}
        ${c.tipo !== "consumo" ? `<p class="nota">Aunque sea inversión, el dinero sale de la cuenta: cuenta igual para el colchón.</p>` : ""}</div>
    </div>
    <div class="dos">
      <figure class="grafico"><div class="tit">Tu saldo con y sin la compra</div>${leyendaSaldo(false, true)}<div class="hueco"></div></figure>
      <div class="bloque"><h3>Mejor momento</h3>
        ${mf.d ? `<p class="gran bien">${corta(mf.d)}</p><p class="sub">Primer día con el colchón intacto.</p>`
        : mf.sinNeg ? `<p class="gran ojo">${corta(mf.sinNeg)}</p><p class="sub">Primer día sin quedar en negativo. Con colchón intacto: ninguno en 180 días.</p>`
        : `<p class="gran mal">Ninguno</p><p class="sub">En 180 días te deja en negativo siempre.</p>`}
        <p class="nota">Sin tarjetas ni día a día.</p></div>
    </div>` : ""}
    <div class="bloque mt"><h3>Compras miradas <span class="tenue" style="font-size:13px;font-weight:600">${NUBE ? "guardadas en tu cuenta" : "en este navegador"}</span></h3>${lista.length ? `<ul class="movs">
      ${lista.map((x, i) => `<li class="mov ${x.r1 ? "ing" : "sin"}"><span class="mi" aria-hidden="true">${x.r1 ? "✓" : "✕"}</span><span class="mc"><span class="mn">${esc(x.que || "Compra")}</span><span class="ms">${TIPOS[x.tipo || "consumo"][0]} · ${FORMAS[x.forma] || ""} · ${esc(x.r2)}</span></span><span class="mv"><b class="num">${eur(aNum(x.importe))}</b><span><button class="enlace" type="button" data-cargar="${i}">Ver</button> · <button class="enlace" type="button" data-quitar="${i}" style="color:var(--critico)">Quitar</button></span></span></li>`).join("")}
      </ul>` : `<p class="sub">Ninguna todavía.</p>`}</div>
    <details class="metodo"><summary>Cómo decide</summary><ul>
      <li><b>¿Puedo pagarlo?</b> El saldo previsto no baja de 0 (hasta ${REGLAS_COMPRA.dias_horizonte} días después o la última cuota).</li>
      <li><b>¿Es buena decisión?</b> Filtro 2 de contexto/05: colchón base (${eur(COLCHON_BASE())}) intacto, sin pagos comprometidos en ${REGLAS_COMPRA.dias_compromisos} días y último mes en positivo. Financiado: endeudamiento ≤ ${C.reglas.tasa_esfuerzo_max_pct} % y margen ≥ ${eur(REGLAS_COMPRA.margen_min_tras_cuota)} (provisional). Inversión: solo con los pasos 1–4 del excedente hechos.</li>
      <li><b>Patrimonio:</b> valor que conservas − lo que te cuesta. El valor de reventa y el ingreso los pones tú (Hipótesis). Si da ingresos, se suman en la previsión desde el mes siguiente.</li>
      <li>«Ahora no»: lo que falla ya fallaba sin la compra. Tarjeta: se carga entera el día ${C.tarjetas.dia_cargo} del mes siguiente.</li></ul></details>`;
  if (r) graficoSaldo(el.querySelector(".hueco"), r.con, {comparar: r.sin});
  const campo = (id, k) => { const i = $(id); if (i) i.oninput = e => { ESTADO.compra[k] = e.target.value; }; };
  [["c-que", "que"], ["c-importe", "importe"], ["c-fecha", "fecha"], ["c-cuota", "cuota"], ["c-plazo", "plazo"], ["c-entrada", "entrada"], ["c-reventa", "reventa"], ["c-ingreso", "ingreso"]].forEach(([i, k]) => campo(i, k));
  el.onclick = e => {
    const f = e.target.closest("[data-forma]"); if (f){ ESTADO.compra.forma = f.dataset.forma; pintar(); return; }
    const ti = e.target.closest("[data-tipo]"); if (ti){ ESTADO.compra.tipo = ti.dataset.tipo; pintar(); return; }
    if (e.target.closest("[data-evaluar]")){ ESTADO.evaluada = true; pintar(); return; }
    if (e.target.closest("[data-guardar]") && r){
      anadirCompra({...c, cuando: corta(HOY), r1: r.r1.ok, r2: r.v2.t}); pintar(); return; }
    const q = e.target.closest("[data-quitar]"); if (q){ quitarCompra(+q.dataset.quitar); pintar(); return; }
    const g = e.target.closest("[data-cargar]"); if (g){ const x = leerCompras()[+g.dataset.cargar]; if (x){ const {cuando, r1, r2, ts, _id, ...resto} = x; ESTADO.compra = {...ESTADO.compra, tipo: "consumo", ...resto}; if (!ESTADO.compra.fecha || leer(ESTADO.compra.fecha) <= BASE) ESTADO.compra.fecha = iso(sumar(BASE, 1)); ESTADO.evaluada = true; pintar(); window.scrollTo(0, 0); } }
  };
  el.onkeydown = e => { if (e.key === "Enter" && e.target.matches("input")){ ESTADO.evaluada = true; pintar(); } };
}

function vistaMovimientos(el){
  const meses = resumenMeses(), F = ESTADO.filtro;
  const lista = MOVS.filter(m => (!F.mes || m.fecha.startsWith(F.mes)) && (!F.cat || m.cat === F.cat) && (!F.tipo || m.tipo === F.tipo) && (!F.q || m.concepto.toLowerCase().includes(F.q.toLowerCase()))).slice().reverse();
  const tot = r2(lista.reduce((a, m) => a + m.importe, 0)), sinCat = MOVS.filter(m => m.cat === "sin_categoria").length;
  const incompletos = meses.filter(m => !m.completo).map(m => `* ${cap(MESES_L[+m.k.slice(5) - 1])} está incompleto: datos hasta el ${corta(m.hasta)}.`).join(" ");
  el.innerHTML = `<h2>Movimientos</h2><p class="intro">Todo lo que ha pasado por la cuenta.</p>
    <figure class="grafico"><div class="leyenda"><span><i style="background:var(--ingreso)"></i>Ingresos corrientes</span><span><i style="background:var(--gasto)"></i>Gastos corrientes</span></div><div class="hueco"></div>
      <p class="pie">${incompletos}</p></figure>
    <div class="controles" style="margin-top:22px">
      <label>Mes <select id="f-mes"><option value="">Todos</option>${meses.map(m => `<option value="${m.k}" ${F.mes === m.k ? "selected" : ""}>${cap(nombreMes(m.k))}</option>`).join("")}</select></label>
      <label>Categoría <select id="f-cat"><option value="">Todas</option>${Object.values(CAT).filter(c => MOVS.some(m => m.cat === c.id)).map(c => `<option value="${c.id}" ${F.cat === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></label>
      <label>Tipo <select id="f-tipo"><option value="">Todos</option>${[["ingreso","Ingresos"],["gasto","Gastos"],["interno","Entre cuentas"],["compra_piso","Compra del piso"]].map(([k, n]) => `<option value="${k}" ${F.tipo === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>Buscar <input type="search" id="f-q" value="${esc(F.q)}" placeholder="Concepto"></label>
    </div>
    <p class="sub">${plural(lista.length, "movimiento", "movimientos")} · suma ${eur(tot, true)}${sinCat ? ` · <span class="mal">${sinCat} sin categoría</span>` : ""}</p>
    <div class="envuelve"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th class="der">Importe</th><th class="der">Saldo</th></tr></thead><tbody>
      ${lista.map(m => `<tr><td class="fecha num">${corta(m.f)}</td><td>${esc(m.concepto)}</td><td class="${m.cat === "sin_categoria" ? "mal" : "tenue"}">${esc(CAT[m.cat].nombre)}</td><td class="der num ${m.importe > 0 ? "positivo" : ""}">${eur(m.importe, true)}</td><td class="der num">${eur(m.saldo)}</td></tr>`).join("")}
    </tbody></table></div>`;
  graficoMeses(el.querySelector(".hueco"), meses);
  const set = (k, v) => { ESTADO.filtro[k] = v; pintar(); };
  $("f-mes").onchange = e => set("mes", e.target.value); $("f-cat").onchange = e => set("cat", e.target.value); $("f-tipo").onchange = e => set("tipo", e.target.value);
  let t; $("f-q").oninput = e => { clearTimeout(t); t = setTimeout(() => { set("q", e.target.value); const i = $("f-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
}

function vistaGastos(el){
  const meses = resumenMeses(); if (!ESTADO.mesGastos) ESTADO.mesGastos = meses[meses.length - 1].k;
  const m = meses.find(x => x.k === ESTADO.mesGastos) || meses[meses.length - 1];
  const items = Object.entries(m.porCat).map(([c, v]) => ({n: CAT[c].nombre, v, c})).filter(i => i.v > 0).sort((a, b) => b.v - a.v);
  const total = m.gastos;
  const diaAdia = new Set((C.variables.find(v => v.id === "dia-a-dia") || {}).categorias || []);
  const totalDia = r2(Object.entries(m.porCat).filter(([c]) => diaAdia.has(c)).reduce((a, [, v]) => a + v, 0));
  const diasMes = m.completo ? m.finMes.getDate() : m.hasta.getDate();
  const comercios = {};
  for (const x of MOVS.filter(x => x.fecha.startsWith(m.k) && x.tipo === "gasto" && x.importe < 0)){ const k = x.concepto.replace(/\d{3,}/g, "").replace(/\s+/g, " ").trim(); comercios[k] = r2((comercios[k] || 0) - x.importe); }
  const top = Object.entries(comercios).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const cats = [...new Set(meses.flatMap(x => Object.keys(x.porCat)))].sort((a, b) => (m.porCat[b] || 0) - (m.porCat[a] || 0));
  el.innerHTML = `<h2>Gastos</h2><p class="intro">En qué se va el dinero, mes a mes.</p>
    <div class="controles"><label>Mes <select id="g-mes">${meses.map(x => `<option value="${x.k}" ${x.k === m.k ? "selected" : ""}>${cap(nombreMes(x.k))}${x.completo ? "" : " (hasta el " + corta(x.hasta) + ")"}</option>`).join("")}</select></label></div>
    <div class="cifras">
      <div><div class="n">Gasto corriente</div><div class="v num">${eur(-total)}</div><div class="d">${m.completo ? "Mes completo" : "Hasta el " + corta(m.hasta)}</div></div>
      <div><div class="n">Ingresos corrientes</div><div class="v num positivo">${eur(m.ingresos, true)}</div><div class="d">${Object.entries(m.porIng).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => CAT[c].nombre).join(", ") || "—"}</div></div>
      <div><div class="n">Resultado del mes</div><div class="v num ${m.ahorro < 0 ? "mal" : "bien"}">${eur(m.ahorro, true)}</div><div class="d">Tasa de ahorro: ${tasa(m)}</div></div>
      <div><div class="n">Día a día</div><div class="v num">${eur(-totalDia)}</div><div class="d">${eur(r2(totalDia / diasMes))} de media por día (${diasMes} días)</div></div>
    </div>
    <div class="mitades">
      <div class="bloque"><h3>Por categoría</h3><figure class="grafico limpio"><div class="hueco"></div></figure>
        <p class="sub">Las tarjetas salen como un solo cargo el día 5.</p></div>
      <div class="bloque"><h3>Dónde más</h3><div class="envuelve"><table><tbody>${top.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="der num">${eur(-v)}</td></tr>`).join("")}</tbody></table></div></div>
    </div>
    <div class="bloque mt"><h3>Mes a mes</h3><div class="envuelve"><table><thead><tr><th>Categoría</th>${meses.map(x => `<th class="der">${cap(MESES_L[+x.k.slice(5) - 1])}${x.completo ? "" : "*"}</th>`).join("")}</tr></thead><tbody>
      ${cats.map(c => `<tr><td>${esc(CAT[c].nombre)}</td>${meses.map(x => `<td class="der num">${x.porCat[c] ? eur(-x.porCat[c]) : "—"}</td>`).join("")}</tr>`).join("")}
      <tr class="total"><td>Total gasto corriente</td>${meses.map(x => `<td class="der num">${eur(-x.gastos)}</td>`).join("")}</tr>
      <tr><td>Ingresos corrientes</td>${meses.map(x => `<td class="der num positivo">${eur(x.ingresos, true)}</td>`).join("")}</tr>
      <tr><td><b>Resultado</b></td>${meses.map(x => `<td class="der num ${x.ahorro < 0 ? "mal" : "bien"}"><b>${eur(x.ahorro, true)}</b></td>`).join("")}</tr>
      <tr><td class="tenue">Entre cuentas tuyas (neto)</td>${meses.map(x => `<td class="der num tenue">${x.interno ? eur(x.interno, true) : "—"}</td>`).join("")}</tr>
      <tr><td class="tenue">Compra del piso (neto)</td>${meses.map(x => `<td class="der num tenue">${x.compra ? eur(x.compra, true) : "—"}</td>`).join("")}</tr>
    </tbody></table></div><p class="sub">* Mes incompleto. Las dos últimas filas no cuentan en el resultado.</p></div>`;
  graficoBarras(el.querySelector(".hueco"), items, total, "Gasto por categoría en " + nombreMes(m.k));
  $("g-mes").onchange = e => { ESTADO.mesGastos = e.target.value; pintar(); };
}

function vistaRecurrentes(el){
  const p = prevision(400), fm = fijosMensuales();
  const prox = nombre => { const e = p.ev.find(e => e.concepto === nombre); return e ? corta(e.fecha) : "—"; };
  const filas = C.fijos.map(f => ({f, anual: f.importe == null || f.activo === false ? null : r2(f.importe * (f.meses ? f.meses.length : 12))}));
  const anualGastos = r2(filas.filter(x => x.f.tipo === "gasto" && x.anual != null).reduce((a, x) => a + x.anual, 0));
  const anualIngresos = r2(filas.filter(x => x.f.tipo === "ingreso" && x.anual != null).reduce((a, x) => a + x.anual, 0));
  const susc = {};
  for (const m of MOVS.filter(m => m.cat === "suscripciones")){ const k = m.concepto.replace(/^tj-/i, ""); (susc[k] ||= []).push(m); }
  const tarj = {}, reT = new RegExp(C.tarjetas.patron, "i");
  for (const m of MOVS.filter(m => reT.test(m.concepto))) tarj[m.fecha.slice(0, 7)] = r2((tarj[m.fecha.slice(0, 7)] || 0) - m.importe);
  const mesesT = Object.keys(tarj).sort();
  const liq = (C.tarjetas.liquidaciones || []).find(l => leer(l.cargo) > BASE);
  el.innerHTML = `<h2>Recurrentes</h2><p class="intro">Lo que se repite y lo que cuesta al año.</p>
    <div class="cifras">
      <div><div class="n">Ingresos fijos al año</div><div class="v num positivo">${eur(anualIngresos, true)}</div><div class="d">${eur(fm.ing)} al mes</div></div>
      <div><div class="n">Gastos fijos al año</div><div class="v num">${eur(-anualGastos)}</div><div class="d">Sin tarjetas ni día a día</div></div>
      <div><div class="n">Tarjetas: cargos ya pasados</div><div class="v num">${mesesT.length ? eur(-tarj[mesesT[mesesT.length - 1]]) : "—"}</div><div class="d">${mesesT.map(k => cap(MESES_L[+k.slice(5) - 1]) + ": " + eur(tarj[k])).join(" · ") || "Ninguno"}</div></div>
      <div><div class="n">Próximo cargo de tarjetas</div><div class="v num ${liq && liq.importe != null ? "" : "mal"}">${liq && liq.importe != null ? eur(-liq.importe) : "¿?"}</div><div class="d">${prox(C.tarjetas.nombre)}: ${liq && liq.importe != null ? "liquidación " + esc(liq.fuente) : "falta la liquidación"}</div></div>
    </div>
    <div class="bloque"><h3>Fijos</h3><div class="envuelve"><table><thead><tr><th>Concepto</th><th>Cuándo</th><th class="der">Importe</th><th>Certeza</th><th>Próximo</th><th class="der">Al año</th></tr></thead><tbody>
      ${filas.map(({f, anual}) => `<tr class="${f.activo !== false && f.importe == null ? "sin" : ""}"><td><b>${esc(f.nombre)}</b>${f.nota || f.revision ? `<span class="etq">${esc(f.revision ? f.revision.nota : f.nota)}</span>` : ""}</td>
        <td>${f.meses ? "Día " + f.dia + " de " + f.meses.map(x => MESES[x - 1]).join(", ") : "Día " + f.dia + " de cada mes"}</td>
        <td class="der num ${f.activo === false ? "tenue" : f.tipo === "ingreso" ? "positivo" : ""}">${f.activo === false ? "Inactivo" : f.importe == null ? "¿?" : eur(f.tipo === "ingreso" ? f.importe : -f.importe, true)}</td>
        <td>${f.activo === false ? "—" : cert(f.certeza)}</td><td class="num">${f.activo === false ? "—" : prox(f.nombre)}</td><td class="der num">${anual == null ? "—" : eur(f.tipo === "ingreso" ? anual : -anual, true)}</td></tr>`).join("")}
      <tr class="sin"><td><b>${esc(C.tarjetas.nombre)}</b><span class="etq">${esc(C.tarjetas.nota)}</span></td><td>Día ${C.tarjetas.dia_cargo} de cada mes</td><td class="der mal">¿?</td><td>${cert("sin_importe")}</td><td class="num">${prox(C.tarjetas.nombre)}</td><td class="der">—</td></tr>
    </tbody></table></div></div>
    <div class="mitades">
      <div class="bloque"><h3>Suscripciones vistas en la cuenta</h3>${Object.keys(susc).length ? `<ul class="lista">${Object.entries(susc).map(([k, l]) => `<li><span class="nom">${esc(k)}</span><span class="val num">${eur(l[l.length - 1].importe)}</span><span class="det">${plural(l.length, "cargo visto", "cargos vistos")}, el último el ${corta(l[l.length - 1].f)}. ${l.length < 2 ? "Con un solo cargo no se puede saber si es mensual: no se suma a los fijos." : ""}</span></li>`).join("")}</ul>` : `<p class="sub">Ninguna.</p>`}</div>
      <div class="bloque"><h3>Trimestrales, anuales y renovaciones</h3><ul class="lista">${C.fijos.filter(f => f.meses).map(f => `<li><span class="nom">${esc(f.nombre)}</span><span class="val num">${eur(-f.importe)}</span><span class="det">${f.meses.map(x => MESES_L[x - 1]).join(", ")}. Próximo: ${prox(f.nombre)}</span></li>`).join("")}
        ${C.vencimientos.filter(v => v.tipo === "seguro" || v.tipo === "impuesto").map(v => `<li><span class="nom">${esc(v.nombre)}</span><span class="val ${v.fecha ? "" : "mal"}">${v.fecha ? corta(leer(v.fecha)) : "Falta fecha"}</span><span class="det">${esc(v.nota || "")}</span></li>`).join("")}</ul></div>
    </div>`;
}

// Escalera del excedente (contexto/05, «Orden de uso del excedente mensual»). Solo usa datos reales o de config.
function escaleraExcedente(p){
  const colchon = COLCHON_BASE(), fam = C.deudas.filter(d => ["madre", "abuela"].includes(d.id));
  const famTotal = r2(fam.reduce((a, d) => a + d.pendiente, 0));
  const compromisos = C.pendientes.filter(x => x.importe != null && x.clase !== "cobro");
  const sinImp = C.pendientes.filter(x => x.importe == null);
  const paso1 = p.min.saldo >= 0;
  const paso2 = p.min.saldo >= colchon;
  const pasos = [
    {t: "Pagos comprometidos", e: paso1 ? "Cubierto" : "No cubierto", c: paso1 ? "hecho" : "curso",
     x: `${eur(r2(compromisos.reduce((a, x) => a + x.importe, 0)))} en honorarios`},
    {t: "Colchón base", e: paso2 ? "Completo" : eur(Math.max(0, p.min.saldo)) + " de " + eur(colchon), c: paso2 ? "hecho" : paso1 ? "curso" : "bloq", prog: Math.max(0, Math.min(1, p.min.saldo / colchon)),
     x: `${C.reglas.colchon_meses_estable || 3} meses de gastos fijos`},
    {t: "Devolución a la familia", e: eur(famTotal) + " pendientes", c: paso2 ? "curso" : "bloq",
     x: `${fam.map(d => cap(d.nombre.replace("Devolución a mi ", "")) + " " + eur0(d.pendiente)).join(" · ")} · cuota sin decidir`},
    {t: "Colchón específico del piso Viriato", e: "Sin decidir", c: "bloq", x: "Vacíos y reparaciones"},
    {t: "Ahorro para la siguiente operación", e: "—", c: "bloq", x: "Por ejemplo, la casa propia"},
    {t: "Inversión financiera", e: "Bloqueada", c: "bloq", x: "Solo con 1–4 completos"},
  ];
  const actual = pasos.findIndex(s => s.c !== "hecho");
  return {actual, html: `<ol class="escalera">${pasos.map((s, i) => `<li class="${s.c}"><span class="t">${esc(s.t)}${i === actual ? ` <span class="chip" style="background:var(--aviso-suave);color:var(--aviso)">Ahora toca</span>` : ""}</span><span class="e ${s.c === "hecho" ? "bien" : s.c === "curso" ? "ojo" : "tenue"}">${esc(s.e)}</span><span class="x">${esc(s.x)}</span>${s.prog != null && s.c !== "hecho" ? `<div class="medidor ${s.prog > .5 ? "medio" : ""}" style="height:8px"><i style="width:${s.prog * 100}%"></i></div>` : ""}</li>`).join("")}</ol>`};
}

function medidorRatio(r){
  if (r.v == null) return `<div class="ratio"><div class="cab"><span>${esc(r.n)}</span><span class="v">—</span></div><div class="f">${esc(r.f)}</div></div>`;
  const tope = Math.max(100, r.v * 1.1), malo = r.lim != null && r.v > r.lim, cerca = r.lim != null && !malo && r.v > r.lim * .85;
  return `<div class="ratio"><div class="cab"><span>${esc(r.n)}</span><span class="v num ${malo ? "mal" : cerca ? "ojo" : ""}">${pct(r.v)}</span></div>
    <div class="medidor ${malo ? "" : cerca ? "medio" : "ok"}" role="img" aria-label="${esc(r.n)} ${pct(r.v)}${r.lim != null ? ", límite " + r.lim + " %" : ""}"><i style="width:${r.v / tope * 100}%;${r.lim == null ? "background:var(--serie)" : ""}"></i>${r.lim != null ? `<b style="left:${r.lim / tope * 100}%" title="Límite ${r.lim} %"></b>` : ""}</div>
    <div class="f">${esc(r.f)}${r.lim != null ? ` · Límite ${r.lim} %${malo ? " · <b class='mal'>por encima</b>" : cerca ? " · cerca del límite" : ""}` : " · Informativo"}</div></div>`;
}

function vistaGlobal(el){
  const liq = ULT.saldo, bienes = C.bienes, deudas = C.deudas;
  const compromisos = C.pendientes.filter(p => p.importe != null && p.clase !== "cobro");
  const activos = r2(liq + bienes.filter(b => b.valor != null).reduce((a, b) => a + b.valor, 0));
  const pasivos = r2(deudas.reduce((a, d) => a + d.pendiente, 0) + compromisos.reduce((a, p) => a + p.importe, 0));
  const neto = r2(activos - pasivos), sinValor = bienes.filter(b => b.valor == null);
  const fm = fijosMensuales(), p = prevision(ESTADO.horizonte), base = C.reglas.gastos_fijos_mensuales_colchon;
  const meses = resumenMeses(), colMeses = Math.max(0, p.min.saldo) / base, objetivo = C.reglas.colchon_meses_estable || 3;
  const hip = deudas.find(d => d.id === "hipoteca"), piso = bienes.find(b => b.id === "piso");
  const viv = C.fijos.filter(f => ["hipoteca", "comunidad"].includes(f.id) && f.importe != null).reduce((a, f) => a + f.importe, 0);
  const ratios = [
    {n: "Servicio de la deuda", v: fm.ing ? fm.deuda / fm.ing * 100 : null, lim: C.reglas.tasa_esfuerzo_max_pct, f: `Cuotas ÷ ingresos fijos`},
    {n: "Gastos fijos sobre ingresos", v: fm.ing ? fm.gas / fm.ing * 100 : null, lim: null, f: `Gastos fijos ÷ ingresos fijos`},
    {n: "Vivienda sobre ingresos", v: fm.ing ? viv / fm.ing * 100 : null, lim: C.reglas.tasa_esfuerzo_max_pct, f: `Hipoteca + comunidad ÷ ingresos fijos`},
    {n: "LTV del piso", v: hip && piso ? hip.pendiente / piso.valor * 100 : null, lim: 80, f: "Hipoteca pendiente ÷ precio de compra"},
  ];
  const esc6 = escaleraExcedente(p);
  el.innerHTML = `<h2>Global</h2><p class="intro">Patrimonio, salud financiera y qué hacer con lo que sobre.</p>
    <div class="veredicto ${neto < 0 ? "malo" : "bueno"}"><h2>Patrimonio neto: <span class="cifra">${eur(neto)}</span></h2>
      <p>Piso a precio de compra.${sinValor.length ? ` Faltan ${plural(sinValor.length, "dato", "datos")}.` : ""}</p></div>
    <figure class="grafico mt"><div class="tit">Lo que tienes frente a lo que debes</div><div class="hueco"></div></figure>
    <div class="mitades">
      <div class="bloque"><h3>Lo que tienes <span class="num">${eur(activos)}</span></h3><ul class="lista">
        <li><span class="nom">Cuenta Caja Rural</span><span class="val num">${eur(liq)}</span><span class="det">Real, a ${corta(BASE)}</span></li>
        ${bienes.map(b => `<li><span class="nom">${esc(b.nombre)}</span><span class="val num ${b.valor == null ? "mal" : ""}">${b.valor == null ? "Falta dato" : eur(b.valor)}</span><span class="det">${esc(b.nota || "")}${b.liquido === false ? ". No es líquido." : ""}</span></li>`).join("")}</ul></div>
      <div class="bloque"><h3>Lo que debes <span class="num">${eur(-pasivos)}</span></h3><ul class="lista">
        ${deudas.map(d => `<li><span class="nom">${esc(d.nombre)}</span><span class="val num">${eur(-d.pendiente)}</span><span class="det">${esc(d.nota || "")}${d.a_fecha ? ". A " + corta(leer(d.a_fecha)) + "." : ""}</span></li>`).join("")}
        ${compromisos.map(c => `<li><span class="nom">${esc(c.nombre)}</span><span class="val num">${eur(-c.importe)}</span><span class="det">Comprometido, pendiente de cargo</span></li>`).join("")}</ul></div>
    </div>
    <div class="mitades">
      <div class="bloque"><h3>Qué hacer con lo que sobre <span class="tenue" style="font-size:13px;font-weight:600">orden de contexto/05</span></h3>${esc6.html}</div>
      <div>
        <div class="bloque"><h3>Colchón</h3>
          <p style="font-size:26px;font-weight:800" class="${colMeses < objetivo ? "mal" : "bien"} num">${colMeses.toFixed(1).replace(".", ",")} <span style="font-size:16px;font-weight:600" class="tenue">de ${objetivo} meses</span></p>
          <div class="medidor ${colMeses >= objetivo ? "ok" : colMeses >= objetivo / 2 ? "medio" : ""}" role="img" aria-label="${colMeses.toFixed(1)} de ${objetivo} meses"><i style="width:${Math.min(100, colMeses / objetivo * 100)}%"></i></div>
          <p class="sub">Día más justo ÷ ${eur(base)} de fijos al mes.</p></div>
        <div class="bloque"><h3>Ratios</h3>${ratios.map(medidorRatio).join("")}</div>
      </div>
    </div>
    <div class="bloque mt"><h3>Resultado real por mes</h3><div class="envuelve"><table><thead><tr><th>Mes</th><th class="der">Ingresos</th><th class="der">Gastos</th><th class="der">Resultado</th><th class="der">Tasa de ahorro</th></tr></thead><tbody>
      ${meses.map(x => `<tr><td>${cap(nombreMes(x.k))}${x.completo ? "" : ` <span class="tenue">(hasta el ${corta(x.hasta)})</span>`}</td><td class="der num positivo">${eur(x.ingresos, true)}</td><td class="der num">${eur(-x.gastos)}</td><td class="der num ${x.ahorro < 0 ? "mal" : "bien"}"><b>${eur(x.ahorro, true)}</b></td><td class="der num ${x.completo && x.ahorro < 0 ? "mal" : "tenue"}">${tasa(x)}</td></tr>`).join("")}
    </tbody></table></div><p class="sub">Sin la compra del piso ni los movimientos entre cuentas tuyas.</p></div>`;
  graficoBarras(el.querySelector(".hueco"), [{n: "Lo que tienes", v: activos, color: "var(--ingreso)"}, {n: "Lo que debes", v: pasivos, color: "var(--gasto)"}], 0, "Lo que tienes frente a lo que debes");
}

function vistaFaltan(el){
  const items = datosQueFaltan(), grupos = [...new Set(items.map(i => i.grupo))];
  el.innerHTML = `<h2>Datos que faltan</h2><p class="intro">La app no inventa nada: díselo al agente y lo añade.</p>
    <div class="mitades" style="margin-top:0">${grupos.map(g => `<div class="bloque"><h3>${esc(g)} <span class="chip">${items.filter(i => i.grupo === g).length}</span></h3><ol class="faltan">${items.filter(i => i.grupo === g).map(i => `<li><span class="t">${esc(i.t)}</span>${i.q ? `<span class="q">${esc(i.q)}</span>` : ""}${i.i ? `<span class="i">${esc(i.i)}</span>` : ""}</li>`).join("")}</ol></div>`).join("")}</div>`;
}

const VISTAS = {inicio: vistaInicio, calendario: vistaCalendario, prevision: vistaPrevision, comprar: vistaComprar, movimientos: vistaMovimientos, gastos: vistaGastos, recurrentes: vistaRecurrentes, global: vistaGlobal, faltan: vistaFaltan};
let ACTUAL = "inicio";

function pintar(){
  const dias = entre(BASE, HOY), fr = $("frescura");
  fr.textContent = "Datos hasta el " + corta(BASE) + (dias > 0 ? ", hace " + plural(dias, "día", "días") : "") + ". Generado el " + D.generado.slice(8, 10) + "/" + D.generado.slice(5, 7) + ".";
  fr.classList.toggle("vieja", dias > 7);
  const nFaltan = datosQueFaltan().length;
  $("nav").innerHTML = PESTANAS.map(([k, n]) => `<button role="tab" type="button" data-tab="${k}" aria-selected="${k === ACTUAL}"${k === ACTUAL ? "" : ' tabindex="-1"'}>${icono(k)}${n}${k === "faltan" && nFaltan ? `<span class="cuenta" aria-label="${nFaltan} pendientes">${nFaltan}</span>` : ""}</button>`).join("");
  // Móvil: barra de pestañas abajo con las cuatro principales y «Más» para el resto
  const MOVIL = [["inicio", "Inicio"], ["prevision", "Previsión"], ["comprar", "Comprar"], ["gastos", "Gastos"]];
  const enMas = !MOVIL.some(([k]) => k === ACTUAL);
  $("barra").innerHTML = MOVIL.map(([k, n]) => `<button type="button" data-tab="${k}" aria-current="${k === ACTUAL ? "page" : "false"}">${icono(k)}<span>${n}</span></button>`).join("")
    + `<button type="button" data-mas aria-current="${enMas ? "page" : "false"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg><span>Más</span>${nFaltan ? `<i class="punto-rojo"></i>` : ""}</button>`;
  $("hoja-lista").innerHTML = PESTANAS.filter(([k]) => !MOVIL.some(([m]) => m === k)).map(([k, n]) => `<button type="button" data-tab="${k}" aria-current="${k === ACTUAL ? "page" : "false"}">${icono(k)}<span>${n}</span>${k === "faltan" && nFaltan ? `<span class="cuenta">${nFaltan}</span>` : ""}</button>`).join("");
  $("hoja").hidden = true;
  $("app").innerHTML = `<section class="vista" id="v-${ACTUAL}" role="tabpanel"></section>`;
  VISTAS[ACTUAL]($("v-" + ACTUAL));
}

/* =========================================================
   ARRANQUE
   ========================================================= */
if (!D || !MOVS.length || !C){
  $("app").innerHTML = `<p class="vacio">No encuentro los datos. Esta página necesita <b>datos.js</b> en la misma carpeta. Pídele al agente: «genera datos.js con generar_datos.py».</p>`;
} else {
  const deHash = () => { const h = location.hash.slice(1); if (VISTAS[h]) ACTUAL = h; };
  deHash();
  window.addEventListener("hashchange", () => { deHash(); pintar(); window.scrollTo(0, 0); });
  document.addEventListener("click", e => {
    if (e.target.closest("[data-mas]")){ $("hoja").hidden = !$("hoja").hidden; return; }
    if (e.target.id === "hoja"){ $("hoja").hidden = true; return; }
    const t = e.target.closest("[data-tab],[data-ir]"); if (t){ $("hoja").hidden = true; location.hash = t.dataset.tab || t.dataset.ir; return; }
    const h = e.target.closest("[data-horizonte]"); if (h){ ESTADO.horizonte = +h.dataset.horizonte; guardar(); pintar(); return; }
    const c = e.target.closest("[data-cal]"); if (c){
      if (c.dataset.cal === "hoy") ESTADO.mesCal = ym(HOY);
      else { const [y, m] = ESTADO.mesCal.split("-").map(Number); ESTADO.mesCal = ym(new Date(y, m - 1 + Number(c.dataset.cal), 1)); }
      pintar(); return; }
    const d = e.target.closest("[data-dia]"); if (d){ ESTADO.diaSel = d.dataset.dia; pintar(); document.querySelector(`[data-dia="${d.dataset.dia}"]`)?.focus(); }
  });
  $("nav").addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const i = PESTANAS.findIndex(([k]) => k === ACTUAL), n = PESTANAS[(i + (e.key === "ArrowRight" ? 1 : -1) + PESTANAS.length) % PESTANAS.length][0];
    location.hash = n; setTimeout(() => document.querySelector(`[data-tab="${n}"]`)?.focus(), 0);
  });
  let t, ancho = window.innerWidth;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (window.innerWidth !== ancho){ ancho = window.innerWidth; pintar(); } }, 150); });
  pintar();
}
