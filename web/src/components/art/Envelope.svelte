<svg
    id="Layer_4"
    data-name="Layer 4"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1000 1000"
>
    <rect class="cls-1" x="79" y="348" width="842" height="429.55" />
    <polyline class="cls-1 lid" points="921 348 502.14 576.66 79 348" />
    <polygon
        class="cls-1 gem"
        points="416.57 531.58 500 463.4 506.46 468.74 582.59 531.58 497.86 726.26 416.57 531.58"
    />
</svg>

<style lang="scss">
    $size: clamp(8rem, 10vw, 10rem);
    $duration: 6s;
    $reach: 1rem;

    svg {
        width: $size;
        height: $size;

        animation: move $duration infinite alternate ease-in-out;
        filter: drop-shadow(5px 5px 12px rgba(0, 0, 0, 1));

        & > * {
            fill: none;
            stroke: currentColor;
            stroke-miterlimit: 10;
            stroke-width: 20px;
        }

        &:hover .gem {
            animation: shake 700ms;
            color: var(--theme-accent);
        }
    }

    .gem {
        transition: color 0.5s;
        transform-origin: center;
    }

    .lid {
        // animation: open $duration infinite alternate ease-in-out;
        // transform-origin: 300px 350px;
    }

    @media (prefers-reduced-motion: reduce) {
        svg {
            animation: none;
        }

        .lid {
            animation: none;
        }
    }

    @keyframes move {
        0% {
            transform: translateY($reach);
        }

        100% {
            transform: translateY(-$reach);
        }
    }

    @keyframes open {
        0%,
        30% {
            transform: scaleY(1);
        }
        100% {
            transform: scaleY(0.35);
        }
    }

    @keyframes shake {
        0%,
        100% {
            transform: rotate(0deg);
        }
        20% {
            transform: rotate(-10deg);
        }
        35% {
            transform: rotate(15deg);
        }
        50% {
            transform: rotate(-10deg);
        }
    }
</style>
