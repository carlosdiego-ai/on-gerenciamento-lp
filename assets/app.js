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
    reduzirMovimento: window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
