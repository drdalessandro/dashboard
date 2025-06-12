// Server-side translation loading
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }];
}
