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
// 8. PLANILHA — CARDS EXPANSÍVEIS E CLIQUE NAS CÉLULAS
//    - Abre/fecha os cards de Palestras/Mesas Redondas/Minicursos
//    - Abre o card certo sozinho quando uma célula da planilha
//      (ou uma URL com âncora) aponta para dentro dele
//
// ============================================

//
// DESLIGA A "RESTAURAÇÃO DE SCROLL" AUTOMÁTICA DO NAVEGADOR
//
// Por padrão, ao dar F5 (recarregar), o navegador tenta voltar
// pra MESMA posição de rolagem em que a página estava antes —
// então um F5 no meio da planilha "puxa" a página de volta pra lá
// mesmo depois do recarregamento. history.scrollRestoration =
// 'manual' desliga esse comportamento automático, então a página
// simplesmente recarrega do topo (scrollY = 0), como qualquer
// primeira visita.
//
// Fica FORA do DOMContentLoaded (não precisa esperar o HTML
// carregar — é uma propriedade da API de histórico do navegador,
// não do DOM) e o mais cedo possível no arquivo, pra "ganhar" do
// navegador antes que ele tente restaurar a posição antiga.
//
// Não interfere com o pulo automático para uma URL com âncora
// (ex: programacao.html#pouya) — são dois mecanismos totalmente
// independentes; esse continua funcionando normalmente (ver Seção
// 8, mais abaixo, que já trata esse caso).
//
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

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

    // ----- FUNÇÃO: EXTRAIR O "NOME DA PÁGINA" DE UM CAMINHO -----
    //
    // Recebe um pathname completo (ex: "/cafis-ufv/programacao.html")
    // e devolve só o nome do arquivo, em minúsculas e SEM a
    // extensão .html (ex: "programacao").
    //
    // Por quê tirar a extensão e normalizar maiúsculas/minúsculas?
    // Este site é hospedado via GitHub Pages (deploy por git push),
    // e times de hospedagem estática às vezes servem a MESMA página
    // por uma URL ligeiramente diferente da que está escrita no
    // HTML — com maiúsculas/minúsculas diferentes (o servidor é
    // Linux, sensível a isso; testar localmente no Windows nunca
    // pegaria esse tipo de diferença) ou até sem a extensão .html.
    // Comparar de forma mais "solta" (sem extensão, sem diferenciar
    // caixa) evita que a detecção de página ativa quebre silenciosa-
    // mente só por causa de uma dessas diferenças.
    //
    function getPageName(pathname) {
        // .split('/').pop() pega o ÚLTIMO segmento do caminho,
        // não importa quantas pastas vierem antes (então funciona
        // tanto em "/programacao.html" quanto em
        // "/cafis-ufv/programacao.html", por exemplo).
        //
        // Se vier vazio (a "raiz" do site, tipo "/" ou
        // "/cafis-ufv/"), cai no "|| 'index.html'".
        const fileName = pathname.split('/').pop() || 'index.html';

        return fileName.toLowerCase().replace(/\.html$/, '');
    }

    // window.location.pathname = caminho da URL após o domínio
    // (não inclui querystring "?" nem âncora "#")
    const currentPage = getPageName(window.location.pathname);

    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(function(link) {
        // link.pathname (diferente de link.getAttribute('href')) é
        // uma propriedade que o PRÓPRIO NAVEGADOR calcula: o
        // caminho ABSOLUTO e já resolvido do link, considerando
        // automaticamente a pasta em que o site está publicado.
        // Usamos ela em vez do texto cru do href porque ela reflete
        // como o navegador REALMENTE entende aquele link, ali,
        // naquele domínio — mais confiável do que comparar strings
        // "na mão".
        const linkPage = getPageName(link.pathname);

        if (linkPage === currentPage) {
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
    //
    // CADA GRUPO SE CONFIGURA SOZINHO, VIA ATRIBUTOS DATA-* NO HTML
    //
    // Quantos grupos existem, onde cada um fica (top/right/bottom/
    // left), o tamanho dos anéis (min/max raio), se tem o texto
    // curvo "VIII SEAFís" e a velocidade/sentido de rotação — tudo
    // isso é lido diretamente do HTML de cada página (atributos
    // data-top, data-right, data-bottom, data-left, data-min-radius,
    // data-max-radius, data-text, data-speed em cada .content-circles
    // — ver o comentário completo em main.css). Isso significa que
    // adicionar um grupo novo, remover um, ou mudar a posição/
    // velocidade de um já existente é uma mudança SÓ no HTML —
    // nada aqui precisa mudar.

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

        // ----- ANIMAÇÃO DE "CONSTRUÇÃO" DE CADA ANEL -----
        //
        // stroke-dasharray + stroke-dashoffset é a técnica clássica
        // pra "desenhar" um traço aos poucos: dasharray define UM
        // traço do tamanho exato do contorno inteiro (o "comprimento
        // de arco" do círculo, 2πr) — e começamos com dashoffset
        // igual a esse mesmo valor, o que desloca o traço inteiro
        // pra fora de vista (como se ainda não tivesse sido
        // desenhado). Reduzir o dashoffset até 0 (feito mais abaixo,
        // depois do elemento já estar na página) "completa" o
        // traço, dando a impressão de ele estar sendo construído.
        //
        // transform="rotate(...)" muda o PONTO onde esse traçado
        // começa (sem isso, todo anel nasceria do mesmo ponto,
        // ficando repetitivo) e, em metade dos anéis (escolha
        // aleatória), um "scale(-1,1)" espelha o anel em torno do
        // próprio centro — visualmente, isso INVERTE o sentido em
        // que ele parece se construir (horário vira anti-horário).
        //
        function ringRevealAttrs(pathLength, ringIndex, allowRotateAndMirror) {
            const duration = (3 + Math.random() * 3.5).toFixed(2);
            const delay = (ringIndex * 0.3 + Math.random() * 0.5).toFixed(2);

            let transformAttr = '';
            if (allowRotateAndMirror) {
                const startAngle = Math.round(Math.random() * 360);
                transformAttr = 'transform="rotate(' + startAngle + ' ' + center + ' ' + center + ')';
                if (Math.random() < 0.5) {
                    transformAttr += ' translate(' + (center * 2) + ' 0) scale(-1,1)';
                }
                transformAttr += '" ';
            }

            return {
                duration: duration,
                delay: delay,
                markup: 'class="content-circles-ring" ' + transformAttr +
                    'stroke-dasharray="' + pathLength + '" stroke-dashoffset="' + pathLength + '" ' +
                    'style="transition: stroke-dashoffset ' + duration + 's cubic-bezier(0.65,0,0.35,1) ' + delay + 's;"'
            };
        }

        // Um <circle> por anel — fill="none" porque queremos só o
        // CONTORNO (a "rosquinha"), não um disco cheio. O anel que
        // vai levar o texto (ver abaixo) é pulado aqui: ele é
        // desenhado por inteiro à parte, como um ARCO com um vão,
        // não como um <circle> fechado.
        rings.forEach(function(ring, index) {
            if (index === textRingIndex) return;

            const circumference = 2 * Math.PI * ring.radius;
            const reveal = ringRevealAttrs(circumference, index, true);

            svgParts.push(
                '<circle cx="' + center + '" cy="' + center + '" r="' + ring.radius +
                '" fill="none" stroke="' + ringColor + '" stroke-width="' + ring.thickness + '" ' +
                reveal.markup + '></circle>'
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

            // Sem rotação/espelhamento aleatórios aqui — diferente
            // dos <circle> fechados acima, ESTE anel precisa manter
            // o vão sempre no topo (pro texto ficar legível e no
            // lugar certo); só a "velocidade de construção" varia.
            const arcLength = r * (360 - gapAngleDeg) * Math.PI / 180;
            const reveal = ringRevealAttrs(arcLength, textRingIndex, false);

            svgParts.push(
                '<path d="M ' + arcStart.x + ',' + arcStart.y +
                ' A ' + r + ',' + r + ' 0 1,1 ' + arcEnd.x + ',' + arcEnd.y +
                '" fill="none" stroke="' + ringColor + '" stroke-width="' + ring.thickness + '" ' +
                reveal.markup + '></path>'
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

            // O texto só aparece (fade em opacity) perto do FIM da
            // construção do próprio anel — parece "surgir" assim
            // que o traço termina de contornar o vão, em vez de já
            // estar visível enquanto o anel ainda está se desenhando.
            const textFadeDelay = (parseFloat(reveal.delay) + parseFloat(reveal.duration) * 0.7).toFixed(2);

            // FILL + STROKE = a mesma "formatação de h1" usada no
            // resto do site (color: #eeb97c + -webkit-text-stroke:
            // 1.5px #564d46, em main.css) — só que aqui é texto de
            // <svg>, então usamos os atributos nativos fill/stroke
            // em vez de propriedades CSS.
            svgParts.push(
                '<text class="content-circles-text" text-anchor="middle" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" ' +
                'font-weight="700" font-size="' + fontSize + '" fill="#eeb97c" ' +
                'stroke="#564d46" stroke-width="' + Math.max(0.5, fontSize * 0.05) + '" ' +
                'letter-spacing="1" ' +
                'style="opacity: 0; transition: opacity 0.6s ease ' + textFadeDelay + 's;">' +
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

        // ----- DISPARA A ANIMAÇÃO -----
        //
        // Os elementos acima nasceram com stroke-dashoffset (e o
        // texto, opacity) já no estado "escondido" — se a gente
        // mudasse pro estado final JUNTO com o innerHTML, o
        // navegador nunca chegaria a pintar o estado inicial, e a
        // transição do CSS não teria "de onde" animar (só pintaria
        // o resultado final direto, sem transição nenhuma).
        //
        // Um requestAnimationFrame só, às vezes, ainda cai ANTES do
        // navegador terminar de pintar o estado inicial (o "outro"
        // rAF, dentro deste, garante que já passamos por um quadro
        // de pintura completo) — daí o duplo requestAnimationFrame,
        // um padrão comum pra esse tipo de "anima a partir do
        // estado inicial" em JavaScript puro.
        //
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                container.querySelectorAll('.content-circles-ring').forEach(function(ringEl) {
                    ringEl.style.strokeDashoffset = '0';
                });

                const textEl = container.querySelector('.content-circles-text');
                if (textEl) textEl.style.opacity = '1';
            });
        });
    }

    // ----- MONTAGEM DOS GRUPOS (LÊ OS ATRIBUTOS DATA-* DE CADA UM) -----
    //
    // document.querySelectorAll('.content-circles') pega QUALQUER
    // quantidade de grupos que existir na página — 2, 4, 10, o
    // número que o HTML definir. Para cada um, lemos seus próprios
    // atributos data-* (com um valor padrão para qualquer um que
    // faltar) e desenhamos os anéis de acordo.
    //
    const pageHeight = document.body.scrollHeight;

    // Guarda {elemento, velocidade} de cada grupo à medida que
    // processamos — usado pelo listener de scroll, logo abaixo, sem
    // precisar percorrer os elementos uma segunda vez.
    const rotatingCircles = [];

    document.querySelectorAll('.content-circles').forEach(function(container) {
        // ----- POSIÇÃO: TOP / RIGHT / BOTTOM / LEFT -----
        //
        // container.dataset.top lê o atributo "data-top" do HTML
        // (o navegador converte "data-top" para "dataset.top"
        // automaticamente — e "data-min-radius" para
        // "dataset.minRadius", com o traço virando camelCase).
        // Só aplicamos como estilo o lado que REALMENTE foi
        // definido: um grupo só com data-bottom, por exemplo, fica
        // ancorado pelo fim do <main>, sem "top" nenhum atrapalhando.
        ['top', 'right', 'bottom', 'left'].forEach(function(side) {
            if (container.dataset[side]) {
                container.style[side] = container.dataset[side];
            }
        });

        // ----- RAIO MÍNIMO/MÁXIMO -----
        //
        // parseFloat converte o texto do atributo ("45") para
        // número de verdade (45). Se o atributo não existir,
        // parseFloat(undefined) retorna NaN — e NaN é "falsy" em
        // JavaScript, então o "||" entra em ação e usa o valor
        // padrão.
        const minRadius = parseFloat(container.dataset.minRadius) || 60;
        const maxRadius = parseFloat(container.dataset.maxRadius) || 250;

        // ----- TEXTO CURVO: SIM OU NÃO? -----
        //
        // Só vira "true" se o atributo existir E valer exatamente
        // a palavra "true" — omitido, vazio, ou qualquer outro
        // valor conta como "false".
        const withText = container.dataset.text === 'true';

        // ----- VELOCIDADE (E SENTIDO) DE ROTAÇÃO -----
        //
        // Sem data-speed no HTML, o grupo simplesmente não gira
        // (0 = parado).
        const speed = parseFloat(container.dataset.speed) || 0;

        const rings = buildRingsForGroup(minRadius, maxRadius, pageHeight);

        let textRingIndex = -1;
        if (withText) {
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

        rotatingCircles.push({ element: container, speed: speed });
    });

    // ----- ROTAÇÃO NO SCROLL -----
    //
    // Gira cada grupo (o <svg> inteiro — anéis e, quando houver,
    // texto curvo, sempre juntos, como uma peça rígida só) conforme
    // o usuário rola a página, como se fossem órbitas de um átomo
    // em movimento. Um detalhe importante: um círculo com anéis
    // totalmente sólidos é SIMÉTRICO — girar não mudaria nada
    // visualmente. É o texto curvo (que não é simétrico) que torna
    // a rotação de um grupo COM texto perceptível; um grupo sem
    // texto (data-text ausente/"false") gira "de fé" (sem quebra de
    // simetria própria), mas ainda contribui para a sensação de
    // profundidade quando cada grupo usa um data-speed diferente.
    //
    // A cada evento de scroll, lemos quantos pixels a página rolou
    // (window.scrollY) e transformamos esse valor em um ângulo de
    // rotação — data-speed é o fator multiplicador: valores pequenos
    // (ex: 0.05) giram bem devagar; maiores, mais rápido; negativos
    // invertem o sentido.
    //
    window.addEventListener('scroll', function() {
        rotatingCircles.forEach(function(circle) {
            if (circle.speed === 0) return;

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

    // ==========================================
    // SEÇÃO 9: PLANILHA — CARDS EXPANSÍVEIS E CLIQUE NAS CÉLULAS
    // ==========================================
    //
    // Só existe conteúdo pra isso em programacao.html: os
    // palestrantes/mesas ficam agrupados em 3 cards (Palestras /
    // Mesas Redondas / Minicursos — ver .program-card, em
    // main.css) que abrem/fecham independentemente. Nas outras
    // páginas, os querySelectorAll abaixo simplesmente não
    // encontram nada, e os blocos "if" fazem esse código não
    // fazer nada nesse caso.
    //

    const programCardToggles = document.querySelectorAll('.program-card-toggle');
    const programCardContents = document.querySelectorAll('.program-card-content');

    // ----- FUNÇÃO: MOSTRAR/ESCONDER O 4º GRUPO DE CÍRCULOS -----
    //
    // Ver .content-circles[data-hide-if-collapsed], em main.css —
    // esse grupo específico (marcado com esse atributo no HTML)
    // some enquanto os 3 cards estiverem fechados, porque a página
    // fica curta demais pra ele sem colar no grupo anterior.
    // Chamada toda vez que um card abre/fecha, pra reavaliar se
    // ALGUM continua aberto (não precisa ser o mesmo que acabou de
    // mudar).
    //
    const collapsibleCircleGroup = document.querySelector('.content-circles[data-hide-if-collapsed]');

    function updateCollapsibleCircleGroup() {
        if (!collapsibleCircleGroup) return;

        const anyCardOpen = Array.prototype.some.call(programCardContents, function(content) {
            return content.classList.contains('program-card-content--open');
        });

        collapsibleCircleGroup.classList.toggle('content-circles--visible', anyCardOpen);
    }

    // ----- FUNÇÃO: FECHAR TODOS OS OUTROS CARDS -----
    //
    // Só um card fica aberto por vez — um "acordeão" de verdade.
    // Recebe o <button> do card que DEVE continuar como está (o
    // que acabou de abrir) e fecha todos os outros.
    //
    function closeOtherCards(exceptToggle) {
        programCardToggles.forEach(function(toggle) {
            if (toggle === exceptToggle) return;

            const content = document.getElementById(toggle.getAttribute('aria-controls'));
            if (content) content.classList.remove('program-card-content--open');

            toggle.setAttribute('aria-expanded', 'false');
        });
    }

    // ----- ABRIR/FECHAR AO CLICAR NO CABEÇALHO DO CARD -----
    programCardToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            const content = document.getElementById(toggle.getAttribute('aria-controls'));
            if (!content) return;

            // classList.toggle() devolve TRUE se a classe FICOU
            // presente depois da chamada (o card abriu) e FALSE se
            // foi removida (fechou) — mesmo padrão já usado no
            // menu hambúrguer, na Seção 8.
            const isOpen = content.classList.toggle('program-card-content--open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            if (isOpen) {
                // Se este acabou de abrir, fecha qualquer outro que
                // já estivesse aberto.
                closeOtherCards(toggle);

                // ----- MANTÉM O CARD RECÉM-ABERTO NO TOPO DA TELA -----
                //
                // Sem isso, ao trocar de um card grande (aberto) para
                // outro bem menor, a posição de rolagem ANTIGA podia
                // sobrar além do fim da página (agora mais curta),
                // jogando a tela pro rodapé. Rolar até o próprio
                // cabeçalho do card resolve isso sempre, não só nesse
                // caso — scroll-margin-top nele (ver main.css) já
                // garante a folga certa por baixo do navbar fixo.
                //
                // O atraso de 500ms espera a transição de FECHAR os
                // outros cards (mesma duração do max-height em
                // .program-card-content) terminar antes de rolar —
                // senão a rolagem miraria numa posição que ainda ia
                // se mover embaixo dela.
                setTimeout(function() {
                    toggle.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            }

            updateCollapsibleCircleGroup();
        });
    });

    // ----- FUNÇÃO: ABRIR O CARD QUE CONTÉM UM ELEMENTO -----
    //
    // Recebe o elemento-alvo (ex: o <h1 id="pouya">) e, se ele
    // estiver dentro de um .program-card-content ainda fechado,
    // abre esse card — mesma troca de classe/aria-expanded do
    // clique manual, acima. Devolve TRUE só quando o card ESTAVA
    // fechado e acabou de abrir agora, para quem chamou saber se
    // precisa esperar a transição do CSS (0.4s) antes de rolar.
    //
    function openCardContaining(targetElement) {
        const content = targetElement.closest('.program-card-content');
        if (!content || content.classList.contains('program-card-content--open')) {
            return false;
        }

        content.classList.add('program-card-content--open');

        const toggle = document.querySelector('.program-card-toggle[aria-controls="' + content.id + '"]');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');

        // Mesma regra do clique manual no cabeçalho: só um card
        // aberto por vez.
        closeOtherCards(toggle);
        updateCollapsibleCircleGroup();

        return true;
    }

    // ----- CLIQUE NUMA CÉLULA CLICÁVEL DA PLANILHA -----
    //
    // Sem isso, o link só rolaria direto (comportamento padrão do
    // navegador para um href="#algo"), ignorando que o alvo pode
    // estar escondido dentro de um card fechado (max-height: 0 —
    // ver .program-card-content, em main.css). Em vez disso: abre
    // o card certo primeiro (se preciso) e SÓ DEPOIS rola — com um
    // pequeno atraso igual à duração da transição do CSS (0.4s),
    // pra rolar até a posição JÁ EXPANDIDA, não a de antes de abrir.
    //
    document.querySelectorAll('.schedule-cell-link').forEach(function(link) {
        link.addEventListener('click', function(event) {
            const href = link.getAttribute('href');
            if (!href || href.charAt(0) !== '#') return;

            const target = document.getElementById(href.slice(1));
            if (!target) return;

            event.preventDefault();

            const justOpened = openCardContaining(target);

            if (justOpened) {
                setTimeout(function() {
                    target.scrollIntoView({ behavior: 'smooth' });
                }, 400);
            } else {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ----- CARREGAR A PÁGINA JÁ COM UMA ÂNCORA NA URL -----
    //
    // Ex: alguém acessa programacao.html#pouya direto (um link
    // salvo, ou o botão "voltar" do navegador). Sem isso, o
    // navegador tenta pular pra lá ANTES deste script rodar, e
    // como o card começa fechado, o salto cai no lugar errado.
    // Só entra em ação quando o alvo realmente está dentro de um
    // card — outras âncoras da página (ex: #planilha) continuam
    // com o salto padrão do navegador, sem esse atraso extra.
    //
    if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        const content = target ? target.closest('.program-card-content') : null;

        if (content) {
            openCardContaining(target);
            setTimeout(function() {
                target.scrollIntoView({ behavior: 'smooth' });
            }, 400);
        }
    }

});
