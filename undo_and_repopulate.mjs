import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const wrongWorkshopId = '5757d7a2-7315-48a8-b0d8-1fb58222bd9e';
  
  console.log(`🧹 Undoing changes for workshop: ${wrongWorkshopId}`);
  
  // Delete mock orders by note
  const { error: oErr } = await supabase.from('orders')
    .delete()
    .eq('workshop_id', wrongWorkshopId)
    .eq('notes', 'Mock data generated for screenshot');
  if (oErr) console.error("Error deleting orders:", oErr);
  else console.log("Mock orders deleted.");

  // Delete mock clients
  const mockClientNames = ["João Silva", "Maria Oliveira", "Carlos Santos", "Ana Souza", "Empresa XPTO"];
  const { data: clientsObj, error: cErr } = await supabase.from('clients')
    .delete()
    .eq('workshop_id', wrongWorkshopId)
    .in('name', mockClientNames);
  if (cErr) console.error("Error deleting clients:", cErr);
  else console.log("Mock clients deleted.");

  console.log("✅ Cleanup complete.");

  // Find correct workshop
  console.log("🔎 Finding correct workshop starting with '03b55752'...");
  const { data: allWorkshops, error: wErr } = await supabase.from('workshops').select('id, name');
  const workshops = allWorkshops ? allWorkshops.filter(w => w.id.startsWith('03b55752')) : [];
    
  if (wErr || !workshops || workshops.length === 0) {
    console.error("❌ Could not find the correct workshop:", wErr);
    return;
  }
  
  const correctWorkshopId = workshops[0].id;
  console.log(`✅ Found correct workshop: ${correctWorkshopId} (${workshops[0].name})`);

  console.log("🚀 Repopulating correct workshop...");
  const clients = mockClientNames.map((name, i) => ({
    workshop_id: correctWorkshopId, name, phone: `1199999999${i}`
  }));

  const { data: insertedClients, error: icErr } = await supabase.from('clients').insert(clients).select();
  if (icErr) { console.error("Error inserting clients:", icErr); return; }
  
  const vehicles = insertedClients.map((c, i) => ({
    workshop_id: correctWorkshopId,
    client_id: c.id,
    plate: `ABC123${i}`,
    brand: ["Honda", "Toyota", "Ford", "Chevrolet", "BMW"][i],
    model: ["Civic", "Corolla", "Mustang", "Onix", "X1"][i],
    year: 2018 + i
  }));
  
  const { data: insertedVehicles, error: ivErr } = await supabase.from('vehicles').insert(vehicles).select();
  if (ivErr) { console.error("Error inserting vehicles:", ivErr); return; }

  const orders = [];
  const today = new Date();
  for (let i = 0; i < 25; i++) {
    const client = insertedClients[i % insertedClients.length];
    const vehicle = insertedVehicles[i % insertedVehicles.length];
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() - (i * 1.5));
    const amount = 800 + (Math.random() * 3000);
    const status = i < 15 ? "entregue" : (i < 20 ? "em_manutencao" : "recebido");
    const paid = i < 15;
    orders.push({
      workshop_id: correctWorkshopId,
      client_id: client.id,
      vehicle_id: vehicle.id,
      amount: amount.toFixed(2),
      status: status,
      paid: paid,
      paid_at: paid ? orderDate.toISOString() : null,
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString(),
      notes: "Mock data generated for screenshot"
    });
  }

  const { error: ioErr } = await supabase.from('orders').insert(orders);
  if (ioErr) { console.error("Error inserting orders:", ioErr); return; }

  console.log("✅ Mock data inserted into CORRECT workshop!");
}

run();
