// Script para crear cuenta por defecto en Firebase
// Ejecutar esto una vez en la consola de Firebase o importarlo

const defaultAccount = {
  id: "cliente_default_001",
  email: "cliente@demo.com",
  password: "123456",
  name: "Cliente Demo",
  phone: "+57 300 123 4567",
  createdAt: Date.now(),
  status: 'active',
  address: "Dirección de prueba, Ciudad"
};

console.log("=== CUENTA VIRTUAL POR DEFECTO ===");
console.log("Email: cliente@demo.com");
console.log("Contraseña: 123456");
console.log("===============================");
console.log("Datos para Firebase:", JSON.stringify(defaultAccount, null, 2));
console.log("\nImportar en Firebase Realtime Database en la ruta: /clients/cliente_default_001");
