/* ============================================================
   NONA TOP LANCHES — interações
   Carrinho + modal de detalhe + adicionais + envio no WhatsApp.
   GSAP só para enfeite; o pedido funciona sem ele.
   ============================================================ */
(function () {
  'use strict';

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temGsap = typeof window.gsap !== 'undefined';
  var ZAP = '5542999354244';

  var MOLHOS = [
    { id: 'molho-verde',     nome: 'Maionese verde de alho',    img: 'img/molho-verde-thumb.jpg' },
    { id: 'molho-artesanal', nome: 'Maionese artesanal',        img: 'img/molho-artesanal-thumb.jpg' },
    { id: 'molho-bacon',     nome: 'Maionese artesanal de bacon', img: 'img/molho-bacon-thumb.jpg' }
  ];
  function molhoNome(id) { for (var i = 0; i < MOLHOS.length; i++) if (MOLHOS[i].id === id) return MOLHOS[i].nome; return id; }

  function brl(n) { return 'R$ ' + n.toFixed(2).replace('.', ','); }

  /* ============================================================
     PREÇOS — lê js/precos.js (window.PRECOS) e sincroniza tudo:
     texto exibido, data-preco (usado pelo carrinho) e o JSON-LD
     de SEO. Se precos.js não carregar ou faltar algum item, o
     valor já escrito no HTML continua valendo — nada quebra.
     ============================================================ */
  (function aplicarPrecos() {
    var tabela = window.PRECOS || {};
    function fmtLanche(n) { return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','); }
    function fmtBebida(n) { return n.toFixed(2).replace('.', ','); }

    document.querySelectorAll('.ficha[data-id]').forEach(function (el) {
      var id = el.getAttribute('data-id');
      if (tabela[id] === undefined) return;
      var preco = Number(tabela[id]);
      el.setAttribute('data-preco', preco);
      var span = el.querySelector('.preco');
      if (span) span.innerHTML = '<sup>R$</sup>' + fmtLanche(preco);
    });

    document.querySelectorAll('.bebida[data-id]').forEach(function (el) {
      var id = el.getAttribute('data-id');
      if (tabela[id] === undefined) return;
      var preco = Number(tabela[id]);
      el.setAttribute('data-preco', preco);
      var span = el.querySelector('.b-preco');
      if (span) span.textContent = 'R$ ' + fmtBebida(preco);
    });

    var ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      try {
        var dados = JSON.parse(ld.textContent);
        var itens = [];
        document.querySelectorAll('.ficha[data-id]').forEach(function (el) {
          var desc = el.querySelector('.desc');
          itens.push({
            '@type': 'MenuItem',
            name: el.getAttribute('data-nome'),
            description: desc ? desc.textContent.trim() : '',
            offers: { '@type': 'Offer', price: Number(el.getAttribute('data-preco')).toFixed(2), priceCurrency: 'BRL' }
          });
        });
        dados.hasMenu.hasMenuSection.hasMenuItem = itens;
        ld.textContent = JSON.stringify(dados);
      } catch (e) { /* JSON-LD original permanece se algo vier inesperado */ }
    }
  })();

  /* preço do adicional de molho — lido de precos.js; 4 é só o valor de hoje, usado
     apenas se precos.js não carregar por algum motivo */
  var PRECO_MOLHO = Number(window.PRECOS && window.PRECOS['molho-extra'] !== undefined ? window.PRECOS['molho-extra'] : 4);
  function fmtMolho(n) { return Number.isInteger(n) ? ('+R$' + n) : ('+R$ ' + n.toFixed(2).replace('.', ',')); }
  (function atualizarTextoAdicionais() {
    var el = document.querySelector('.adic-titulo span');
    if (el) el.textContent = '· maioneses da casa (' + fmtMolho(PRECO_MOLHO) + ' cada)';
  })();

  /* ---------- estado do carrinho ---------- */
  var cart = [];
  try { var salvo = JSON.parse(localStorage.getItem('nona-pedido') || '[]'); if (Array.isArray(salvo)) cart = salvo; } catch (e) {}
  function salvar() { try { localStorage.setItem('nona-pedido', JSON.stringify(cart)); } catch (e) {} }
  function totalItens() { return cart.reduce(function (s, l) { return s + l.qtd; }, 0); }
  function totalPreco() { return cart.reduce(function (s, l) { return s + (l.preco + (l.molhoPreco || 0)) * l.qtd; }, 0); }

  function adicionar(item, qtd, molhos) {
    molhos = molhos || [];
    var key = item.id + '|' + molhos.slice().sort().join(',');
    var molhoPreco = molhos.length * PRECO_MOLHO;
    var existente = null;
    for (var i = 0; i < cart.length; i++) if (cart[i].key === key) { existente = cart[i]; break; }
    if (existente) existente.qtd += qtd;
    else cart.push({ key: key, id: item.id, nome: item.nome, preco: item.preco, molhoPreco: molhoPreco, qtd: qtd, molhos: molhos });
    salvar(); atualizarUI(true);
  }
  function mudarQtd(key, delta) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) {
        cart[i].qtd += delta;
        if (cart[i].qtd <= 0) cart.splice(i, 1);
        break;
      }
    }
    salvar(); atualizarUI(false); renderDrawer();
  }
  function remover(key) {
    cart = cart.filter(function (l) { return l.key !== key; });
    salvar(); atualizarUI(false); renderDrawer();
  }
  function limpar() { cart = []; salvar(); atualizarUI(false); renderDrawer(); }

  /* ---------- refs ---------- */
  var contador = document.getElementById('contador');
  var barra = document.getElementById('barra-pedido');
  var barraContador = document.getElementById('barra-contador');
  var barraTotal = document.getElementById('barra-total');

  function atualizarUI(pulse) {
    var n = totalItens(), t = totalPreco();
    if (n > 0) { contador.hidden = false; contador.textContent = n; }
    else contador.hidden = true;
    if (n > 0) {
      barra.hidden = false;
      void barra.offsetWidth; // força reflow p/ a transição de entrada
      barra.classList.add('mostra');
      barraContador.textContent = n;
      barraTotal.textContent = brl(t);
    } else {
      barra.classList.remove('mostra');
      setTimeout(function () { if (totalItens() === 0) barra.hidden = true; }, 380);
    }
    if (pulse && n > 0) {
      contador.classList.remove('pulou'); void contador.offsetWidth; contador.classList.add('pulou');
    }
  }

  /* ============================================================
     OVERLAYS (modal + gaveta) — abrir/fechar, foco, Esc
     ============================================================ */
  var overlayAtivo = null, focoAnterior = null;
  function focaveis(cont) {
    return Array.prototype.filter.call(
      cont.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
  }
  function abrirOverlay(el, primeiroFoco) {
    focoAnterior = document.activeElement;
    el.hidden = false;
    document.body.classList.add('trava-scroll');
    void el.offsetWidth; // força reflow: garante o estado inicial antes da transição
    el.classList.add('aberto');
    overlayAtivo = el;
    (primeiroFoco || el.querySelector('button')).focus();
  }
  function fecharOverlay(el) {
    el.classList.remove('aberto');
    overlayAtivo = null;
    var fim = function () {
      el.hidden = true;
      el.removeEventListener('transitionend', fim);
      if (!document.querySelector('.modal-overlay.aberto, .drawer-overlay.aberto')) document.body.classList.remove('trava-scroll');
    };
    if (reduzido) fim(); else el.addEventListener('transitionend', fim);
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (!overlayAtivo) return;
    if (e.key === 'Escape') fecharOverlay(overlayAtivo);
    else if (e.key === 'Tab') {
      var f = focaveis(overlayAtivo); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ============================================================
     MODAL DE DETALHE
     ============================================================ */
  var modal = document.getElementById('modal');
  var modalImg = document.getElementById('modal-img');
  var modalNome = document.getElementById('modal-nome');
  var modalDesc = document.getElementById('modal-desc');
  var modalMolhos = document.getElementById('modal-molhos');
  var modalQtdEl = document.getElementById('modal-qtd');
  var modalAddValor = document.getElementById('modal-add-valor');
  var itemAtual = null, qtdModal = 1;

  function atualizarValorModal() {
    var qtdMolhos = modalMolhos.querySelectorAll('input:checked').length;
    var unit = itemAtual.preco + qtdMolhos * PRECO_MOLHO;
    modalAddValor.textContent = brl(unit * qtdModal);
  }

  function abrirModal(ficha) {
    itemAtual = {
      id: ficha.getAttribute('data-id'),
      nome: ficha.getAttribute('data-nome'),
      preco: parseFloat(ficha.getAttribute('data-preco')),
      img: ficha.getAttribute('data-img')
    };
    var desc = ficha.querySelector('.desc');
    modalImg.src = itemAtual.img;
    modalImg.alt = itemAtual.nome;
    modalNome.textContent = itemAtual.nome;
    modalDesc.textContent = desc ? desc.textContent : '';
    modalMolhos.innerHTML = MOLHOS.map(function (m) {
      return '<label class="chip"><input type="checkbox" value="' + m.id + '">' +
             '<img src="' + m.img + '" alt="" width="34" height="34" loading="lazy">' +
             '<span>' + m.nome + '</span><span class="chip-preco">' + fmtMolho(PRECO_MOLHO) + '</span><span class="marca-check" aria-hidden="true"></span></label>';
    }).join('');
    qtdModal = 1; modalQtdEl.textContent = '1';
    atualizarValorModal();
    abrirOverlay(modal, document.getElementById('modal-fechar'));
  }

  document.getElementById('modal-fechar').addEventListener('click', function () { fecharOverlay(modal); });
  modal.addEventListener('click', function (e) { if (e.target === modal) fecharOverlay(modal); });
  modalMolhos.addEventListener('change', atualizarValorModal);
  document.getElementById('modal-menos').addEventListener('click', function () { if (qtdModal > 1) { qtdModal--; modalQtdEl.textContent = qtdModal; atualizarValorModal(); } });
  document.getElementById('modal-mais').addEventListener('click', function () { if (qtdModal < 30) { qtdModal++; modalQtdEl.textContent = qtdModal; atualizarValorModal(); } });
  document.getElementById('modal-add').addEventListener('click', function () {
    var selec = Array.prototype.map.call(modalMolhos.querySelectorAll('input:checked'), function (i) { return i.value; });
    adicionar(itemAtual, qtdModal, selec);
    fecharOverlay(modal);
  });

  /* ============================================================
     GAVETA DO CARRINHO
     ============================================================ */
  var drawer = document.getElementById('drawer');
  var drawerItens = document.getElementById('drawer-itens');
  var drawerVazio = document.getElementById('drawer-vazio');
  var drawerRodape = document.getElementById('drawer-rodape');
  var drawerTotal = document.getElementById('drawer-total');

  function renderDrawer() {
    if (!cart.length) {
      drawerVazio.hidden = false;
      drawerItens.innerHTML = '';
      drawerRodape.hidden = true;
      return;
    }
    drawerVazio.hidden = true;
    drawerRodape.hidden = false;
    drawerItens.innerHTML = cart.map(function (l) {
      var molhoPreco = l.molhoPreco || 0;
      var molhos = (l.molhos && l.molhos.length)
        ? '<span class="di-molhos">+ ' + l.molhos.map(molhoNome).join(', ') + ' (' + fmtMolho(molhoPreco) + ' cada)</span>' : '';
      return '<li class="drawer-item" data-key="' + l.key + '">' +
        '<span class="di-nome">' + l.nome + '</span>' +
        '<span class="di-preco">' + brl((l.preco + molhoPreco) * l.qtd) + '</span>' +
        molhos +
        '<div class="di-baixo">' +
          '<div class="di-qtd">' +
            '<button class="di-menos" aria-label="Diminuir">−</button>' +
            '<span>' + l.qtd + '</span>' +
            '<button class="di-mais" aria-label="Aumentar">+</button>' +
          '</div>' +
          '<button class="di-remover">remover</button>' +
        '</div>' +
      '</li>';
    }).join('');
    drawerTotal.textContent = brl(totalPreco());
  }

  drawerItens.addEventListener('click', function (e) {
    var li = e.target.closest('.drawer-item'); if (!li) return;
    var key = li.getAttribute('data-key');
    if (e.target.closest('.di-mais')) mudarQtd(key, 1);
    else if (e.target.closest('.di-menos')) mudarQtd(key, -1);
    else if (e.target.closest('.di-remover')) remover(key);
  });

  function abrirDrawer() { renderDrawer(); abrirOverlay(drawer, document.getElementById('drawer-fechar')); }
  document.getElementById('abrir-carrinho').addEventListener('click', abrirDrawer);
  barra.addEventListener('click', abrirDrawer);
  document.getElementById('local-pedido').addEventListener('click', abrirDrawer);
  document.getElementById('drawer-fechar').addEventListener('click', function () { fecharOverlay(drawer); });
  drawer.addEventListener('click', function (e) { if (e.target === drawer) fecharOverlay(drawer); });
  document.getElementById('drawer-limpar').addEventListener('click', limpar);

  document.getElementById('drawer-enviar').addEventListener('click', function () {
    if (!cart.length) return;
    var linhas = ['Olá, Nona! 👋 Segue meu pedido:', ''];
    cart.forEach(function (l) {
      var molhoPreco = l.molhoPreco || 0;
      linhas.push('• ' + l.qtd + 'x ' + l.nome + ' — ' + brl((l.preco + molhoPreco) * l.qtd));
      if (l.molhos && l.molhos.length) linhas.push('   ↳ ' + l.molhos.map(molhoNome).join(', ') + ' (' + fmtMolho(molhoPreco) + ' cada)');
    });
    linhas.push('');
    linhas.push('Subtotal: ' + brl(totalPreco()));
    linhas.push('');
    linhas.push('Retirada no balcão. Obrigado! 🍔');
    window.open('https://wa.me/' + ZAP + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank');
  });

  /* ============================================================
     LIGAÇÃO DOS BOTÕES DO CARDÁPIO
     ============================================================ */
  // abrir modal ao tocar no lanche
  document.querySelectorAll('.ficha .ficha-abrir').forEach(function (btn) {
    btn.addEventListener('click', function () { abrirModal(btn.closest('.ficha')); });
  });
  // adicionar rápido (lanches e bebidas)
  document.querySelectorAll('.add-rapido').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var el = btn.closest('[data-id]');
      adicionar(
        { id: el.getAttribute('data-id'), nome: el.getAttribute('data-nome'), preco: parseFloat(el.getAttribute('data-preco')) },
        1, []
      );
      espirrarGergelim(el, btn);
    });
  });

  atualizarUI(false);

  /* ============================================================
     ENFEITES (GSAP + canvas) — nada disso bloqueia o pedido
     ============================================================ */
  var topo = document.querySelector('.topo');
  var marcou = false;
  window.addEventListener('scroll', function () {
    if (marcou) return; marcou = true;
    requestAnimationFrame(function () { topo.classList.toggle('rolou', window.scrollY > 8); marcou = false; });
  }, { passive: true });

  /* canvas de gergelim no topo */
  (function gergelim() {
    if (reduzido || window.innerWidth < 900 || !window.matchMedia('(pointer: fine)').matches) return;
    if (navigator.connection && navigator.connection.saveData) return;
    var canvas = document.querySelector('.gergelim'); if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, sementes = [], mouse = { x: .5, y: .5 }, alvo = { x: .5, y: .5 }, rodando = false, visivel = false;
    function medir() { var r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function criar() {
      sementes = []; var q = Math.round(Math.min(64, W / 24));
      for (var i = 0; i < q; i++) sementes.push({ x: Math.random() * W, y: Math.random() * H, rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .004, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .08, s: 2.6 + Math.random() * 2.4, prof: .35 + Math.random() * .65, tom: Math.random() });
    }
    function desenhar() {
      if (!rodando) return;
      ctx.clearRect(0, 0, W, H);
      alvo.x += (mouse.x - alvo.x) * .06; alvo.y += (mouse.y - alvo.y) * .06;
      var px = (alvo.x - .5) * 22, py = (alvo.y - .5) * 14;
      for (var i = 0; i < sementes.length; i++) {
        var g = sementes[i]; g.x += g.vx; g.y += g.vy; g.rot += g.vr;
        if (g.x < -12) g.x = W + 12; else if (g.x > W + 12) g.x = -12;
        if (g.y < -12) g.y = H + 12; else if (g.y > H + 12) g.y = -12;
        ctx.save(); ctx.translate(g.x + px * g.prof, g.y + py * g.prof); ctx.rotate(g.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, g.s, g.s * .62, 0, 0, Math.PI * 2);
        ctx.fillStyle = g.tom > .82 ? 'rgba(208,52,44,.30)' : 'rgba(184,158,110,.34)'; ctx.fill(); ctx.restore();
      }
      requestAnimationFrame(desenhar);
    }
    function liga() { if (rodando || !visivel || document.hidden) return; rodando = true; requestAnimationFrame(desenhar); }
    function desliga() { rodando = false; }
    medir(); criar();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { medir(); criar(); }, 180); });
    canvas.parentElement.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width; mouse.y = (e.clientY - r.top) / r.height; });
    new IntersectionObserver(function (en) { visivel = en[0].isIntersecting; visivel ? liga() : desliga(); }).observe(canvas);
    document.addEventListener('visibilitychange', function () { document.hidden ? desliga() : liga(); });
  })();

  /* pontinhos de gergelim ao adicionar */
  function espirrarGergelim(container, origem, quantidade) {
    if (reduzido || !temGsap) return;
    var n = quantidade || 6;
    var base = origem.getBoundingClientRect(), ref = container.getBoundingClientRect();
    var cx = base.left - ref.left + base.width / 2, cy = base.top - ref.top + base.height / 2;
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span'); p.className = 'semente';
      p.style.left = cx + 'px'; p.style.top = cy + 'px'; container.appendChild(p);
      var ang = Math.random() * Math.PI * 2, dist = 24 + Math.random() * 32;
      gsap.to(p, { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - 12, rotate: Math.random() * 180, opacity: 0, scale: .5 + Math.random() * .7, duration: .5 + Math.random() * .25, ease: 'power2.out', onComplete: function (el) { el.remove(); }, onCompleteParams: [p] });
    }
  }

  /* reveals */
  if (temGsap && !reduzido) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.kicker', { y: 14, opacity: 0, duration: .45, ease: 'power3.out' });
    gsap.from('#titulo-cardapio', { y: 34, opacity: 0, duration: .6, delay: .08, ease: 'power3.out' });
    gsap.from('.rabisco', { scale: 0, rotate: -18, opacity: 0, duration: .5, delay: .45, ease: 'back.out(2)' });
    gsap.from('.nota-150', { y: 12, opacity: 0, duration: .4, delay: .3, ease: 'power3.out' });
    gsap.from('.selo-girando', { scale: 0, opacity: 0, duration: .55, delay: .5, ease: 'back.out(1.6)' });
    gsap.utils.toArray('.ficha').forEach(function (el, i) {
      gsap.from(el, { y: 26, opacity: 0, duration: .55, delay: (i % 4) * .05, ease: 'back.out(1.3)', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
    });
    gsap.utils.toArray('.sticker').forEach(function (el) {
      gsap.from(el, { scale: 0, rotate: 14, duration: .45, ease: 'back.out(2.2)', scrollTrigger: { trigger: el.parentElement, start: 'top 88%', once: true } });
    });
    gsap.utils.toArray('.bebida-grupo').forEach(function (el) {
      gsap.from(el, { y: 24, opacity: 0, duration: .5, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    ['#titulo-chapa', '#titulo-casa', '#titulo-local', '#titulo-bebidas'].forEach(function (sel) {
      gsap.from(sel, { y: 30, opacity: 0, duration: .6, ease: 'power3.out', scrollTrigger: { trigger: sel, start: 'top 90%', once: true } });
    });
    gsap.utils.toArray('.prato').forEach(function (el, i) {
      gsap.from(el, { y: 34, opacity: 0, rotate: i % 2 ? 1.6 : -1.6, duration: .6, delay: (i % 3) * .07, ease: 'back.out(1.2)', scrollTrigger: { trigger: '.trilho', start: 'top 86%', once: true } });
    });
    gsap.from('.maionese', { x: -30, opacity: 0, duration: .6, ease: 'power3.out', scrollTrigger: { trigger: '.casa-grid', start: 'top 82%', once: true } });
    gsap.from('.doces-fila li', { y: 30, opacity: 0, rotate: 8, duration: .55, stagger: .1, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.doces-fila', start: 'top 88%', once: true } });
    gsap.from('.selo-verde', { scale: 0, duration: .5, ease: 'back.out(2)', scrollTrigger: { trigger: '.maionese', start: 'top 78%', once: true } });
    gsap.from('.fachada', { y: 34, opacity: 0, duration: .65, ease: 'power3.out', scrollTrigger: { trigger: '.local', start: 'top 80%', once: true } });
    gsap.from('.local-info > *', { y: 22, opacity: 0, duration: .5, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: '.local', start: 'top 76%', once: true } });
  }

  /* easter egg: 3 cliques no O do rodapé */
  (function () {
    var o = document.querySelector('.letra-o'); if (!o) return;
    var c = 0, tmr;
    o.addEventListener('click', function () {
      c++; clearTimeout(tmr); tmr = setTimeout(function () { c = 0; }, 900);
      if (c >= 3) { c = 0; espirrarGergelim(document.querySelector('.rodape'), o, 26); }
    });
  })();
})();
