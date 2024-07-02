<svg
    id="Layer_1"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1080 1080"
>
    <path
        class="cls-1 ring"
        d="M304.11,202.15l120.12-117.89h231.53l120.12,117.89V469.29h-84.87V237.77l-69.94-68.64h-162.15l-69.94,68.64v231.52h-84.87V202.15Z"
    />
    <path
        class="cls-1 body"
        d="M810.25,469.29c27.79,27.79,55.58,55.58,83.37,83.37v359.71l-83.37,83.37H269.75l-83.37-83.37v-359.71c27.79-27.79,55.58-55.58,83.37-83.37H810.25Z"
    />
    <polygon
        class="cls-1"
        points="573.78 728.27 607.56 694.11 573.78 635.59 506.22 635.59 472.44 694.11 506.22 728.27 506.22 829.43 573.78 829.43 573.78 728.27"
    />
</svg>

<style lang="scss">
    $size: clamp(8rem, 10vw, 10rem);
    $duration: 6s;
    $reach: 1rem;

    svg {
        width: $size;
        height: $size;
        transition: color 0.5s;

        animation: move $duration infinite alternate ease-in-out;
        filter: drop-shadow(5px 5px 12px rgba(0, 0, 0, 1));

        & > * {
            fill: none;
            stroke: currentColor;
            stroke-miterlimit: 10;
            stroke-width: 20px;
        }

        &:hover {
            color: var(--theme-accent);
            .ring {
                transform: rotate(20deg);
            }
        }
    }

    .ring {
        transform-origin: 732px 482px;
        transition: transform 0.5s;
        transform: rotate(0deg);
    }

    .body {
        fill: var(--theme-primary);
    }

    @media (prefers-reduced-motion: reduce) {
        svg {
            animation: none;
        }

        .ring {
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
</style>
