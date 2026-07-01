document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.protagonists-slider');

    if (!slider) {
        return;
    }

    const wrapper = slider.querySelector('.swiper-wrapper');
    const slides = Array.from(slider.querySelectorAll('.swiper-slide'));
    const nextButton = slider.querySelector('.swiper-button-next');
    const prevButton = slider.querySelector('.swiper-button-prev');

    if (!wrapper || slides.length === 0 || !nextButton || !prevButton) {
        return;
    }

    let activeIndex = 0;

    const getVisibleCount = () => {
        if (window.matchMedia('(min-width: 1024px)').matches) {
            return 3;
        }

        if (window.matchMedia('(min-width: 640px)').matches) {
            return 2;
        }

        return 1;
    };

    const renderCarousel = () => {
        const visibleCount = Math.min(getVisibleCount(), slides.length);
        wrapper.innerHTML = '';

        for (let offset = 0; offset < visibleCount; offset += 1) {
            const slideIndex = (activeIndex + offset) % slides.length;
            const slide = slides[slideIndex].cloneNode(true);
            slide.style.width = `${100 / visibleCount}%`;
            wrapper.appendChild(slide);
        }
    };

    const goToNextSlide = () => {
        activeIndex = (activeIndex + 1) % slides.length;
        renderCarousel();
    };

    const goToPrevSlide = () => {
        activeIndex = (activeIndex - 1 + slides.length) % slides.length;
        renderCarousel();
    };

    nextButton.addEventListener('click', goToNextSlide);
    prevButton.addEventListener('click', goToPrevSlide);
    window.addEventListener('resize', renderCarousel);

    renderCarousel();
});
