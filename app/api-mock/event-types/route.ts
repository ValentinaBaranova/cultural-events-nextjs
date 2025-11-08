import { NextRequest } from 'next/server';

// Simple localized mock of event types aligning with seeded data
const TYPES = {
  en: [
    { slug: 'teatro', name: 'Theater' },
    { slug: 'concierto', name: 'Concert' },
    { slug: 'milonga', name: 'Milonga' },
    { slug: 'exhibicion', name: 'Exhibition' },
    { slug: 'festival', name: 'Festival' },
    { slug: 'cine', name: 'Cinema' },
    { slug: 'charla', name: 'Talk' },
    { slug: 'taller', name: 'Workshop' },
    { slug: 'performance', name: 'Performance' },
    { slug: 'espectaculo-de-danza', name: 'Dance performance' },
    { slug: 'presentacion-de-libro', name: 'Book presentation' },
    { slug: 'jam', name: 'Jam' },
    { slug: 'feria', name: 'Fair' },
    { slug: 'visita-guiada', name: 'Guided tour' },
    { slug: 'mercado', name: 'Market' },
    { slug: 'competencia', name: 'Competition' },
    { slug: 'otro', name: 'Other' },
  ],
  es: [
    { slug: 'teatro', name: 'Teatro' },
    { slug: 'concierto', name: 'Concierto' },
    { slug: 'milonga', name: 'Milonga' },
    { slug: 'exhibicion', name: 'Exhibición' },
    { slug: 'festival', name: 'Festival' },
    { slug: 'cine', name: 'Cine' },
    { slug: 'charla', name: 'Charla' },
    { slug: 'taller', name: 'Taller' },
    { slug: 'performance', name: 'Performance' },
    { slug: 'espectaculo-de-danza', name: 'Espectáculo de danza' },
    { slug: 'presentacion-de-libro', name: 'Presentación de libro' },
    { slug: 'jam', name: 'Jam' },
    { slug: 'feria', name: 'Feria' },
    { slug: 'visita-guiada', name: 'Visita guiada' },
    { slug: 'mercado', name: 'Mercado' },
    { slug: 'competencia', name: 'Competencia' },
    { slug: 'otro', name: 'Otro' },
  ],
} as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const localeParam = (searchParams.get('locale') || 'es').toLowerCase();
  const locale = localeParam.startsWith('en') ? 'en' : 'es';
  return Response.json(TYPES[locale]);
}
