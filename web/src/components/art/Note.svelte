<script lang="ts">
    interface Props {
        size: number;
        delay: number;
    }

    let { size, delay }: Props = $props();
</script>

<svg
    style="animation-delay: -{delay}ms; --size: {size}rem;"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 360.28 377.05"
>
    <polygon
        points="353.74 5.8 355.27 283.07 322.42 323.49 268.48 331.74 225.06 302.98 217.58 254.06 250.43 213.64 304.36 205.39 325.57 217.42 325.57 56.71 143.6 87.04 142.97 323.15 110.12 363.57 56.19 371.82 12.76 343.06 5.28 294.14 38.13 253.71 92.06 245.47 115.44 259.66 115.17 41.54 353.74 5.8"
    />
</svg>

<style lang="scss">
    $reach: 1rem;

    svg {
        stroke: currentColor;
        overflow: visible;

        animation-name: move;
        animation-duration: 5s;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        animation-direction: alternate;

        width: clamp(0.4 * var(--size), 8vw, var(--size));
        height: clamp(0.4 * var(--size), 8vw, var(--size));

        // shadow
        filter: drop-shadow(5px 5px 12px rgba(0, 0, 0, 1));

        &:hover polygon {
            animation: shake 700ms;
            color: var(--theme-accent);
        }
    }

    polygon {
        fill: none;
        stroke: inherit;
        stroke-miterlimit: 10;
        stroke-width: 10px;

        transition: color 0.5s;
    }

    @media (prefers-reduced-motion: reduce) {
        svg {
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

    @keyframes shake {
        0%,
        100% {
            transform: rotate(0deg);
        }
        30% {
            transform: rotate(-2deg);
        }
        60% {
            transform: rotate(2deg);
        }
    }
</style>
