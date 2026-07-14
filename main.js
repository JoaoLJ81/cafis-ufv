// ============================================
// MAIN.JS — Centro Acadêmico de Física (CAFIS)
// ============================================
//
// Este arquivo contém TODA a lógica JavaScript do site.
// Ele é dividido em módulos funcionais:
//
// 1. CARROSSEL GENÉRICO (initCarousel)
//    - Reutilizável para qualquer carrossel da página
//    - Hero, wrapped, cards de eventos
//
// 2. CARDS DE EVENTOS PASSADOS (initEventCard)
//    - Expandir/colapsar ao clicar
//    - Usa initCarousel para o carrossel interno
//
// 3. NAVEGAÇÃO POR TECLADO
//    - Setas do teclado controlam o carrossel hero
//
// 4. NAVBAR — DETECÇÃO DE SCROLL
//    - Adiciona sombra quando rola a página
//
// 5. HIGHLIGHT DO MENU ATIVO
//    - Marca o item do menu correspondente à página atual
//
// 6. CÍRCULOS DECORATIVOS — ROTAÇÃO NO SCROLL
//    - Gira os anéis de fundo conforme a página é rolada
//
// 7. BOTÃO "VOLTAR PARA A PLANILHA" (programacao.html)
//    - Aparece depois de rolar a página, rola suavemente de volta
//
// ============================================

//
// DOMContentLoaded = evento que dispara quando TODO o HTML foi
// carregado e parseado pelo navegador. É o momento seguro para
// o JavaScript manipular elementos da página.
//
document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // SEÇÃO 1: CARROSSEL GENÉRICO (REUTILIZÁVEL)
    // ==========================================
    //
    // A função initCarousel é o "coração" do sistema de carrosséis.
    // Ela foi projetada para funcionar com QUALQUER estrutura de
    // carrossel na página, desde que siga a convenção de classes.
    //
    // Isso evita código duplicado: em vez de ter uma função para
    // o carrossel da hero, outra para os wrapped, outra para os
    // cards... temos UMA ÚNICA função que serve para todos.
    //
    // ==========================================

    function initCarousel(containerOrSelector, options) {
        //
        // PARÂMETROS:
        //
        // containerOrSelector (string | Element)
        //   - Se for string: um seletor CSS como '.hero' ou '#meu-carrossel'
        //   - Se for Element: um elemento DOM já selecionado
        //   Isso dá flexibilidade: podemos passar tanto um seletor
        //   quanto o elemento diretamente.
        //
        // options (objeto)
        //   Configurações opcionais:
        //   - autoPlayInterval: tempo entre slides em ms (padrão: 5000 = 5s)
        //   - transitionDuration: duração do fade em ms (padrão: 1000 = 1s)
        //   - pauseOnHover: pausa o auto-play quando mouse entra (padrão: true)
        //   - stopPropagation: evita que clique em setas/indicadores "suba"
        //     para elementos pais (útil nos cards, para não expandir o card
        //     ao clicar na seta do carrossel)
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
            pauseOnHover: true,
            stopPropagation: false
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
        //
        // querySelectorAll retorna uma NodeList (lista de nós) com
        // TODOS os elementos que correspondem ao seletor, dentro
        // do container especificado.
        //
        // A VÍRGULA no seletor funciona como "OU":
        // '.a, .b' → seleciona elementos com classe A OU classe B
        //
        // Assim, um único querySelectorAll cobre TODAS as variações
        // de classe usadas nos diferentes carrosséis do site.
        //
        const items = container.querySelectorAll(
            '.carousel-item, .carousel-slide, .wrapped-carousel-img, .event-card-carousel-img'
        );
        const indicators = container.querySelectorAll(
            '.indicator, .wrapped-indicator, .event-card-indicator'
        );
        const prevBtn = container.querySelector(
            '.carousel-arrow-prev, .wrapped-arrow-prev, .event-card-arrow-prev'
        );
        const nextBtn = container.querySelector(
            '.carousel-arrow-next, .wrapped-arrow-next, .event-card-arrow-next'
        );
        const captions = container.querySelectorAll(
            '.slide-caption, .wrapped-carousel-caption'
        );

        
        // Se não houver slides, não há carrossel aqui.
        if (items.length === 0) return;

        // ----- PASSO 4: VARIÁVEIS DE ESTADO -----
        //
        // currentIndex: qual slide está visível agora (0 = primeiro)
        // autoPlayTimer: referência ao setInterval (para poder parar depois)
        //
        let currentIndex = 0;
        let autoPlayTimer = null;

        // ==========================================
        // BLUR LAYER — Efeito de desfoque nas bordas
        // ==========================================
        //
        // Cria uma camada extra por cima das imagens do carrossel.
        // Esta camada contém a MESMA imagem do slide ativo, mas
        // aplicamos filter: blur(12px) e mask-image para mostrar
        // o blur APENAS nas bordas (esquerda e direita).
        //
        // Resultado: centro nítido (camada 1, de baixo), bordas
        // suavemente desfocadas (camada 2, de cima).
        //
        // SÓ cria o blur-layer se estivermos dentro de um card
        // de evento (event-card-carousel), pois é lá que o CSS
        // do blur-layer está definido.
        //
        const isEventCardCarousel = container.classList.contains('event-card-carousel');
        let blurLayer = null;

        if (isEventCardCarousel) {
            blurLayer = document.createElement('div');
            blurLayer.className = 'blur-layer';
            // Insere o blur-layer DENTRO do container, como último filho
            // (assim fica acima das imagens, que têm z-index menor)
            container.appendChild(blurLayer);
        }

        // ==========================================
        // FUNÇÃO: Atualizar o blur-layer
        // ==========================================
        //
        // Sempre que mudamos de slide, atualizamos o background-image
        // do blur-layer para a mesma imagem do novo slide ativo.
        // Isso garante que o efeito de blur nas bordas sempre
        // corresponda à imagem visível no centro.
        //
        function updateBlurLayer() {
            if (!blurLayer) return;

            // Pega o slide atualmente ativo
            const activeItem = items[currentIndex];

            // Verifica se é uma <img> (tag de imagem)
            if (activeItem.tagName === 'IMG') {
                // Atualiza o background do blur-layer com a mesma URL
                blurLayer.style.backgroundImage = 'url("' + activeItem.src + '")';
                // Torna visível (opacidade controlada pelo CSS transition)
                blurLayer.style.opacity = '1';
            }
        }


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
            nextBtn.addEventListener('click', function(e) {
                // stopPropagation: impede que o evento de clique "suba"
                // na hierarquia DOM. Útil nos cards: clica na seta do
                // carrossel, mas NÃO expande o card.
                if (config.stopPropagation) {
                    e.stopPropagation();
                }
                stopAutoPlay();
                nextItem();
                startAutoPlay();
            });
        }

        // Seta "anterior" (←)
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                if (config.stopPropagation) {
                    e.stopPropagation();
                }
                stopAutoPlay();
                prevItem();
                startAutoPlay();
            });
        }

        // Indicadores (bolinhas)
        // forEach executa a função para CADA elemento da NodeList.
        // O segundo parâmetro da callback é o índice do elemento.
        indicators.forEach(function(indicator, index) {
            indicator.addEventListener('click', function(e) {
                if (config.stopPropagation) {
                    e.stopPropagation();
                }
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

        // ----- PASSO 9: API PÚBLICA DO CARROSSEL -----
        //
        // O QUE É UMA API?
        //
        // API = Application Programming Interface (Interface de Programação
        // de Aplicações). É um conjunto de funções/métodos que permitem
        // que outros códigos interajam com este carrossel.
        //
        // Por que expor uma API?
        //
        // 1. CONTROLE EXTERNO: outras partes do código podem controlar
        //    o carrossel programaticamente (ex: "vá para o slide 3")
        //
        // 2. INTEGRAÇÃO: o sistema de cards pode parar o carrossel
        //    quando o card é fechado, economizando recursos
        //
        // 3. TESTES: facilita testar o carrossel isoladamente
        //
        // Como funciona:
        //
        // Criamos um objeto com métodos e o anexamos ao elemento DOM
        // do container. Em JavaScript, podemos adicionar propriedades
        // personalizadas a qualquer objeto, incluindo elementos HTML.
        //
        // container._carouselAPI = { ... }
        //
        // O underscore (_) no início do nome é uma convenção que diz:
        // "esta propriedade é interna, não use diretamente a menos que
        // saiba o que está fazendo". É como um "privado" informal.
        //
        container._carouselAPI = {
            // Avança para o próximo slide
            next: nextItem,
            // Volta para o slide anterior
            prev: prevItem,
            // Vai para um slide específico pelo índice
            goTo: goToItem,
            // Inicia o auto-play
            start: startAutoPlay,
            // Para o auto-play
            stop: stopAutoPlay,
            // Retorna o índice do slide atual
            getCurrentIndex: function() { return currentIndex; }
        };

        // ==========================================
        // INICIALIZAÇÃO DO BLUR-LAYER
        // ==========================================
        //
        // Na primeira vez que o carrossel é criado, já ativamos
        // o blur-layer com a imagem do primeiro slide.
        //
        if (blurLayer) {
            updateBlurLayer();
        }

        // ----- PASSO 10: INICIALIZAÇÃO -----
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
    // SEÇÃO 3: INICIALIZAR CARROSSEIS WRAPPED
    // ==========================================
    //
    // querySelectorAll retorna TODOS os elementos com a classe.
    // forEach itera sobre cada um, executando a função para cada.
    //
    const wrappedCarousels = document.querySelectorAll('.wrapped-carousel');
    wrappedCarousels.forEach(function(carousel, index) {
        // Se o carrossel não tiver ID, criamos um único para ele.
        // IDs devem ser únicos na página (regra do HTML).
        if (!carousel.id) {
            carousel.id = 'wrapped-carousel-' + index;
        }

        // Passamos o seletor '#' + id para initCarousel
        initCarousel('#' + carousel.id, {
            autoPlayInterval: 4000,
            transitionDuration: 500
        });
    });

    // ==========================================
    // SEÇÃO 4: CARDS DE EVENTOS PASSADOS
    // ==========================================
    //
    // Estrutura de cada card:
    //
    // <div class="event-card">                    ← card
    //   <div class="event-card-header">           ← cabeçalho clicável
    //     <h3 class="event-card-title">...</h3>
    //     <span class="event-card-year">...</span>
    //     <button class="event-card-toggle">...</button>
    //   </div>
    //   <div class="event-card-body">             ← conteúdo expansível
    //     <div class="event-card-carousel">       ← carrossel interno
    //       ...
    //     </div>
    //     <div class="event-card-content">        ← texto
    //       ...
    //     </div>
    //   </div>
    // </div>
    //

    const eventCards = document.querySelectorAll('.event-card');

    eventCards.forEach(function(card, index) {
        initEventCard(card, index);
    });

    function initEventCard(card, cardIndex) {
        // Seleciona elementos dentro DESTE card específico
        const header = card.querySelector('.event-card-header');
        const toggleBtn = card.querySelector('.event-card-toggle');
        const carousel = card.querySelector('.event-card-carousel');

        // ----- FUNÇÃO: Expandir/Colapsar -----
        //
        // classList.toggle('expanded') adiciona a classe se não existir,
        // ou remove se já existir. É um "liga/desliga".
        //
        function toggleCard() {
            const isExpanded = card.classList.contains('expanded');

            // Apenas um card fica aberto por vez:
            
            if (!isExpanded) {
                document.querySelectorAll('.event-card.expanded').forEach(function(otherCard) {
                    if (otherCard !== card) {
                        otherCard.classList.remove('expanded');
                        const otherCarousel = otherCard.querySelector('.event-card-carousel');
                        if (otherCarousel && otherCarousel._carouselAPI) {
                            otherCarousel._carouselAPI.stop();
                        }
                    }
                });
            }

            card.classList.toggle('expanded');

            // Se acabou de expandir, rola suavemente até o card
            if (!isExpanded) {
                setTimeout(function() {
                    card.scrollIntoView({ 
                        behavior: 'smooth',  // Animação suave
                        block: 'start'       // Alinha o topo do card com o topo da tela
                    });
                }, 100);
            }
        }

        // ----- EVENTO: Clique no header -----
        //
        // O parâmetro 'e' (event) contém informações sobre o clique.
        // e.target é o elemento EXATO que foi clicado.
        // e.target.closest('.classe') sobe na árvore DOM procurando
        // um ancestral com aquela classe. Retorna null se não achar.
        //
        header.addEventListener('click', function(e) {
            // Se clicou em uma seta ou indicador do carrossel,
            // NÃO expande/colapsa o card (só muda o slide).
            if (e.target.closest('.event-card-arrow') || 
                e.target.closest('.event-card-indicator')) {
                return; // Sai da função sem fazer nada
            }
            toggleCard();
        });

        // ----- EVENTO: Clique no botão de toggle -----
        //
        // stopPropagation() impede que o clique no botão "suba"
        // para o header, evitando que toggleCard seja chamado 2x.
        //
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleCard();
            });
        }

        // ----- INICIALIZAR CARROSSEL INTERNO -----
        //
        // Aqui está a MAGIA da reutilização: em vez de duplicar
        // toda a lógica de carrossel, chamamos initCarousel passando
        // o elemento do carrossel DIRETAMENTE (não um seletor string).
        //
        // Isso funciona porque initCarousel aceita tanto string
        // quanto Element como primeiro parâmetro.
        //
        if (carousel) {
            initCarousel(carousel, {
                autoPlayInterval: 4000,
                transitionDuration: 600,
                pauseOnHover: true,
                stopPropagation: true
            });
        }
    }

    // ==========================================
    // SEÇÃO 5: API GLOBAL DOS CARDS
    // ==========================================
    //
    // O QUE É window?
    //
    // window é o objeto global do navegador. Tudo que está em
    // window pode ser acessado de QUALQUER lugar do código,
    // inclusive do console do navegador (F12 → Console).
    //
    // Por que criar window.EventCards?
    //
    // 1. ACESSO GLOBAL: você pode digitar no console:
    //    EventCards.collapseAll() → fecha todos os cards
    //
    // 2. INTEGRAÇÃO COM OUTROS SCRIPTS: se no futuro você
    //    quiser adicionar um botão "Fechar todos os cards",
    //    pode chamar EventCards.collapseAll() de qualquer lugar.
    //
    // 3. TESTES: facilita testar a funcionalidade manualmente.
    //
    // É como criar um "controle remoto" público para os cards.
    //
    window.EventCards = {
        // Expande um card específico (passando o elemento DOM)
        expand: function(cardElement) {
            if (!cardElement.classList.contains('expanded')) {
                cardElement.classList.add('expanded');
                cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        // Colapsa um card específico
        collapse: function(cardElement) {
            if (cardElement.classList.contains('expanded')) {
                cardElement.classList.remove('expanded');
            }
        },

        // Colapsa TODOS os cards e para seus carrosséis
        collapseAll: function() {
            document.querySelectorAll('.event-card.expanded').forEach(function(card) {
                card.classList.remove('expanded');
                const carousel = card.querySelector('.event-card-carousel');
                if (carousel && carousel._carouselAPI) {
                    carousel._carouselAPI.stop();
                }
            });
        }
    };

    // ==========================================
    // SEÇÃO 6: NAVEGAÇÃO POR TECLADO
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
    // SEÇÃO 7: NAVBAR — DETECÇÃO DE SCROLL
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
    // SEÇÃO 8: HIGHLIGHT DO ITEM ATIVO DO MENU
    // ==========================================
    //
    // Verifica a URL atual e marca o item do menu correspondente
    // com a classe 'active', destacando visualmente a página atual.
    //

    // window.location.pathname = caminho da URL após o domínio
    // Ex: "/eventos/eureka.html"
    //
    // .split('/') divide em partes: ["", "eventos", "eureka.html"]
    // .pop() pega o último elemento: "eureka.html"
    // || 'index.html' → se estiver vazio (página raiz), usa index.html
    //
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');

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

            // Se for um link dentro de dropdown, também marca o pai
            if (link.classList.contains('dropdown-link')) {
                const dropdownParent = link.closest('.dropdown');
                if (dropdownParent) {
                    dropdownParent.classList.add('active');
                }
            }
        }
    });

    // ==========================================
    // SEÇÃO 9: CÍRCULOS DECORATIVOS — ROTAÇÃO NO SCROLL
    // ==========================================
    //
    // As .content-circles (definidas em main.css) são a "marca
    // d'água" de anéis concêntricos atrás do texto do <main>. Para
    // dar mais vida a elas, giramos os anéis conforme o usuário
    // rola a página — como se fossem órbitas de um átomo em
    // movimento, reforçando o tema científico da logo.
    //
    // Um detalhe importante: um círculo com anéis totalmente
    // sólidos é SIMÉTRICO, então girá-lo não muda nada visualmente
    // (todo ângulo parece igual ao anterior). Por isso, no CSS,
    // os anéis são "tracejados" via mask-image (repeating-conic-
    // -gradient) — isso quebra a simetria, e agora a rotação
    // realmente aparece.
    //
    // A ideia é simples: a cada evento de scroll, lemos quantos
    // pixels a página rolou (window.scrollY) e transformamos esse
    // valor em um ângulo de rotação. Como scrollY pode chegar a
    // milhares de pixels, multiplicamos por um fator bem pequeno
    // para que a rotação seja lenta e suave, não uma coisa girando
    // loucamente.
    //
    // Cada um dos dois círculos gira com uma velocidade e um
    // SENTIDO diferente (um multiplicador positivo, outro
    // negativo) — como duas órbitas independentes, em vez de
    // girarem sempre juntas e iguais. Isso dá uma sensação de
    // profundidade/paralaxe ao rolar a página.
    //
    const rotatingCircles = [
        { element: document.querySelector('.content-circles--top-right'), speed: 0.05 },
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
    // SEÇÃO 10: BOTÃO "VOLTAR PARA A PLANILHA"
    // ==========================================
    //
    // Só existe em programacao.html (o querySelector simplesmente
    // não encontra nada nas outras páginas, e o "if" abaixo faz
    // este bloco inteiro não fazer nada nesse caso — por isso dá
    // pra manter este código aqui no main.js compartilhado, sem
    // precisar de um arquivo .js separado só para esta página).
    //

    const backToTopButton = document.getElementById('back-to-top');

    if (backToTopButton) {
        // ----- MOSTRAR/ESCONDER CONFORME O SCROLL -----
        //
        // Mesmo padrão já usado na Seção 7 (sombra do navbar):
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

        // ----- CLIQUE: ROLAR SUAVEMENTE ATÉ A PLANILHA -----
        //
        // scrollIntoView com behavior: 'smooth' anima o scroll,
        // em vez de "pular" instantaneamente — mesma técnica já
        // usada para abrir os cards de eventos (initEventCard).
        //
        backToTopButton.addEventListener('click', function() {
            const planilha = document.getElementById('planilha');
            if (planilha) {
                planilha.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

});
