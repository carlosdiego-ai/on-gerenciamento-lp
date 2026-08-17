/* =========================================================================
   ON GERENCIAMENTO DE OBRAS — comportamento da landing page
   Sem dependências externas. Tudo roda offline.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIGURAÇÃO — trocar antes de publicar
     --------------------------------------------------------------------- */
  var CONFIG = {
    // WhatsApp de destino no formato internacional, só dígitos.
    // Celular brasileiro tem 13 dígitos: 55 + DDD + 9 + número.
    whatsapp: '5518000000000',            // PENDENTE: número real da ON
    endpoint: '',                          // opcional: URL que recebe o lead por POST
    reduzirMovimento: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

    /* -------------------------------------------------------------------
       CARROSSEL DE OBRAS E INSTAGRAM

       Para trocar o conteúdo, edite a lista abaixo. Cada item aceita:
         foto    caminho da imagem. Ja aponta para assets/img/obra-01.jpg
                 ate obra-06.jpg: basta salvar os arquivos com esses nomes
                 na pasta que eles aparecem sozinhos, sem editar nada aqui.
                 Se o arquivo nao existir, entra a moldura de espera.
         titulo  nome da obra ou do conteúdo
         texto   uma linha curta de contexto
         tipo    rótulo do canto superior (Obra entregue, Reels, Bastidor)
         link    endereço do post no Instagram (opcional)

       Para puxar o feed automaticamente no futuro, veja a função
       carregarFeed() mais abaixo.
       ------------------------------------------------------------------- */
    instagram: [
      { foto:'assets/img/obra-01.jpg', titulo:'Residência em Adamantina', texto:'Do terreno à entrega das chaves, com cronograma cumprido.', tipo:'Obra entregue', link:'' },
      { foto:'assets/img/obra-02.jpg', titulo:'Concretagem da laje',      texto:'Acompanhamento técnico em cada etapa crítica da estrutura.', tipo:'Bastidor', link:'' },
      { foto:'assets/img/obra-03.jpg', titulo:'Residência em condomínio', texto:'Alto padrão com acabamento conferido serviço a serviço.', tipo:'Obra entregue', link:'' },
      { foto:'assets/img/obra-04.jpg', titulo:'Visita técnica semanal',   texto:'O relatório que chega para o cliente sai daqui.', tipo:'Bastidor', link:'' },
      { foto:'assets/img/obra-05.jpg', titulo:'Obra comercial',           texto:'Prazo e custo definidos antes da primeira pedra.', tipo:'Obra entregue', link:'' },
      { foto:'assets/img/obra-06.jpg', titulo:'Detalhe de acabamento',    texto:'O padrão se mantém porque alguém confere.', tipo:'Reels', link:'' }
    ],
    feedAutoplay: 5200                     // ms entre trocas. 0 desliga.
  };

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------------
     PIXEL — ponto único de disparo. Se o pixel não estiver instalado,
     a função apenas registra no console e a página segue funcionando.
     --------------------------------------------------------------------- */
  function track(evento, dados) {
    if (typeof window.fbq === 'function') {
      window.fbq('track', evento, dados || {});
    } else if (window.console) {
      console.info('[pixel pendente] ' + evento, dados || {});
    }
  }

  /* ---------------------------------------------------------------------
     ANO NO RODAPÉ
     --------------------------------------------------------------------- */
  var ano = $('#ano');
  if (ano) { ano.textContent = String(new Date().getFullYear()); }

  /* ---------------------------------------------------------------------
     REVELAÇÃO SUAVE DAS SEÇÕES
     --------------------------------------------------------------------- */
  var animaveis = $$('.reveal, .head--split');
  function revelarTudo() { animaveis.forEach(function (el) { el.classList.add('in'); }); }

  if (CONFIG.reduzirMovimento || !('IntersectionObserver' in window)) {
    revelarTudo();
  } else {
    // Escalonamento por grupo: itens irmãos entram em cascata, não todos de uma vez.
    $$('.grid, .people, .pains, .works, .fit, .about').forEach(function (grupo) {
      $$('.reveal', grupo).forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    animaveis.forEach(function (el) { io.observe(el); });

    // Rede de segurança: nenhum conteúdo pode ficar invisível por falha do observador.
    setTimeout(revelarTudo, 2500);
  }

  /* ---------------------------------------------------------------------
     BARRA DE PROGRESSO DA LEITURA + HEADER QUE ENCOLHE
     --------------------------------------------------------------------- */
  var header = $('.header');
  var progresso = null;

  if (!CONFIG.reduzirMovimento) {
    progresso = document.createElement('div');
    progresso.className = 'progress';
    progresso.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progresso);
  }

  /* ---------------------------------------------------------------------
     A PLANTA QUE SE CONSTRÓI
     Cada etapa da obra ocupa uma faixa da rolagem. Dentro da sua faixa,
     os traços daquela etapa vão sendo desenhados do zero até o fim.
     --------------------------------------------------------------------- */
  var etapas = [];
  (function prepararPlanta() {
    var svg = $('.blueprint__svg');
    if (!svg) { return; }

    // Sem animação: entrega a planta inteira desenhada.
    if (CONFIG.reduzirMovimento) { return; }

    $$('[data-etapa]', svg).forEach(function (grupo) {
      var tracos = $$('path, circle', grupo).filter(function (el) {
        return el.getAttribute('fill') !== 'currentColor';
      }).map(function (el) {
        var L = 0;
        try { L = el.getTotalLength(); } catch (e) { L = 0; }
        if (!L) { return null; }
        el.style.strokeDasharray = L;
        el.style.strokeDashoffset = L;
        return { el: el, L: L };
      }).filter(Boolean);

      // as setas de cota são preenchidas, então só recebem opacidade
      var solidos = $$('[fill="currentColor"]', grupo);
      solidos.forEach(function (el) { el.style.opacity = 0; });

      if (tracos.length || solidos.length) {
        etapas.push({ tracos: tracos, solidos: solidos });
      }
    });
  })();

  function desenharPlanta(progresso01) {
    if (!etapas.length) { return; }
    var n = etapas.length;
    // A obra sobe entre 4% e 92% da página, para começar e terminar com folga.
    var p = (progresso01 - 0.04) / 0.88;
    p = Math.max(0, Math.min(1, p));

    etapas.forEach(function (etapa, i) {
      var ini = i / n;
      var t = (p - ini) * n;              // 0 a 1 dentro da faixa da etapa
      t = Math.max(0, Math.min(1, t));
      // suaviza o fim de cada traço
      var e = 1 - Math.pow(1 - t, 3);
      etapa.tracos.forEach(function (tr) {
        tr.el.style.strokeDashoffset = tr.L * (1 - e);
      });
      etapa.solidos.forEach(function (el) { el.style.opacity = e; });
    });
  }

  // Exposto para inspeção: ONPlanta.desenhar(0) a ONPlanta.desenhar(1)
  // permite conferir cada etapa da obra sem precisar rolar a página.
  window.ONPlanta = { desenhar: desenharPlanta, etapas: etapas };

  var ticking = false;
  function aoRolar() {
    var y = window.scrollY || window.pageYOffset;

    if (header) { header.classList.toggle('is-scrolled', y > 40); }

    var total = document.documentElement.scrollHeight - window.innerHeight;
    var razao = total > 0 ? Math.min(y / total, 1) : 0;

    if (progresso) { progresso.style.transform = 'scaleX(' + razao + ')'; }
    desenharPlanta(razao);

    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(aoRolar); ticking = true; }
  }, { passive: true });
  aoRolar();

  /* ---------------------------------------------------------------------
     CTA FIXO NO CELULAR — aparece depois do hero, some no formulário
     --------------------------------------------------------------------- */
  var sticky = $('#stickyCta');
  var contato = $('#contato');
  var hero = $('.hero');
  if (sticky && contato && hero && 'IntersectionObserver' in window) {
    var passouHero = false, noForm = false;
    var atualiza = function () {
      sticky.classList.toggle('show', passouHero && !noForm);
    };
    new IntersectionObserver(function (e) {
      passouHero = !e[0].isIntersecting; atualiza();
    }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(function (e) {
      noForm = e[0].isIntersecting; atualiza();
    }, { threshold: 0.08 }).observe(contato);
  }

  /* ---------------------------------------------------------------------
     PLAYER DA VSL — enquanto o vídeo não chega, o botão leva ao formulário
     --------------------------------------------------------------------- */
  var play = $('.vsl__play');
  if (play) {
    play.addEventListener('click', function () {
      var alvo = $('#contato');
      if (alvo) { alvo.scrollIntoView({ behavior: CONFIG.reduzirMovimento ? 'auto' : 'smooth' }); }
    });
  }

  // Quando o vídeo real entrar, este observador dispara ViewContent na metade.
  var video = document.querySelector('#vsl video');
  if (video) {
    var meio = false;
    video.addEventListener('timeupdate', function () {
      if (!meio && video.duration && video.currentTime / video.duration >= 0.5) {
        meio = true;
        track('ViewContent', { content_name: 'VSL 50%' });
      }
    });
  }

  /* ---------------------------------------------------------------------
     CLIQUES NOS BOTÕES DE CTA
     --------------------------------------------------------------------- */
  $$('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('InitiateCheckout', { origem: el.getAttribute('data-cta') });
    });
  });

  /* ---------------------------------------------------------------------
     CARROSSEL DE OBRAS E INSTAGRAM

     A rolagem é nativa com scroll-snap, então arrastar com o dedo já
     funciona sem JavaScript. O que segue acrescenta setas, indicadores,
     navegação por teclado e avanço automático.
     --------------------------------------------------------------------- */
  (function carrossel() {
    var track = $('#feedTrack');
    if (!track) { return; }

    var dots = $('#feedDots');
    var prev = $('#feedPrev');
    var next = $('#feedNext');

    function esc(t) {
      return String(t == null ? '' : t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function montarSlide(item, i) {
      /* A imagem é sempre tentada. Se o arquivo ainda não existe na pasta,
         o onerror troca pela moldura de espera. Assim basta soltar o arquivo
         em assets/img/ com o nome certo, sem precisar editar este arquivo. */
      var espera = '<div class="slide__ph"><span>Foto: ' + esc(item.titulo) + '</span></div>';
      var midia = item.foto && item.foto.trim()
        ? '<img src="' + esc(item.foto) + '" alt="' + esc(item.titulo) + '"'
          + ' loading="lazy" decoding="async"'
          + ' onerror="this.parentNode.innerHTML=this.dataset.espera"'
          + ' data-espera="' + esc(espera) + '">'
        : espera;

      var interno =
        '<div class="slide__media">' + midia + '</div>' +
        (item.tipo ? '<span class="slide__tipo">' + esc(item.tipo) + '</span>' : '') +
        '<div class="slide__cap"><b>' + esc(item.titulo) + '</b><p>' + esc(item.texto) + '</p></div>';

      var el;
      if (item.link) {
        el = document.createElement('a');
        el.href = item.link;
        el.target = '_blank';
        el.rel = 'noopener';
        el.setAttribute('aria-label', item.titulo + ', abrir no Instagram');
      } else {
        el = document.createElement('div');
      }
      el.className = 'slide';
      el.setAttribute('role', 'group');
      el.setAttribute('aria-roledescription', 'slide');
      el.setAttribute('aria-label', (i + 1) + ' de ' + CONFIG.instagram.length);
      el.innerHTML = interno;
      return el;
    }

    function render(lista) {
      track.innerHTML = '';
      lista.forEach(function (item, i) { track.appendChild(montarSlide(item, i)); });
      montarDots();
    }

    // os indicadores dependem de quantos slides cabem na tela,
    // então são refeitos quando a largura muda
    function montarDots() {
      var total = paradas().length;
      if (dots.childElementCount === total) { return; }
      dots.innerHTML = '';
      for (var i = 0; i < total; i++) {
        (function (k) {
          var d = document.createElement('button');
          d.type = 'button';
          d.className = 'cdot';
          d.setAttribute('role', 'tab');
          d.setAttribute('aria-label', 'Posição ' + (k + 1) + ' de ' + total);
          d.setAttribute('aria-selected', k === 0 ? 'true' : 'false');
          d.addEventListener('click', function () { irPara(k); parar(); });
          dots.appendChild(d);
        })(i);
      }
    }

    function slides() { return $$('.slide', track); }

    /* O ponto de ancoragem muda com o scroll-snap-align: no desktop os
       slides encostam à esquerda, no celular ficam centralizados. Calcular
       sempre pelo centro faria o carrossel pular slides. */
    function ancora(el) {
      var alinha = getComputedStyle(el).scrollSnapAlign || 'start';
      if (alinha.indexOf('center') >= 0) {
        return (track.clientWidth - el.offsetWidth) / 2;
      }
      var cs = getComputedStyle(track);
      return parseFloat(cs.scrollPaddingInlineStart || cs.scrollPaddingLeft) || 0;
    }

    function scrollMax() { return Math.max(0, track.scrollWidth - track.clientWidth); }

    // posição de rolagem que deixa este slide alinhado, sem passar do fim
    function destino(el) {
      var delta = el.getBoundingClientRect().left - track.getBoundingClientRect().left;
      var alvo = Math.round(track.scrollLeft + delta - ancora(el));
      return Math.max(0, Math.min(alvo, scrollMax()));
    }

    /* Com vários slides visíveis por vez, o número de posições reais de
       parada é menor que o de slides: os últimos compartilham o fim da
       rolagem. Os indicadores seguem as paradas, não os slides, senão os
       últimos nunca ficariam ativos. */
    function paradas() {
      var lista = [];
      slides().forEach(function (el) {
        var d = destino(el);
        if (!lista.length || d - lista[lista.length - 1] > 4) { lista.push(d); }
      });
      if (!lista.length) { return [0]; }
      var max = scrollMax();
      if (max - lista[lista.length - 1] > 4) { lista.push(max); }
      return lista;
    }

    function atual() {
      var p = paradas();
      var melhor = 0, dist = Infinity;
      p.forEach(function (v, i) {
        var d = Math.abs(v - track.scrollLeft);
        if (d < dist) { dist = d; melhor = i; }
      });
      return melhor;
    }

    function irPara(i) {
      var p = paradas();
      var alvo = p[Math.max(0, Math.min(i, p.length - 1))];
      track.scrollTo({ left: alvo, behavior: CONFIG.reduzirMovimento ? 'auto' : 'smooth' });
    }

    function sincronizar() {
      var i = atual();
      $$('.cdot', dots).forEach(function (d, k) {
        d.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      if (prev) { prev.disabled = track.scrollLeft <= 4; }
      if (next) { next.disabled = track.scrollLeft >= scrollMax() - 4; }
    }

    // largura mudou: número de slides visíveis muda, indicadores refeitos
    var redim = null;
    window.addEventListener('resize', function () {
      clearTimeout(redim);
      redim = setTimeout(function () { montarDots(); sincronizar(); }, 180);
    }, { passive: true });

    var timer = null;
    function parar() { if (timer) { clearInterval(timer); timer = null; } }
    function tocar() {
      if (CONFIG.reduzirMovimento || !CONFIG.feedAutoplay) { return; }
      parar();
      timer = setInterval(function () {
        if (document.hidden) { return; }
        var s = slides();
        var i = atual();
        // no fim, volta ao começo
        irPara(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 ? 0 : Math.min(i + 1, s.length - 1));
      }, CONFIG.feedAutoplay);
    }

    if (prev) { prev.addEventListener('click', function () { irPara(Math.max(atual() - 1, 0)); parar(); }); }
    if (next) { next.addEventListener('click', function () { irPara(atual() + 1); parar(); }); }

    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(sincronizar);
    }, { passive: true });

    // teclado: setas navegam quando o carrossel tem foco
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); irPara(atual() + 1); parar(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(Math.max(atual() - 1, 0)); parar(); }
    });

    // pausa quando o ponteiro ou o foco está dentro
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) {
      track.addEventListener(ev, parar, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      track.addEventListener(ev, tocar);
    });

    /* Ponto de integração com a Graph API da Meta.
       Enquanto CONFIG.feedEndpoint não existir, usa a lista local. */
    function carregarFeed() {
      if (!CONFIG.feedEndpoint) { return Promise.resolve(CONFIG.instagram); }
      return fetch(CONFIG.feedEndpoint)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var posts = (d.data || d || []).slice(0, 8).map(function (p) {
            return {
              foto: p.media_url || p.thumbnail_url || '',
              titulo: (p.caption || 'Publicação').split('\n')[0].slice(0, 42),
              texto: (p.caption || '').slice(0, 90),
              tipo: p.media_type === 'VIDEO' ? 'Reels' : 'Publicação',
              link: p.permalink || ''
            };
          });
          return posts.length ? posts : CONFIG.instagram;
        })
        .catch(function () { return CONFIG.instagram; });
    }

    carregarFeed().then(function (lista) {
      render(lista);
      sincronizar();
      tocar();
    });

    // Exposto para inspeção e manutenção:
    // ONCarrossel.irPara(2), ONCarrossel.atual(), ONCarrossel.destino(n)
    window.ONCarrossel = {
      irPara: irPara,
      atual: atual,
      destino: function (i) { var s = slides(); return s[i] ? destino(s[i]) : null; },
      total: function () { return slides().length; },
      parar: parar,
      tocar: tocar
    };
  })();

  /* ---------------------------------------------------------------------
     FORMULÁRIO
     --------------------------------------------------------------------- */
  var form = $('#leadForm');
  if (!form) { return; }

  var tel = $('#whatsapp');
  var sucesso = $('#formSuccess');
  var waLink = $('#waLink');
  var primeiroToque = false;

  // Máscara de telefone tolerante: aceita colar com ou sem símbolo
  function mascara(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) { return d.length ? '(' + d : ''; }
    if (d.length <= 6) { return '(' + d.slice(0, 2) + ') ' + d.slice(2); }
    if (d.length <= 10) { return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6); }
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  if (tel) {
    tel.addEventListener('input', function () { tel.value = mascara(tel.value); });
  }

  form.addEventListener('input', function () {
    if (!primeiroToque) { primeiroToque = true; track('InitiateCheckout', { origem: 'formulario' }); }
  }, { once: false });

  function validaCampo(campo) {
    var erro = document.getElementById('err-' + campo.id);
    var ok = true;

    if (campo.id === 'whatsapp') {
      ok = campo.value.replace(/\D/g, '').length >= 10;
    } else if (campo.id === 'nome') {
      ok = campo.value.trim().length >= 2;
    } else {
      ok = campo.value !== '';
    }

    campo.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (erro) { erro.classList.toggle('show', !ok); }
    return ok;
  }

  $$('input, select', form).forEach(function (campo) {
    campo.addEventListener('blur', function () {
      if (campo.value !== '') { validaCampo(campo); }
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var campos = $$('input[required], select[required]', form);
    var valido = true;
    var primeiroErro = null;

    campos.forEach(function (campo) {
      if (!validaCampo(campo)) {
        valido = false;
        if (!primeiroErro) { primeiroErro = campo; }
      }
    });

    if (!valido) {
      primeiroErro.focus();
      primeiroErro.scrollIntoView({ behavior: CONFIG.reduzirMovimento ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    var dados = {
      nome: $('#nome').value.trim(),
      whatsapp: $('#whatsapp').value.trim(),
      cidade: $('#cidade').value,
      projeto: $('#projeto').value,
      inicio: $('#inicio').value,
      investimento: $('#investimento').value,
      origem: window.location.href
    };

    track('Lead', { content_name: 'Formulario LP', cidade: dados.cidade });

    // Envio ao backend quando o endpoint estiver configurado.
    if (CONFIG.endpoint) {
      fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      }).catch(function () { /* o lead já está no pixel e no WhatsApp */ });
    } else {
      console.info('[endpoint pendente] lead capturado:', dados);
    }

    // Mensagem pronta para o WhatsApp
    var texto =
      'Olá! Vim pelo site da ON.\n\n' +
      'Nome: ' + dados.nome + '\n' +
      'Cidade da obra: ' + dados.cidade + '\n' +
      'Projeto: ' + dados.projeto + '\n' +
      'Início: ' + dados.inicio + '\n' +
      'Investimento: ' + dados.investimento;

    if (waLink) {
      waLink.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto);
      waLink.addEventListener('click', function () { track('Contact', { origem: 'pos-formulario' }); });
    }

    form.classList.add('is-sent');
    if (sucesso) {
      sucesso.classList.add('show');
      sucesso.scrollIntoView({ behavior: CONFIG.reduzirMovimento ? 'auto' : 'smooth', block: 'center' });
    }
  });
})();
