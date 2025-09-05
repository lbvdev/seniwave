$(document).ready(function () {
    function updateActiveLink(page) {
        $("[data-page]").removeClass("enabled");
        $(`[data-page='${page}']`).addClass("enabled");
    }

    function renderContent(page, data, $transition, isCached) {
        $(".with-popup").removeClass('active')

        setTimeout(() => {
            $("#content").html(data);
            history.pushState({ page }, "", `/${page}`);
            window.scrollTo(0, 0);
            updateActiveLink(page);

            $(document).ready(() => {
                updateBodyClass(page);
                
                if (typeof AOS !== 'undefined') {
                    AOS.init();
                }
                
                if ($transition) {
                    if (isCached) {
                        $transition.removeClass('slide-in').addClass('slide-fast-out');
                    } else {
                        $transition.removeClass('slide-in').addClass('slide-out');
                    }

                    setTimeout(() => {
                        $transition.remove();
                    }, 600);
                }
            });
        }, 600);
    }

    function updateBodyClass(page) {
        $("body").removeClass();
        
        if (page.includes('/')) {
            const classes = page.split('/');
            classes.forEach(cls => $("body").addClass(cls));
        } else {
            $("body").addClass(page);
        }
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
            renderContent(page, cache[page], $transition, true);
            return;
        }

        const $transition = startTransition();
        
        $.get(`/pages/${page}.html`, function (data) {
            cache[page] = data;
            renderContent(page, data, $transition, false);
        }).fail(function () {
            $.get("/pages/404.html", function (data) {
                renderContent("404", data, $transition, false);
            });
        });
    }

    function handleClick(e) {
        e.preventDefault();
        const page = $(this).data("page");
        loadPage(page);
    }

    $("a[data-page]").click(handleClick);

    $(window).on("popstate", function (e) {
        if (e.originalEvent.state?.page) {
            loadPage(e.originalEvent.state.page);
        }
    });

    const path = window.location.pathname.slice(1);
    loadPage(path || "home");
});