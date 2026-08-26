export const dynamic = 'force-dynamic';

import { getContacts, getLastUpdated } from './actions';
import ClientPage from './ClientPage';

export default async function Home() {
  const contacts = await getContacts();
  const lastUpdated = await getLastUpdated();
  return <ClientPage initialContacts={contacts} lastUpdated={lastUpdated} />;
}
