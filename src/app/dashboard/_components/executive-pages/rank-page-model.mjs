import { validMemberTree } from '../../../../lib/member-read.mjs';

const text = (value, limit) => typeof value === 'string' && Boolean(value.trim()) && value.length <= limit;

// A successful position response must explicitly distinguish no assigned rank
// from an incomplete payload. Neither a catalog nor a browser hint is proof.
export function validRankPosition(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !validMemberTree(data)) return false;
  if (!data.positioned) return true;
  const rank = data.me.rank;
  return rank === null || Boolean(rank && typeof rank === 'object' && !Array.isArray(rank)
    && text(rank.code, 100) && text(rank.name, 200));
}

const metric = (value, detail) => ({ value, detail });
const money = value => `$${Number(value).toLocaleString('en-US')}`;

export function rankPagePresentation(catalog, position) {
  const ranks = catalog.data?.ranks || [];
  const personalReady = !position.loading && !position.error && validRankPosition(position.data);
  const positioned = personalReady && position.data.positioned;
  const myRank = positioned ? position.data.me.rank : null;
  const currentIndex = myRank ? ranks.findIndex(rank => rank.code === myRank.code) : -1;
  const catalogReady = !catalog.loading && !catalog.error && Boolean(catalog.data);
  const knownRank = positioned && (!myRank || currentIndex !== -1);
  const next = catalogReady && ranks.length && knownRank ? ranks[currentIndex + 1] : null;
  const maximum = catalogReady && ranks.length > 0 && knownRank && myRank && currentIndex === ranks.length - 1;
  const personalUnavailable = position.error?.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
    : position.error?.status === 403 ? 'No tienes permiso para consultar tu rango.'
      : 'No pudimos consultar tu rango. Vuelve a abrir esta página para reintentar.';
  const current = position.loading ? metric('—', 'Consultando tu rango actual')
    : !personalReady ? metric('No disponible', personalUnavailable)
      : !positioned ? metric('Sin posición', 'La red aún no confirma una posición para tu cuenta')
        : metric(myRank?.name || 'Sin rango', myRank ? 'Confirmado por la red' : 'La red no tiene un rango asignado');
  const nextMetric = position.loading || catalog.loading ? metric('—', 'Consultando la carrera de rangos')
    : !personalReady ? metric('No disponible', personalUnavailable)
      : !catalogReady ? metric('No disponible', 'No pudimos consultar el catálogo. Vuelve a abrir esta página para reintentar.')
        : !ranks.length ? metric('No disponible', 'El catálogo está vacío; no confirma que hayas alcanzado el máximo')
          : !positioned ? metric('Sin posición', 'Se necesita una posición confirmada por la red')
            : !knownRank ? metric('Por revisar', 'Tu rango actual no figura en el catálogo consultado')
              : maximum ? metric('Máximo', 'Último rango del catálogo oficial')
                : next ? metric(next.name_es, 'En la carrera de rangos') : metric('No disponible', 'No se confirmó el siguiente rango');
  return {
    current,
    next: nextMetric,
    bonus: metric(next ? money(next.bonus_amount_usd) : '—', next ? 'Al calificar; no es un saldo disponible' : 'Sin bono siguiente confirmado'),
    catalog: catalog.loading ? metric('—', 'Consultando el catálogo') : catalogReady
      ? metric(String(ranks.length), ranks.length ? 'Catálogo oficial' : 'Catálogo vacío; sincronización pendiente')
      : metric('No disponible', 'No pudimos consultar el catálogo'),
    rows: catalogReady ? ranks.map((rank, index) => [rank.name_es,
      !personalReady || !positioned ? 'Sin confirmar' : !knownRank ? 'Por revisar'
        : index <= currentIndex ? index === currentIndex ? 'Actual' : 'Alcanzado' : 'Pendiente',
      Number(rank.required_points).toLocaleString('en-US'), money(rank.bonus_amount_usd),
    ]) : [],
  };
}
