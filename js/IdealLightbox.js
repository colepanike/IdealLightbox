/*******************************************************************************
 *   Ideal Lightbox
 *  Created on : Apr 4, 2014
 *  Author     : Cole Panike & Toby Hayes
 ******************************************************************************/
(function ($) {
    $.fn.exists = function () { //Extra little plugin, helps with circular rotation
        return this.length !== 0;
    };
    $.fn.IdealLightbox = function (options) {

        var settings = $.extend({
            // Defaults
            animationSpeed: 330,
            animationStyle: "fade",
            thumbnailSeletor: ".lightbox-thumbnails a",
            adBox: false,
            navigation: true,
            playButton: false, /*Experimental, not fully functional*/
            rotateInterval: 5000
        }, options);

        // Inject our structure, either with or without the adBox
        var structure;
        if (settings.adBox)
            structure = "<div class='content'><div class='col'><span class='close'>&#10006;</span><div class='caption'></div><div class='image'><div class='inner'><img src=''/></div></div></div><div class='col'><div class='ad'><img src=''></div></div></div>";
        else
            structure = "<div class='content'><div class='full'><span class='close'>&#10006;</span><div class='caption'></div><div class='image'><div class='inner'><img src=''/></div></div></div></div>";
        this.html(structure);

        // Get our ducks in a line:
        var $lightbox = this;
        var $imgContainer = $lightbox.find(".image > .inner");
        var $img = $imgContainer.find("img");
        var $caption = $lightbox.find(".caption");
        var $adImg = settings.adBox ? $lightbox.find(".ad img") : null;
        var $rightNav = null;
        var $leftNav = null;
        var $playBtn = null;
        var timeout;
        var loadingImg = new Image().src = "../img/loading.gif";

        // Add the navigation buttons
        if (settings.navigation) {
            $lightbox.append("<div class='chevron-container left'><span class='chevron'>&lsaquo;</span></div>");
            $lightbox.append("<div class='chevron-container right'><span class='chevron'>&rsaquo;</span></div>");
            $rightNav = $lightbox.find(".chevron-container.right");
            $leftNav = $lightbox.find(".chevron-container.left");
        }

        // Add the Play Button
        if (settings.playButton) {
            $imgContainer.append("<div class='play'><span class='iPlay'></span><span class='iPause'></span></div>");
            $playBtn = $lightbox.find(".play");
        }

        // Display the lightbox based on the animation options
        function toggleLightbox() {
            if (settings.animationStyle === "fade")
                $lightbox.fadeToggle(settings.animationSpeed, function() { adjustImageHeight(); });
            else if (settings.animationStyle === "slide")
                $lightbox.fadeToggle(settings.animationSpeed, function() { adjustImageHeight(); });
            else
                throw settings.animationStyle + " is not a valid lightbox animation.";
        }

        function adjustImageHeight(){
            $imgContainer.parent(".image").outerHeight(($(window).height() - $caption.outerHeight()));
        }

        // Main function, changes the image and caption
        function changeImage(imgHref, imgCaption, directLink, adHref) {
            $img.attr("src", loadingImg.src);
            // Set the image source to the href value:
            $img.attr("src", imgHref);
            // Set the caption:
            if (typeof imgCaption !== "undefined")
                $caption.html(imgCaption);
            else
                $caption.html("&nbsp;");

            if (typeof directLink !== "undefined")
                location.hash = directLink;
            else
                location.hash = "";

            if (settings.adBox) {
                if (typeof adHref !== "undefined" && $adImg !== null) {
                    $adImg.attr('src', adHref);
                    $adImg.show();
                }
                else
                    $adImg.hide();
            }
        }

        /* Event handleing
        /------------------------------------------------------*/
        //Load with a valid location.hash
        $(function () {
            if (location.hash) {
                var givenHash = location.hash.substr(1);
                $(settings.thumbnailSeletor).each(function (i) {
                    if (givenHash === $(this).attr("data-directLink")) {
                        changeImage($(this).attr('href'), $(this).attr('data-caption'), $(this).attr('data-directLink'), $(this).attr('data-ad-dt'));
                        toggleLightbox();
                    }
                });
            }
        });

        // Thumnail click:
        $(settings.thumbnailSeletor).click(function (e) {
            // Stop the link click:
            e.preventDefault();
            clearSelection();

            // Get the image from the href and the caption from the data-caption attribute
            changeImage($(this).attr('href'), $(this).attr('data-caption'), $(this).attr('data-directLink'), $(this).attr('data-ad-dt'));

            //Show the lightbox
            toggleLightbox();
        });

        // Navigation click:
        function rotateImage(direction) {
            var $curImg = $(settings.thumbnailSeletor).filter(settings.thumbnailSeletor + "[href='" + $img.attr('src') + "']");
            var $showImg;
            if (direction === "right" || typeof direction === "undefined") {
                $showImg = $curImg.parent().next().find("a");
                if (!$showImg.exists())
                    $showImg = $(settings.thumbnailSeletor).first();
            }
            else {
                $showImg = $($curImg).parent().prev().find("a");
                if (!$showImg.exists())
                    $showImg = $(settings.thumbnailSeletor).last();
            }
            changeImage($showImg.attr('href'), $showImg.attr('data-caption'), $showImg.attr('data-directLink'), $showImg.attr('data-ad-dt'));
            adjustImageHeight();
        }
        if (settings.navigation) {
            $rightNav.click(function () {
                rotateImage("right");
                clearSelection();
            });
            $leftNav.click(function () {
                rotateImage("left");
                clearSelection();
            });
        }

        // Play Button
        // (not fully-functional yet)
        if (settings.playButton) {
            var playState = 1;
            function autoRotate() {
                timeout = setTimeout(function () {
                    rotateImage();
                    clearTimeout(timeout);
                    autoRotate();
                }, settings.rotateInterval);
            }
            $playBtn.click(function () {
                clearSelection();
                // Switch stop and play
                if (playState === 1) {
                    $playBtn.html("<span style='font-size: 60px !important; bottom: .8em; left: .8em'>&#9632;</span>");
                    playState = 0;
                    // Start the rotation
                    autoRotate();
                }
                else {
                    $playBtn.html("<span>&#9658;</span>");
                    clearTimeout(timeout);
                    playState = 1;
                }
            });
        }

        //Close options ( click/tap X or hit ESC key )
        this.find('.close').click(function () {
            clearTimeout(timeout);
            clearSelection();
            toggleLightbox();
            location.hash = "";
        });
        $(document).on('keydown', function (e) {
            if (e.keyCode === 27 && $lightbox.is(":visible")) { // ESC
                toggleLightbox();
                location.hash = "";
            }
            else if (e.keyCode === 37 && $lightbox.is(":visible")) { //LEFT ARROW
                rotateImage("left");
            }
            else if (e.keyCode === 39 && $lightbox.is(":visible")) { //RIGHT ARROW
                rotateImage("right");
            }
        });

        //Misc:
        //This clears the users select when they click to fast.
        function clearSelection() {
            if (document.selection && document.selection.empty) {
                document.selection.empty();
            } else if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }
        }

        return this;
    }
}(jQuery));