$(document).ready(function () {
    const TRANSITION_DURATION = 600;
    const ANIMATION_DELAY = 100;
    const SCROLL_DELAY = 600;
    
    const FLAGS = {
        IS_CACHED: true,
        NOT_CACHED: false,
        IS_404: true,
        NOT_404: false
    };

    function updateActiveLink(page) {
        $("[data-page]").removeClass("enabled");
        $(`[data-page='${page}']`).addClass("enabled");
    }

    function highlightElement(id) {
        $(".router-highlight").removeClass("router-highlight");
        if (id) {
            const $element = $(`#${id}`);
            $element.addClass("router-highlight");
            if ($element.length) {
                $('html, body').animate({
                    scrollTop: $element.offset().top - 100
                }, 800);
            }
        }
    }

    function renderContent(page, data, $transition, isCached, is404) { setTimeout(() => {
        $("#content").html(data);
        $(".with-popup").removeClass('active') // hides header menu

        if (!is404) {
            const currentHash = window.location.hash;
            history.pushState({ page }, "", `/${page}${currentHash}`);
        }
        window.scrollTo(0, 0);
        updateActiveLink(page);

        $(document).ready(() => {
            updateBodyClass(page);
            
            if (typeof AOS !== 'undefined') {
                AOS.init();
            }
            
            if (typeof initAnimations === 'function') {
                setTimeout(() => {
                    initAnimations();
                }, ANIMATION_DELAY);
            }
            
            if ($transition) {
                if (isCached) {
                    $transition.removeClass('slide-in').addClass('slide-fast-out');
                } else {
                    $transition.removeClass('slide-in').addClass('slide-out');
                }

                setTimeout(() => {
                    $transition.remove();
                }, TRANSITION_DURATION);
            }
        }); }, SCROLL_DELAY);
    }

    function updateBodyClass(page) {
        $("body").removeClass();
        
        if (page.includes('/')) {
            const classes = page.split('/');
            classes.forEach(cls => $("body").addClass(cls));
        } else if (contactFlag == true) {
            $(".contact").addClass('active');
            $("body").addClass("contact");
        } else {
            $("body").addClass(page);
        }
        
        const hash = window.location.hash;
        const id = hash ? hash.substring(1) : null;
        highlightElement(id);
    }

    const cache = {};

    function startTransition() {
        let $transition = $('.page-transition');
        if ($transition.length === 0) {
            $transition = $('<div class="page-transition"></div>');
            $('body').append($transition);
        }

        $transition.removeClass('slide-in slide-out');
        
        requestAnimationFrame(() => {
            $transition.addClass('slide-in');
        });

        return $transition;
    }

    function loadPage(page) {
        if (cache[page]) {
            const $transition = startTransition();
            renderContent(page, cache[page], $transition, FLAGS.IS_CACHED, FLAGS.NOT_404);
            return;
        }

        const $transition = startTransition();
        
        $.get(`/pages/${page}.html`, function (data) {
            cache[page] = data;
            renderContent(page, data, $transition, FLAGS.NOT_CACHED, FLAGS.NOT_404);
        }).fail(function () {
            $.get("/pages/404.html", function (data) {
                renderContent("404", data, $transition, FLAGS.NOT_CACHED, FLAGS.IS_404);
            });
        });
    }

    function handleClick(e) {
        e.preventDefault();
        const page = $(this).data("page");
        console.log("Router: Clicked on page:", page);
        loadPage(page);
    }

    $(document).on("click", "a[data-page]", handleClick);

    $(window).on("popstate", function (e) {
        if (e.originalEvent.state?.page) {
            loadPage(e.originalEvent.state.page);
        }
    });

    let path = window.location.pathname.slice(1);
    let contactFlag = false;
    if (path === "contact") {
        path = "home";
        contactFlag = true;
    }
    loadPage(path || "home");
});