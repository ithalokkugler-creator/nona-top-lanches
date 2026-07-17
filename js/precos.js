/* ============================================================
   PREÇOS — NONA TOP LANCHES
   ============================================================
   Pra mudar um preço: ache o item aqui embaixo e troque só o
   número. Salve o arquivo — pronto. O site inteiro (o que
   aparece na tela, o carrinho e a mensagem do WhatsApp) passa
   a usar o preço novo sozinho, sem precisar mexer em mais nada.

   Regras simples:
   - Centavos usam PONTO, nunca vírgula. Exemplo: 9.50 (não 9,50)
   - Não apague as aspas ' ' nem a vírgula no final da linha
   - Não mexa no texto que fica dentro das aspas antes dos dois
     pontos (ex.: 'x-tudo') — isso é o código interno do item,
     não o nome que o cliente vê
   - Pra adicionar um item novo, é preciso mexer também no
     index.html — chama que eu ajudo com isso
   ============================================================ */
window.PRECOS = {

  // ===== LANCHES =====
  'x-burguer':     18,    // X-Burguer
  'x-salada':      20,    // X-Salada
  'x-egg':         22,    // X-Egg
  'x-calabresa':   23,    // X-Calabresa
  'x-bacon':       25,    // X-Bacon
  'x-frango':      25,    // X-Frango
  'x-pernil':      28,    // X-Pernil
  'x-costela':     30,    // X-Costela
  'x-tudo':        33,    // X-Tudo
  'x-da-casa':     38,    // X-Da Casa

  // ===== BEBIDAS =====
  'agua-sem-gas':   7,    // Água sem gás 500ml
  'agua-gas':       7,    // Água com gás 500ml
  'coca-lata':      8,    // Coca-Cola lata 350ml
  'coca-zero-600':  9,    // Coca-Cola Zero 600ml
  'coca-600':      11,    // Coca-Cola garrafa 600ml
  'coca-2l':       17,    // Coca-Cola 2 litros
  'fanta-lata':     7,    // Fanta Laranja lata 350ml
  'fanta-2l':      16,    // Fanta Laranja 2 litros
  'sprite':         7,    // Sprite 350ml
  'brahma':         7,    // Brahma 350ml
  'antarctica':     7,    // Antarctica 350ml
  'skol':           7,    // Skol 350ml
  'brahma-zero':    7,    // Brahma Zero Álcool 350ml
  'sol':            8,    // Sol 330ml
  'pilsen':         8,    // Original Pilsen 300ml
  'budweiser':    9.5,    // Budweiser 350ml
  'heineken':     9.5     // Heineken 350ml (sem vírgula na última linha)

};
