import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SeedRequest {
  action: 'seed' | 'clear'
}

const PROTECTED_EMAIL = 'lucas@adm.com'
const DEFAULT_PASSWORD = 'SenhaForte12345'

// Nomes brasileiros variados
const WAITER_NAMES = [
  { first: 'João', last: 'Silva' },
  { first: 'Maria', last: 'Santos' },
  { first: 'Pedro', last: 'Oliveira' },
  { first: 'Ana', last: 'Costa' },
  { first: 'Carlos', last: 'Souza' },
  { first: 'Juliana', last: 'Lima' },
  { first: 'Rafael', last: 'Ferreira' },
  { first: 'Fernanda', last: 'Almeida' },
  { first: 'Lucas', last: 'Pereira' },
  { first: 'Camila', last: 'Rodrigues' },
  { first: 'Bruno', last: 'Martins' },
  { first: 'Beatriz', last: 'Gomes' },
  { first: 'Thiago', last: 'Ribeiro' },
  { first: 'Amanda', last: 'Carvalho' },
  { first: 'Gabriel', last: 'Barbosa' },
  { first: 'Larissa', last: 'Nascimento' },
  { first: 'Felipe', last: 'Araújo' },
  { first: 'Patrícia', last: 'Mendes' },
  { first: 'Rodrigo', last: 'Cardoso' },
  { first: 'Vanessa', last: 'Moreira' },
]

const INSUMOS = [
  { nome: 'Filé Mignon', quantidade_atual: 15, unidade_de_medida: 'kg' },
  { nome: 'Alface', quantidade_atual: 30, unidade_de_medida: 'un' },
  { nome: 'Coca-Cola Lata', quantidade_atual: 120, unidade_de_medida: 'un' },
  { nome: 'Farinha de Trigo', quantidade_atual: 10, unidade_de_medida: 'kg' },
  { nome: 'Vodka', quantidade_atual: 8, unidade_de_medida: 'L' },
  { nome: 'Pão de Hambúrguer', quantidade_atual: 80, unidade_de_medida: 'un' },
  { nome: 'Queijo Mussarela', quantidade_atual: 5, unidade_de_medida: 'kg' },
  { nome: 'Bacon', quantidade_atual: 4, unidade_de_medida: 'kg' },
  { nome: 'Batata', quantidade_atual: 20, unidade_de_medida: 'kg' },
  { nome: 'Tomate', quantidade_atual: 15, unidade_de_medida: 'kg' },
  { nome: 'Cebola', quantidade_atual: 10, unidade_de_medida: 'kg' },
  { nome: 'Arroz', quantidade_atual: 25, unidade_de_medida: 'kg' },
  { nome: 'Feijão Preto', quantidade_atual: 15, unidade_de_medida: 'kg' },
  { nome: 'Picanha', quantidade_atual: 12, unidade_de_medida: 'kg' },
  { nome: 'Gin', quantidade_atual: 6, unidade_de_medida: 'L' },
  { nome: 'Água Tônica', quantidade_atual: 48, unidade_de_medida: 'un' },
  { nome: 'Limão', quantidade_atual: 50, unidade_de_medida: 'un' },
  { nome: 'Cerveja Lata', quantidade_atual: 200, unidade_de_medida: 'un' },
  { nome: 'Suco de Laranja', quantidade_atual: 20, unidade_de_medida: 'L' },
  { nome: 'Camarão', quantidade_atual: 8, unidade_de_medida: 'kg' },
]

const MENU_ITEMS = [
  // Lanches
  { name: 'X-Bacon', category: 'Lanches', price: 32.90, description: 'Hambúrguer 180g, bacon, queijo, salada', available: true },
  { name: 'X-Salada', category: 'Lanches', price: 28.90, description: 'Hambúrguer 180g, queijo, salada completa', available: true },
  { name: 'X-Tudo', category: 'Lanches', price: 38.90, description: 'Hambúrguer 180g, bacon, ovo, queijo, salada', available: true },
  { name: 'X-Frango', category: 'Lanches', price: 29.90, description: 'Peito de frango grelhado, queijo, salada', available: true },
  { name: 'Hambúrguer Artesanal', category: 'Lanches', price: 45.00, description: 'Blend especial 200g, cheddar, cebola caramelizada', available: true },
  // Bebidas
  { name: 'Coca-Cola Lata', category: 'Bebidas', price: 7.00, description: '350ml', available: true },
  { name: 'Suco de Laranja', category: 'Bebidas', price: 12.00, description: 'Natural 400ml', available: true },
  { name: 'Água Mineral', category: 'Bebidas', price: 5.00, description: '500ml', available: true },
  { name: 'Cerveja Heineken', category: 'Bebidas', price: 15.00, description: 'Long neck 330ml', available: true },
  { name: 'Refrigerante 2L', category: 'Bebidas', price: 14.00, description: 'Coca, Fanta ou Sprite', available: true },
  // Entradas
  { name: 'Porção de Batata Frita', category: 'Entradas', price: 28.00, description: '400g de batatas crocantes', available: true },
  { name: 'Onion Rings', category: 'Entradas', price: 32.00, description: 'Anéis de cebola empanados', available: true },
  { name: 'Bolinho de Bacalhau', category: 'Entradas', price: 45.00, description: '10 unidades', available: true },
  { name: 'Bruschetta', category: 'Entradas', price: 25.00, description: 'Tomate, manjericão e azeite', available: true },
  { name: 'Camarão Empanado', category: 'Entradas', price: 65.00, description: '200g de camarões crocantes', available: true },
  // Pratos Principais
  { name: 'Picanha na Chapa', category: 'Pratos Principais', price: 89.90, description: '350g, arroz, farofa, vinagrete', available: true },
  { name: 'Filé Mignon ao Molho', category: 'Pratos Principais', price: 79.90, description: '280g, molho madeira, batatas', available: true },
  { name: 'Salmão Grelhado', category: 'Pratos Principais', price: 85.00, description: '250g, legumes, arroz', available: true },
  { name: 'Frango à Parmegiana', category: 'Pratos Principais', price: 55.00, description: 'Peito de frango, molho, queijo', available: true },
  { name: 'Risoto de Camarão', category: 'Pratos Principais', price: 75.00, description: 'Risoto cremoso com camarões', available: true },
  { name: 'Feijoada Completa', category: 'Pratos Principais', price: 65.00, description: 'Feijoada, arroz, couve, farofa', available: true },
  { name: 'Espaguete Carbonara', category: 'Pratos Principais', price: 48.00, description: 'Massa fresca, bacon, parmesão', available: true },
  { name: 'Costela no Bafo', category: 'Pratos Principais', price: 150.00, description: '800g para 2 pessoas', available: true },
  // Drinks
  { name: 'Gin Tônica', category: 'Drinks', price: 32.00, description: 'Gin, água tônica, limão', available: true },
  { name: 'Caipirinha', category: 'Drinks', price: 22.00, description: 'Cachaça, limão, açúcar', available: true },
  { name: 'Moscow Mule', category: 'Drinks', price: 35.00, description: 'Vodka, espuma de gengibre, limão', available: true },
  { name: 'Mojito', category: 'Drinks', price: 28.00, description: 'Rum, hortelã, limão, água com gás', available: true },
  { name: 'Aperol Spritz', category: 'Drinks', price: 38.00, description: 'Aperol, prosecco, água com gás', available: true },
  { name: 'Margarita', category: 'Drinks', price: 30.00, description: 'Tequila, triple sec, limão', available: true },
  { name: 'Whisky Dose', category: 'Drinks', price: 25.00, description: 'Johnnie Walker Red Label', available: true },
]

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token de autorização necessário')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      throw new Error('Apenas administradores podem executar esta ação')
    }

    const body: SeedRequest = await req.json()
    const { action } = body

    console.log(`Iniciando ação: ${action}`)

    if (action === 'clear') {
      // LIMPEZA - Apenas dados demo (preserva lucas@adm.com)
      console.log('Iniciando limpeza dos dados demo...')

      // 1. Delete orders
      await supabaseAdmin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log('Orders deletados')

      // 2. Delete bill_tokens
      await supabaseAdmin.from('bill_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log('Bill tokens deletados')

      // 3. Delete consent_log
      await supabaseAdmin.from('consent_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log('Consent log deletado')

      // 4. Delete tables
      await supabaseAdmin.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log('Tables deletadas')

      // 5. Delete menu_items
      await supabaseAdmin.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log('Menu items deletados')

      // 6. Delete insumos
      await supabaseAdmin.from('insumos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log('Insumos deletados')

      // 7. Get protected user ID
      const { data: protectedUser } = await supabaseAdmin.auth.admin.listUsers()
      const lucasUser = protectedUser?.users.find(u => u.email === PROTECTED_EMAIL)
      const protectedUserId = lucasUser?.id

      // 8. Delete users except protected
      if (protectedUserId) {
        // Delete user_roles except protected
        await supabaseAdmin.from('user_roles').delete().neq('user_id', protectedUserId)
        console.log('User roles deletados (exceto protegido)')

        // Delete profiles except protected
        await supabaseAdmin.from('profiles').delete().neq('id', protectedUserId)
        console.log('Profiles deletados (exceto protegido)')

        // Delete auth users except protected
        const allUsers = protectedUser?.users || []
        for (const authUser of allUsers) {
          if (authUser.id !== protectedUserId) {
            await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          }
        }
        console.log('Auth users deletados (exceto protegido)')
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Dados demo limpos com sucesso!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'seed') {
      console.log('Iniciando seeding do banco de dados...')

      // STEP 1: Ensure units exist
      console.log('Verificando/criando unidades...')
      
      // Check existing units
      const { data: existingUnits } = await supabaseAdmin.from('units').select('*')
      
      let savassiUnit = existingUnits?.find(u => u.name === 'Savassi')
      let pradoUnit = existingUnits?.find(u => u.name === 'Prado')

      if (!savassiUnit) {
        const { data: newSavassi, error } = await supabaseAdmin
          .from('units')
          .insert({ name: 'Savassi', address: 'Rua Pernambuco, 1000 - Savassi, BH' })
          .select()
          .single()
        if (error) throw error
        savassiUnit = newSavassi
        console.log('Unidade Savassi criada')
      }

      if (!pradoUnit) {
        const { data: newPrado, error } = await supabaseAdmin
          .from('units')
          .insert({ name: 'Prado', address: 'Av. do Contorno, 5000 - Prado, BH' })
          .select()
          .single()
        if (error) throw error
        pradoUnit = newPrado
        console.log('Unidade Prado criada')
      }

      // STEP 2: Create Kitchen users
      console.log('Criando usuários de cozinha...')
      
      const kitchenUsers = []
      
      // Kitchen for Savassi
      const savassiKitchenEmail = 'cozinha.savassi@ff.com'
      const { data: savassiKitchen, error: skError } = await supabaseAdmin.auth.admin.createUser({
        email: savassiKitchenEmail,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Cozinha Savassi' }
      })
      if (skError && !skError.message.includes('already been registered')) throw skError
      if (savassiKitchen?.user) {
        kitchenUsers.push({ user: savassiKitchen.user, unitId: savassiUnit.id, name: 'Cozinha Savassi' })
      }

      // Kitchen for Prado
      const pradoKitchenEmail = 'cozinha.prado@ff.com'
      const { data: pradoKitchen, error: pkError } = await supabaseAdmin.auth.admin.createUser({
        email: pradoKitchenEmail,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Cozinha Prado' }
      })
      if (pkError && !pkError.message.includes('already been registered')) throw pkError
      if (pradoKitchen?.user) {
        kitchenUsers.push({ user: pradoKitchen.user, unitId: pradoUnit.id, name: 'Cozinha Prado' })
      }

      // Insert kitchen profiles and roles
      for (const k of kitchenUsers) {
        await supabaseAdmin.from('profiles').upsert({ 
          id: k.user.id, 
          full_name: k.name, 
          unit_id: k.unitId 
        })
        await supabaseAdmin.from('user_roles').upsert({ 
          user_id: k.user.id, 
          role: 'kitchen', 
          unit_id: k.unitId 
        })
      }
      console.log('Usuários de cozinha criados')

      // STEP 3: Create Waiters (20 total, 10 per unit)
      console.log('Criando garçons...')
      
      const waiterIds: { id: string; unitId: string }[] = []
      
      for (let i = 0; i < WAITER_NAMES.length; i++) {
        const waiter = WAITER_NAMES[i]
        const unitId = i < 10 ? savassiUnit.id : pradoUnit.id
        const email = `${waiter.first.toLowerCase()}.${waiter.last.toLowerCase()}@ff.com`
        const fullName = `${waiter.first} ${waiter.last}`

        const { data: newWaiter, error: wError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        })

        if (wError && !wError.message.includes('already been registered')) {
          console.error(`Erro ao criar garçom ${email}:`, wError.message)
          continue
        }

        if (newWaiter?.user) {
          await supabaseAdmin.from('profiles').upsert({ 
            id: newWaiter.user.id, 
            full_name: fullName, 
            unit_id: unitId 
          })
          await supabaseAdmin.from('user_roles').upsert({ 
            user_id: newWaiter.user.id, 
            role: 'waiter', 
            unit_id: unitId 
          })
          waiterIds.push({ id: newWaiter.user.id, unitId })
        }
      }
      console.log(`${waiterIds.length} garçons criados`)

      // STEP 4: Create Insumos
      console.log('Criando insumos...')
      const { error: insumosError } = await supabaseAdmin.from('insumos').insert(INSUMOS)
      if (insumosError) throw insumosError
      console.log('Insumos criados')

      // STEP 5: Create Menu Items
      console.log('Criando itens do cardápio...')
      const { data: menuItems, error: menuError } = await supabaseAdmin
        .from('menu_items')
        .insert(MENU_ITEMS)
        .select()
      if (menuError) throw menuError
      console.log('Itens do cardápio criados')

      // STEP 6: Create Historical Sales
      console.log('Criando vendas históricas...')
      
      const startDate = new Date('2025-11-01')
      const endDate = new Date('2025-11-30')

      for (const waiter of waiterIds) {
        const numTables = randomInt(3, 5)
        
        for (let t = 0; t < numTables; t++) {
          const tableDate = randomDate(startDate, endDate)
          const tableNumber = randomInt(1, 20)
          const numOrders = randomInt(2, 4)
          
          let totalAmount = 0
          const ordersToInsert = []

          // Select random menu items for this table
          for (let o = 0; o < numOrders; o++) {
            const randomMenuItem = menuItems![randomInt(0, menuItems!.length - 1)]
            const quantity = randomInt(1, 3)
            totalAmount += randomMenuItem.price * quantity

            ordersToInsert.push({
              menu_item_id: randomMenuItem.id,
              quantity,
              status: 'delivered',
              waiter_id: waiter.id,
              item_price: randomMenuItem.price,
              created_at: tableDate.toISOString(),
              completed_at: new Date(tableDate.getTime() + randomInt(10, 60) * 60000).toISOString()
            })
          }

          // Create table
          const closedAt = new Date(tableDate.getTime() + randomInt(30, 120) * 60000)
          const { data: newTable, error: tableError } = await supabaseAdmin
            .from('tables')
            .insert({
              table_number: tableNumber,
              status: 'closed',
              waiter_id: waiter.id,
              client_name: `Cliente ${randomInt(1, 999)}`,
              total_amount: totalAmount,
              opened_at: tableDate.toISOString(),
              closed_at: closedAt.toISOString()
            })
            .select()
            .single()

          if (tableError) {
            console.error('Erro ao criar mesa:', tableError.message)
            continue
          }

          // Insert orders for this table
          const ordersWithTableId = ordersToInsert.map(order => ({
            ...order,
            table_id: newTable.id
          }))

          const { error: ordersError } = await supabaseAdmin
            .from('orders')
            .insert(ordersWithTableId)

          if (ordersError) {
            console.error('Erro ao criar pedidos:', ordersError.message)
          }
        }
      }

      console.log('Vendas históricas criadas')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Banco de dados populado com sucesso!',
          stats: {
            units: 2,
            kitchens: kitchenUsers.length,
            waiters: waiterIds.length,
            insumos: INSUMOS.length,
            menuItems: MENU_ITEMS.length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Ação inválida. Use "seed" ou "clear".')

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
