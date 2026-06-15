import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populate() {
  console.log("Fetching a workshop...");
  const { data: workshops, error: wError } = await supabase.from('workshops').select('id').limit(1);
  
  if (wError || !workshops || workshops.length === 0) {
    console.error("No workshops found. Create an account first.");
    return;
  }
  
  const workshopId = workshops[0].id;
  console.log(`Using workshop ID: ${workshopId}`);

  console.log("Generating fake clients...");
  const clients = [
    { workshop_id: workshopId, name: "João Silva", phone: "11999999999" },
    { workshop_id: workshopId, name: "Maria Oliveira", phone: "11988888888" },
    { workshop_id: workshopId, name: "Carlos Santos", phone: "11977777777" },
    { workshop_id: workshopId, name: "Ana Souza", phone: "11966666666" },
    { workshop_id: workshopId, name: "Empresa XPTO", phone: "11955555555" }
  ];

  const { data: insertedClients, error: cError } = await supabase.from('clients').insert(clients).select();
  if (cError) {
    console.error("Error inserting clients:", cError);
    return;
  }
  
  console.log("Generating fake vehicles...");
  const vehicles = insertedClients.map((c, i) => ({
    workshop_id: workshopId,
    client_id: c.id,
    plate: `ABC123${i}`,
    brand: ["Honda", "Toyota", "Ford", "Chevrolet", "BMW"][i],
    model: ["Civic", "Corolla", "Mustang", "Onix", "X1"][i],
    year: 2018 + i
  }));
  
  const { data: insertedVehicles, error: vError } = await supabase.from('vehicles').insert(vehicles).select();
  if (vError) {
    console.error("Error inserting vehicles:", vError);
    return;
  }

  console.log("Generating fake orders...");
  const orders = [];
  const today = new Date();
  
  for (let i = 0; i < 25; i++) {
    const client = insertedClients[i % insertedClients.length];
    const vehicle = insertedVehicles[i % insertedVehicles.length];
    
    // Distribute dates over the last 30 days
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() - (i * 1.5));
    
    const amount = 800 + (Math.random() * 3000); // 800 to 3800
    const status = i < 15 ? "entregue" : (i < 20 ? "em_manutencao" : "recebido");
    const paid = i < 15;
    
    orders.push({
      workshop_id: workshopId,
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

  const { error: oError } = await supabase.from('orders').insert(orders);
  if (oError) {
    console.error("Error inserting orders:", oError);
    return;
  }

  console.log("✅ Mock data inserted successfully! Go to the dashboard and take the screenshot.");
}

populate();
