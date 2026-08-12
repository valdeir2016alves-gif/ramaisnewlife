export const dynamic = 'force-dynamic';

import { getContacts } from './actions';
import ClientPage from './ClientPage';

export default async function Home() {
  const contacts = await getContacts();
  return <ClientPage initialContacts={contacts} />;
}
