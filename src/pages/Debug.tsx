import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Debug() {
  const { user, workshopId } = useAuth();
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  useEffect(() => {
    async function runTest() {
      if (!user) {
        addLog('Not logged in.');
        return;
      }
      addLog('User ID: ' + user.id);
      addLog('Workshop ID from useAuth: ' + String(workshopId));

      const { data: members, error: membersErr } = await supabase.from('workshop_members').select('*');
      addLog('workshop_members result: ' + JSON.stringify(members) + ' | Err: ' + JSON.stringify(membersErr));

      if (workshopId) {
        const { data: clients, error: clientsErr } = await supabase.from('clients').select('*');
        addLog('clients select result: ' + JSON.stringify(clients) + ' | Err: ' + JSON.stringify(clientsErr));

        const { error: insertErr } = await supabase.from('clients').insert({
          workshop_id: workshopId,
          name: 'Debug Client Test'
        });
        addLog('clients insert error: ' + JSON.stringify(insertErr));
      }
    }
    runTest();
  }, [user, workshopId]);

  return (
    <div className='p-8 font-mono text-sm space-y-2 whitespace-pre-wrap bg-black text-green-400 min-h-screen'>
      <h1 className='text-xl font-bold mb-4'>DEBUG LOG</h1>
      {log.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}
