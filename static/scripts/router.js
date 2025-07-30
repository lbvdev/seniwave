$(document).ready(function () {
    function updateBodyClass(page) {
        $("body").removeClass("home team blog contact works 404").addClass(page);
    }

    function updateActiveLink(page) {
        $("[data-page]").removeClass("enabled");
        $(`[data-page='${page}']`).addClass("enabled");
    }

    function renderContent(page, data) {
        $("#content").html(data);
        history.pushState({ page }, "", `/${page}`);
        window.scrollTo(0, 0);
        updateActiveLink(page);
        updateBodyClass(page);
    }

    const cache = {};

    function loadPage(page) {
        if (cache[page]) {
            renderContent(page, cache[page]);
            return;
        }
        $.get(`pages/${page}.html`, function (data) {
            cache[page] = data;
            renderContent(page, data);
        }).fail(function () {
            $.get("pages/404.html", function (data) {
                renderContent("404", data);
            });
        });
    }

    function handleClick(e) {
        e.preventDefault();
        const page = $(this).data("page");
        loadPage(page);
        if (page !== "works") updateBodyClass(page);
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