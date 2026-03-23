import { Client } from '@microsoft/microsoft-graph-client';
import { getGraphAccessToken } from './tokenProvider';

export async function getGraphClient(): Promise<Client> {
  const accessToken = await getGraphAccessToken();
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
