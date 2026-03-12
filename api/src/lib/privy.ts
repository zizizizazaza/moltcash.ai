import { PrivyClient } from '@privy-io/node';

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'cmm5pmk0d00sf0dl1sq4q7r1j';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';

if (!PRIVY_APP_SECRET) {
    console.warn('⚠️  PRIVY_APP_SECRET not set! Auth verification will fail.');
}

const privy = new PrivyClient({
    appId: PRIVY_APP_ID,
    appSecret: PRIVY_APP_SECRET,
});

export { privy, PRIVY_APP_ID };
export default privy;
