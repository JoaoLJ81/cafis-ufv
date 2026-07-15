// ============================================
// MAIN.JS — SEAFís (Semana Acadêmica de Física) / CAFís
// ============================================
//
// Este arquivo contém TODA a lógica JavaScript do site.
// Ele é dividido em módulos funcionais:
//
// 1. CARROSSEL DA HERO (initCarousel)
//    - Troca automática de slides, com setas/indicadores/legenda
//
// 2. NAVEGAÇÃO POR TECLADO
//    - Setas do teclado controlam o carrossel hero
//
// 3. NAVBAR — DETECÇÃO DE SCROLL
//    - Adiciona sombra quando rola a página
//
// 4. HIGHLIGHT DO MENU ATIVO
//    - Marca o item do menu correspondente à página atual
//
// 5. CÍRCULOS DECORATIVOS
//    - Monta os anéis de fundo em SVG (quantidade/espessura/raio
//      meio aleatórios, com texto curvo "VIII SEAFís" em um deles)
//    - Gira o conjunto conforme a página é rolada
//
// 6. BOTÃO "VOLTAR AO TOPO" (todas as páginas)
//    - Aparece depois de rolar a página, rola suavemente de volta
//
// 7. MENU HAMBÚRGUER (telas estreitas)
//    - Abre/fecha o painel de navegação em telas abaixo de 768px
//
// ============================================

//
// DOMContentLoaded = evento que dispara quando TODO o HTML foi
// carregado e parseado pelo navegador. É o momento seguro para
// o JavaScript manipular elementos da página.
//
document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // SEÇÃO 1: CARROSSEL DA HERO
    // ==========================================
    //
    // initCarousel troca os slides automaticamente, com setas,
    // indicadores (bolinhas) e legendas — usado hoje só pela hero
    // de index.html (é a única página com carrossel), mas escrito
    // de forma genérica (aceita qualquer seletor ou elemento) caso
    // um segundo carrossel apareça no site no futuro.
    //
    // ==========================================

    function initCarousel(containerOrSelector, options) {
        //
        // PARÂMETROS:
        //
        // containerOrSelector (string | Element)
        //   - Se for string: um seletor CSS como '.hero'
        //   - Se for Element: um elemento DOM já selecionado
        //
        // options (objeto)
        //   Configurações opcionais:
        //   - autoPlayInterval: tempo entre slides em ms (padrão: 5000 = 5s)
        //   - transitionDuration: duração do fade em ms (padrão: 1000 = 1s)
        //   - pauseOnHover: pausa o auto-play quando o mouse entra (padrão: true)
        //

        // ----- PASSO 1: CONFIGURAÇÕES -----
        //
        // Object.assign copia propriedades de um objeto para outro.
        // Aqui usamos para mesclar as opções passadas com os valores padrão.
        //
        // Sintaxe: Object.assign(alvo, fonte1, fonte2, ...)
        // Se uma propriedade existir em ambos, o valor da última fonte vence.
        //
        const config = Object.assign({
            autoPlayInterval: 5000,
            transitionDuration: 1000,
            pauseOnHover: true
        }, options || {});
        //
        // O "|| {}" garante que se options for undefined/null, usamos
        // um objeto vazio, evitando erro.
        //

        // ----- PASSO 2: SELECIONAR O CONTAINER -----
        //
        // typeof retorna uma string com o tipo do valor:
        // typeof "texto" → "string"
        // typeof document.body → "object" (Element é um objeto)
        //
        let container;
        if (typeof containerOrSelector === 'string') {
            // querySelector retorna o PRIMEIRO elemento que corresponde
            // ao seletor CSS, ou null se não encontrar nada.
            container = document.querySelector(containerOrSelector);
        } else {
            // Já é um elemento DOM, usa diretamente.
            container = containerOrSelector;
        }

        // Guard clause (cláusula de guarda): se não achou o container,
        // sai da função imediatamente. Evita erros de "cannot read
        // property of null".
        if (!container) return;

        // ----- PASSO 3: SELECIONAR ELEMENTOS INTERNOS -----
        const items = container.querySelectorAll('.carousel-slide');
        const indicators = container.querySelectorAll('.indicator');
        const prevBtn = container.querySelector('.carousel-arrow-prev');
        const nextBtn = container.querySelector('.carousel-arrow-next');
        const captions = container.querySelectorAll('.slide-caption');

        // Se não houver slides, não há carrossel aqui.
        if (items.length === 0) return;

        // ----- PASSO 4: VARIÁVEIS DE ESTADO -----
        //
        // currentIndex: qual slide está visível agora (0 = primeiro)
        // autoPlayTimer: referência ao setInterval (para poder parar depois)
        //
        let currentIndex = 0;
        let autoPlayTimer = null;

        // ----- PASSO 5: FUNÇÃO goToItem -----
        //
        // Esta função muda o slide ativo para um índice específico.
        // Ela remove a classe 'active' do slide atual e adiciona no novo.
        //
        // A classe 'active' é o que controla a visibilidade via CSS
        // (opacity: 1 vs opacity: 0, com transition para animar).
        //
        function goToItem(index) {
            // Remove 'active' do item atual
            items[currentIndex].classList.remove('active');
            if (indicators.length > 0) {
                indicators[currentIndex].classList.remove('active');
            }
            if (captions.length > 0) {
                captions[currentIndex].classList.remove('active');
            }

            // Atualiza o índice
            currentIndex = index;

            // Adiciona 'active' no NOVO item
            items[currentIndex].classList.add('active');
            if (indicators.length > 0) {
                indicators[currentIndex].classList.add('active');
            }
            if (captions.length > 0) {
                captions[currentIndex].classList.add('active');
            }
        }

        // ----- PASSO 6: FUNÇÕES DE NAVEGAÇÃO -----
        //
        // O operador % (módulo) garante que o índice "dê a volta":
        // Se temos 3 slides (0, 1, 2) e estamos no 2:
        //   (2 + 1) % 3 = 3 % 3 = 0 → volta para o primeiro
        //
        // Isso cria o efeito de loop infinito do carrossel.
        //
        function nextItem() {
            const next = (currentIndex + 1) % items.length;
            goToItem(next);
        }

        function prevItem() {
            // O + items.length antes do % evita número negativo:
            // Se currentIndex = 0 e items.length = 3:
            //   (0 - 1 + 3) % 3 = 2 % 3 = 2 → vai para o último
            const prev = (currentIndex - 1 + items.length) % items.length;
            goToItem(prev);
        }

        // ----- PASSO 7: AUTO-PLAY -----
        //
        // setInterval executa uma função repetidamente, a cada X ms.
        // Retorna um ID numérico que podemos usar para cancelar
        // com clearInterval.
        //
        function startAutoPlay() {
            if (items.length > 1) {
                autoPlayTimer = setInterval(nextItem, config.autoPlayInterval);
            }
        }

        function stopAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        }

        // ----- PASSO 8: EVENT LISTENERS -----
        //
        // addEventListener "escuta" um evento em um elemento.
        // Quando o evento ocorre, a função callback é executada.
        //
        // 'click' → mouse clicou
        // 'mouseenter' → mouse entrou no elemento
        // 'mouseleave' → mouse saiu do elemento
        //

        // Seta "próximo" (→)
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                stopAutoPlay();
                nextItem();
                startAutoPlay();
            });
        }

        // Seta "anterior" (←)
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                stopAutoPlay();
                prevItem();
                startAutoPlay();
            });
        }

        // Indicadores (bolinhas)
        // forEach executa a função para CADA elemento da NodeList.
        // O segundo parâmetro da callback é o índice do elemento.
        indicators.forEach(function(indicator, index) {
            indicator.addEventListener('click', function() {
                stopAutoPlay();
                goToItem(index);
                startAutoPlay();
            });
        });

        // Pausa no hover (se habilitado)
        // Quando o mouse entra no carrossel, para o auto-play.
        // Quando sai, reinicia. Isso dá controle ao usuário.
        if (config.pauseOnHover) {
            container.addEventListener('mouseenter', stopAutoPlay);
            container.addEventListener('mouseleave', startAutoPlay);
        }

        // ----- PASSO 9: INICIALIZAÇÃO -----
        //
        // Inicia o auto-play automaticamente quando o carrossel é criado.
        //
        startAutoPlay();
    }

    // ==========================================
    // SEÇÃO 2: INICIALIZAR CARROSSEL DA HERO
    // ==========================================

    initCarousel('.hero', {
        autoPlayInterval: 5000,  // Troca a cada 5 segundos
        transitionDuration: 1000 // Fade de 1 segundo
    });

    // ==========================================
    // SEÇÃO 3: NAVEGAÇÃO POR TECLADO
    // ==========================================
    //
    // Permite usar as setas ← → do teclado para navegar
    // no carrossel principal da hero.
    //

    document.addEventListener('keydown', function(event) {
        // Ignora se o foco está em um campo de texto
        // (não queremos trocar slide enquanto digita)
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        const hero = document.querySelector('.hero');
        if (!hero) return;

        // getBoundingClientRect() retorna a posição e dimensões
        // do elemento em relação à viewport (tela visível).
        //
        // rect.top < window.innerHeight → topo do hero está acima
        //   da parte inferior da tela (hero está visível)
        // rect.bottom > 0 → base do hero está abaixo do topo da tela
        //
        const heroRect = hero.getBoundingClientRect();
        const isVisible = heroRect.top < window.innerHeight && heroRect.bottom > 0;

        if (!isVisible) return; // Só funciona se hero está visível

        if (event.key === 'ArrowRight') {
            const nextBtn = hero.querySelector('.carousel-arrow-next');
            if (nextBtn) nextBtn.click(); // Simula clique na seta
        } else if (event.key === 'ArrowLeft') {
            const prevBtn = hero.querySelector('.carousel-arrow-prev');
            if (prevBtn) prevBtn.click();
        }
    });

    // ==========================================
    // SEÇÃO 4: NAVBAR — DETECÇÃO DE SCROLL
    // ==========================================

    const navbar = document.getElementById('navbar');
    if (navbar) {
        // scrollY = quantos pixels a página foi rolada para baixo
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ==========================================
    // SEÇÃO 5: HIGHLIGHT DO ITEM ATIVO DO MENU
    // ==========================================
    //
    // Verifica a URL atual e marca o item do menu correspondente
    // com a classe 'active', destacando visualmente a página atual.
    //

    // window.location.pathname = caminho da URL após o domínio
    // Ex: "/programacao.html"
    //
    // .split('/') divide em partes: ["", "programacao.html"]
    // .pop() pega o último elemento: "programacao.html"
    // || 'index.html' → se estiver vazio (página raiz), usa index.html
    //
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(function(link) {
        const href = link.getAttribute('href');

        // Compara o href do link com a página atual
        // Também aceita './' + currentPage para links relativos
        if (href && (href === currentPage || href === './' + currentPage)) {

            // Remove 'active' de TODOS os nav-item primeiro
            document.querySelectorAll('.nav-item').forEach(function(item) {
                item.classList.remove('active');
            });

            // Adiciona 'active' ao item pai do link
            const parentItem = link.closest('.nav-item');
            if (parentItem) {
                parentItem.classList.add('active');
            }
        }
    });

    // ==========================================
    // SEÇÃO 6: CÍRCULOS DECORATIVOS
    // ==========================================
    //
    // As .content-circles (definidas em main.css) são a "marca
    // d'água" de anéis concêntricos atrás do texto do <main>. Esta
    // seção faz duas coisas: (A) MONTA os anéis — em quantidade,
    // espessura e raio meio aleatórios, mais anéis em páginas mais
    // compridas — e (B) GIRA o conjunto conforme o usuário rola a
    // página.
    //
    // Por que montar os anéis via JavaScript, e não deixar tudo
    // pronto no CSS (como era antes)? Porque "quantos anéis" e "que
    // tamanho eles têm" agora dependem de coisas que só o JS sabe
    // em tempo de execução: a altura REAL da página (que muda de
    // página para página, e pode crescer no futuro) e um elemento
    // de aleatoriedade. CSS não tem como "sortear" um número nem
    // reagir à altura do documento.

    // ----- FUNÇÃO: CONSTRUIR OS ANÉIS DE UM GRUPO -----
    //
    // Recebe as regras de um grupo (raio mínimo/máximo, se ganha o
    // texto curvo) e devolve a LISTA de anéis (cada um com seu
    // próprio raio e espessura) que esse grupo vai ter.
    //
    function buildRingsForGroup(minRadius, maxRadius, pageHeight) {
        // ----- QUANTOS ANÉIS? -----
        //
        // Base de 3 + um extra a cada ~900px de altura da página
        // (páginas mais compridas "ganham" mais anéis) + de 0 a 2
        // extras aleatórios, com teto de 8 para não virar bagunça
        // em páginas muito compridas.
        const extraFromHeight = Math.floor(pageHeight / 900);
        const extraRandom = Math.floor(Math.random() * 3);
        const ringCount = Math.min(3 + extraFromHeight + extraRandom, 8);

        // ----- RAIO E ESPESSURA DE CADA ANEL -----
        //
        // Começa perto do raio mínimo do grupo e cresce por um
        // espaço ALEATÓRIO a cada anel (o "gap") — por isso nem o
        // tamanho dos anéis nem a distância entre eles é uniforme.
        const rings = [];
        let radius = minRadius + Math.random() * 15;

        for (let i = 0; i < ringCount; i++) {
            const thickness = 3 + Math.random() * 9; // entre 3px e 12px
            rings.push({ radius: radius, thickness: thickness });

            const gap = 16 + Math.random() * 26; // vão de 16px a 42px até o próximo anel
            radius += gap;
        }

        // O último anel pode ter passado do teto do grupo — reescala
        // TODOS os raios (mantendo a proporção entre eles) para
        // caberem dentro de maxRadius. É isso que garante que o
        // grupo de cima (maxRadius menor) sempre termine menor que
        // o de baixo, como pedido.
        const outermost = rings[rings.length - 1].radius;
        if (outermost > maxRadius) {
            const scale = maxRadius / outermost;
            rings.forEach(function(ring) { ring.radius *= scale; });
        }

        return rings;
    }

    // ----- FUNÇÃO: DESENHAR OS ANÉIS (E O TEXTO CURVO) EM SVG -----
    //
    // <svg> é a ferramenta certa aqui: permite desenhar círculos
    // com raio/espessura exatos (via <circle>) e curvar texto ao
    // longo de um caminho circular (via <textPath>) — nenhuma das
    // duas coisas tem um jeito direto de ser feita só com CSS.
    //
    function renderRingsSVG(container, rings, textRingIndex) {
        const ringColor = '#558383'; // mesmo verde-água da paleta

        // O <svg> precisa ser grande o bastante para caber o maior
        // anel MAIS sua espessura, com uma margenzinha de sobra.
        const outer = rings[rings.length - 1];
        const size = Math.ceil((outer.radius + outer.thickness / 2) * 2) + 20;
        const center = size / 2;

        let svgParts = [];

        // Um <circle> por anel — fill="none" porque queremos só o
        // CONTORNO (a "rosquinha"), não um disco cheio. O anel que
        // vai levar o texto (ver abaixo) é pulado aqui: ele é
        // desenhado por inteiro à parte, como um ARCO com um vão,
        // não como um <circle> fechado.
        rings.forEach(function(ring, index) {
            if (index === textRingIndex) return;

            svgParts.push(
                '<circle cx="' + center + '" cy="' + center + '" r="' + ring.radius +
                '" fill="none" stroke="' + ringColor + '" stroke-width="' + ring.thickness + '"></circle>'
            );
        });

        // ----- O ANEL COM TEXTO: UM ARCO COM UM VÃO PARA "VIII SEAFís" -----
        //
        // Em vez de escrever o texto POR CIMA de um anel fechado, o
        // próprio anel "para" onde o texto está — sobra um espaço
        // em branco (com margem de cada lado) reservado só para o
        // texto, como um selo/medalha que interrompe o próprio
        // círculo para caber uma inscrição.
        if (textRingIndex >= 0 && rings[textRingIndex]) {
            const ring = rings[textRingIndex];
            const r = ring.radius;
            const text = 'VIII SEAFís';

            // Fonte pequena, de propósito — um DETALHE dentro do
            // anel, não um elemento chamativo. Proporcional ao raio
            // (anéis maiores, em páginas mais compridas, ganham uma
            // fonte ligeiramente maior), mas com um teto discreto.
            const fontSize = Math.min(18, Math.max(9, Math.round(r * 0.055)));

            // ----- QUANTO ESPAÇO (EM GRAUS) O VÃO PRECISA TER? -----
            //
            // Estimativa da largura do texto (não há como MEDIR o
            // texto de verdade antes de ele existir na página, então
            // aproximamos: ~0.58 × tamanho da fonte por caractere,
            // uma média razoável para fontes em negrito). Depois
            // somamos uma margem de cada lado (2.5x o tamanho da
            // fonte) — é esse espaço a mais que sobra em branco no
            // anel, ladeando o texto.
            const estimatedTextWidth = text.length * fontSize * 0.58;
            const marginWidth = fontSize * 2.5;
            const gapArcLength = estimatedTextWidth + marginWidth * 2;

            // Comprimento de arco = raio × ângulo (em radianos) — daí
            // isolamos o ângulo e convertemos para graus. Limitado a
            // 110° no máximo, pra um anel pequeno não acabar sendo
            // "quase todo vão".
            const gapAngleDeg = Math.min(110, (gapArcLength / r) * (180 / Math.PI));

            // O vão fica centralizado no TOPO do círculo (270°, já
            // que no SVG os ângulos crescem no sentido horário a
            // partir da direita) — um lugar natural para uma
            // "inscrição", como o topo de um selo.
            const gapCenterDeg = 270;
            const gapStartDeg = gapCenterDeg - gapAngleDeg / 2;
            const gapEndDeg = gapCenterDeg + gapAngleDeg / 2;

            // Converte um ângulo (em graus) num ponto x,y sobre o
            // círculo de raio r centrado em (center, center).
            function pointOnCircle(deg) {
                const rad = deg * Math.PI / 180;
                return {
                    x: center + r * Math.cos(rad),
                    y: center + r * Math.sin(rad)
                };
            }

            // O ANEL vira um ARCO: começa logo depois do vão
            // (gapEndDeg) e contorna quase todo o círculo (a volta
            // LONGA, por isso o "1" de large-arc-flag) até chegar de
            // novo em gapStartDeg pelo outro lado.
            const arcStart = pointOnCircle(gapEndDeg);
            const arcEnd = pointOnCircle(gapStartDeg + 360);
            svgParts.push(
                '<path d="M ' + arcStart.x + ',' + arcStart.y +
                ' A ' + r + ',' + r + ' 0 1,1 ' + arcEnd.x + ',' + arcEnd.y +
                '" fill="none" stroke="' + ringColor + '" stroke-width="' + ring.thickness + '"></path>'
            );

            // Caminho INVISÍVEL só dentro do vão (a volta CURTA,
            // large-arc-flag "0"), por onde o texto vai "andar".
            // text-anchor="middle" + startOffset="50%" centralizam o
            // texto exatamente no meio desse vão.
            const textPathId = 'content-circles-text-path-' + Math.round(Math.random() * 1000000);
            const gapStartPoint = pointOnCircle(gapStartDeg);
            const gapEndPoint = pointOnCircle(gapEndDeg);
            svgParts.push(
                '<path id="' + textPathId + '" d="M ' + gapStartPoint.x + ',' + gapStartPoint.y +
                ' A ' + r + ',' + r + ' 0 0,1 ' + gapEndPoint.x + ',' + gapEndPoint.y +
                '" fill="none"></path>'
            );

            // FILL + STROKE = a mesma "formatação de h1" usada no
            // resto do site (color: #eeb97c + -webkit-text-stroke:
            // 1.5px #564d46, em main.css) — só que aqui é texto de
            // <svg>, então usamos os atributos nativos fill/stroke
            // em vez de propriedades CSS.
            svgParts.push(
                '<text text-anchor="middle" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" ' +
                'font-weight="700" font-size="' + fontSize + '" fill="#eeb97c" ' +
                'stroke="#564d46" stroke-width="' + Math.max(0.5, fontSize * 0.05) + '" ' +
                'letter-spacing="1">' +
                    '<textPath href="#' + textPathId + '" xlink:href="#' + textPathId + '" startOffset="50%">' +
                        text +
                    '</textPath>' +
                '</text>'
            );
        }

        container.innerHTML =
            '<svg width="' + size + '" height="' + size + '" ' +
            'viewBox="0 0 ' + size + ' ' + size + '" ' +
            'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'aria-hidden="true">' +
                svgParts.join('') +
            '</svg>';
    }

    // ----- MONTAGEM DOS GRUPOS -----
    //
    // minRadius/maxRadius diferentes entre os grupos garantem que o
    // de cima (top-right) SEMPRE nasça e termine menor que o de
    // baixo (bottom-left), como pedido — os dois grupos do meio
    // (mid-left/mid-right, só existem em programacao.html, mais
    // comprida) ficam com tamanhos intermediários entre os dois.
    //
    // Só os grupos "âncora" (top-right e bottom-left, presentes em
    // TODAS as páginas) recebem o texto curvo "VIII SEAFís" — os do
    // meio são só anéis lisos, para o texto não se repetir demais
    // numa página só. Cada grupo com texto escolhe seu próprio anel
    // interno (a lógica de escolha do anel e do tamanho do vão, mais
    // abaixo, já se adapta sozinha ao raio de cada grupo).
    //
    // .content-circles--mid-left/--mid-right simplesmente não
    // existem no HTML de index.html/inscricao.html — o
    // document.querySelector logo abaixo retorna null nesse caso, e
    // o "if (!container) return;" pula esse grupo sem erro nenhum.
    //
    const decorativeGroups = [
        { selector: '.content-circles--top-right', minRadius: 45, maxRadius: 190, withText: true },
        { selector: '.content-circles--mid-left', minRadius: 55, maxRadius: 230, withText: false },
        { selector: '.content-circles--mid-right', minRadius: 65, maxRadius: 260, withText: false },
        { selector: '.content-circles--bottom-left', minRadius: 80, maxRadius: 340, withText: true }
    ];

    const pageHeight = document.body.scrollHeight;

    decorativeGroups.forEach(function(group) {
        const container = document.querySelector(group.selector);
        if (!container) return;

        const rings = buildRingsForGroup(group.minRadius, group.maxRadius, pageHeight);

        let textRingIndex = -1;
        if (group.withText) {
            // NUNCA o anel mais externo (rings.length - 1) — o texto
            // deve ficar em um dos anéis INTERNOS. A fórmula abaixo
            // mira ~45% do caminho de dentro para fora (por exemplo,
            // o 3º de 8 anéis, ou o do meio em um grupo de 3),
            // sempre limitada a ficar entre o 2º anel (índice 1) e o
            // penúltimo (rings.length - 2) — nunca o primeiro nem o
            // último.
            textRingIndex = Math.floor(rings.length * 0.45);
            textRingIndex = Math.max(1, Math.min(textRingIndex, rings.length - 2));
        }

        renderRingsSVG(container, rings, textRingIndex);
    });

    // ----- ROTAÇÃO NO SCROLL -----
    //
    // Gira cada grupo (o <svg> inteiro — anéis e, quando houver,
    // texto curvo, sempre juntos, como uma peça rígida só) conforme
    // o usuário rola a página, como se fossem órbitas de um átomo
    // em movimento. Um detalhe importante: um círculo com anéis
    // totalmente sólidos é SIMÉTRICO — girar não mudaria nada
    // visualmente. É o texto curvo (que não é simétrico) que torna
    // a rotação dos grupos "âncora" (top-right/bottom-left)
    // perceptível; os grupos do meio (mid-left/mid-right, sem
    // texto) giram "de fé" (sem quebra de simetria própria), mas
    // ainda assim contribuem para a sensação de profundidade —
    // cada um dos quatro com uma velocidade e SENTIDO diferente.
    //
    // A cada evento de scroll, lemos quantos pixels a página rolou
    // (window.scrollY) e transformamos esse valor em um ângulo de
    // rotação. Como scrollY pode chegar a milhares de pixels,
    // multiplicamos por um fator bem pequeno para a rotação ser
    // lenta e suave.
    //
    const rotatingCircles = [
        { element: document.querySelector('.content-circles--top-right'), speed: 0.05 },
        { element: document.querySelector('.content-circles--mid-left'), speed: -0.03 },
        { element: document.querySelector('.content-circles--mid-right'), speed: 0.065 },
        { element: document.querySelector('.content-circles--bottom-left'), speed: -0.08 }
    ];

    window.addEventListener('scroll', function() {
        rotatingCircles.forEach(function(circle) {
            if (!circle.element) return;

            const rotationAngle = window.scrollY * circle.speed;
            circle.element.style.transform = 'rotate(' + rotationAngle + 'deg)';
        });
    });

    // ==========================================
    // SEÇÃO 7: BOTÃO "VOLTAR AO TOPO"
    // ==========================================
    //
    // Existe em TODAS as páginas (index.html, programacao.html,
    // inscricao.html) — o querySelector simplesmente não encontra
    // nada em páginas que não tiverem o botão no HTML, e o "if"
    // abaixo faz este bloco inteiro não fazer nada nesse caso, mas
    // hoje ele está presente nas três.
    //

    const backToTopButton = document.getElementById('back-to-top');

    if (backToTopButton) {
        // ----- MOSTRAR/ESCONDER CONFORME O SCROLL -----
        //
        // Mesmo padrão já usado na Seção 4 (sombra do navbar):
        // abaixo de 300px de scroll, o botão fica escondido (não
        // faz sentido oferecer "voltar" se o usuário já está perto
        // do topo da página).
        //
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        // ----- CLIQUE: ROLAR SUAVEMENTE ATÉ O TOPO -----
        //
        // window.scrollTo com behavior: 'smooth' anima o scroll até
        // o topo absoluto da página (top: 0), em vez de um ponto
        // específico — funciona igual em qualquer página, não
        // depende de nenhum id existir no HTML.
        //
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // SEÇÃO 8: MENU HAMBÚRGUER (TELAS ESTREITAS)
    // ==========================================
    //
    // Abaixo de 768px de largura (ver main.css, seção de
    // responsividade), o menu horizontal normal (.nav-list) vira
    // um painel escondido, e o botão hambúrguer (#nav-toggle)
    // abre/fecha esse painel.
    //

    const navToggle = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-list');

    if (navToggle && navList) {
        // ----- FECHAR O MENU -----
        //
        // Função separada (em vez de só dentro do toggle) porque
        // precisamos fechar o menu em MAIS de uma situação: ao
        // clicar num link, ou ao redimensionar a tela — ver abaixo.
        //
        function closeNavMenu() {
            navList.classList.remove('nav-list--open');

            // aria-expanded "false" avisa leitores de tela que o
            // menu está fechado — mesmo padrão de acessibilidade
            // usado em menus hambúrguer por toda a web.
            navToggle.setAttribute('aria-expanded', 'false');
        }

        // ----- ABRIR/FECHAR AO CLICAR NO HAMBÚRGUER -----
        //
        // classList.toggle() retorna TRUE se a classe FICOU
        // presente depois da chamada (ou seja, o menu abriu) e
        // FALSE se ela foi removida (o menu fechou) — usamos esse
        // valor direto para decidir o aria-expanded.
        //
        navToggle.addEventListener('click', function() {
            const isOpen = navList.classList.toggle('nav-list--open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // ----- FECHAR AO CLICAR EM UM LINK -----
        //
        // Sem isso, depois de tocar num link do menu (indo para
        // outra página, ou rolando até uma âncora na mesma
        // página), o painel continuaria "aberto" — o usuário só
        // notaria isso ao voltar ou ao rolar a página.
        //
        navList.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', closeNavMenu);
        });

        // ----- FECHAR AO ALARGAR A TELA -----
        //
        // Se o usuário girar um tablet para paisagem, ou redimen-
        // sionar a janela (ex: fechando o DevTools) para além de
        // 768px — o mesmo breakpoint usado no CSS — o menu volta a
        // ser o horizontal normal. Sem isso, se o painel estivesse
        // aberto no momento da mudança, ele ficaria "preso" visível
        // por cima do layout de tela larga.
        //
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeNavMenu();
            }
        });
    }

});
