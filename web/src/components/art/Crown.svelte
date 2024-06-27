<svg
    id="Layer_2"
    data-name="Layer 2"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 338 169.81"
>
    <defs>
        <style>
            .cls-1 {
                fill: none;
                stroke: currentColor;
                stroke-miterlimit: 10;
                stroke-width: 12px;
            }
        </style>
    </defs>
    <polygon
        class="cls-1 first"
        points="72 8.81 32 66.81 69 144.81 112 66.81 72 8.81"
    />
    <polygon
        class="cls-1"
        points="172 8.81 132 66.81 169 144.81 212 66.81 172 8.81"
    />
    <polygon
        class="cls-1"
        points="272 8.81 232 66.81 269 144.81 312 66.81 272 8.81"
    />
    <polyline
        class="cls-1"
        points="312 66.81 333 66.81 333 164.81 5 164.81 5 66.81 32 66.81"
    />
</svg>

<style lang="scss">
    svg {
        filter: drop-shadow(
            0 0 12px color-mix(in srgb, currentColor 50%, transparent)
        );

        transition: filter 0.3s;

        transition: color 0.3s;
    }

    svg:hover {
        color: var(--theme-accent-dark);
    }

    $duration: 3s;
    polygon {
        animation: fade $duration infinite alternate ease-in-out;

        &:nth-of-type(2) {
            animation-delay: calc($duration / 3);
        }

        &:nth-of-type(3) {
            animation-delay: calc($duration / 3 * 2);
        }
    }

    @keyframes fade {
        0% {
            fill: transparent;
        }

        100% {
            fill: currentColor;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        polygon {
            animation: none;
        }
    }
</style>
