export const dynamic = 'force-dynamic';

import { getContacts, getLastUpdated, getDepartmentDescriptions } from './actions';
import ClientPage from './ClientPage';

export default async function Home() {
  const contacts = await getContacts();
  const lastUpdated = await getLastUpdated();
  const initialDescriptions = await getDepartmentDescriptions();
  return <ClientPage initialContacts={contacts} lastUpdated={lastUpdated} initialDescriptions={initialDescriptions} />;
}
