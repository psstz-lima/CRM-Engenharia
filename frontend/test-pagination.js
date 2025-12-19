console.log('=== TESTE DE ENDPOINTS PAGINADOS ===\n');

// Simular resposta do backend
const mockBackendResponse = {
    data: [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }],
    pagination: { page: 1, limit: 1000, total: 2, totalPages: 1 }
};

// Código atual do frontend (deveria funcionar)
const users1 = mockBackendResponse.data.data || mockBackendResponse.data;
console.log('✅ Extração com .data.data || .data:');
console.log('   Tipo:', Array.isArray(users1) ? 'Array ✓' : 'Objeto ✗');
console.log('   Length:', users1.length);
console.log('   Pode fazer .map():', typeof users1.map === 'function' ? 'Sim ✓' : 'Não ✗');

// Se backend retornar array direto (sem paginação)
const mockArrayResponse = [{ id: 1, name: 'User 1' }];
const users2 = mockArrayResponse.data || mockArrayResponse;
console.log('\n✅ Compatibilidade com array direto:');
console.log('   Tipo:', Array.isArray(users2) ? 'Array ✓' : 'Objeto ✗');
console.log('   Length:', users2.length);
console.log('   Pode fazer .map():', typeof users2.map === 'function' ? 'Sim ✓' : 'Não ✗');

console.log('\n=== TESTE CONCLUÍDO ===');
