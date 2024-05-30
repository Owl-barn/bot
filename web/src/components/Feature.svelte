<script lang="ts">
    import type { Snippet } from "svelte";
    import Arrow from "./art/Arrow.svelte";

    interface Props {
        title: string;
        children: Snippet;
        artwork: Snippet;
        moduleId?: string;
        premium?: boolean;
    }

    let {
        title,
        children,
        artwork,
        moduleId,
        premium = false,
    }: Props = $props();
</script>

<article>
    <section class="artwork">
        {@render artwork()}
    </section>
    <section class="info">
        <h1 class:premium>{title}</h1>
        <p>
            {@render children()}
        </p>
        {#if moduleId}
            <a href="/docs/#{moduleId}" class="moreInfo">
                More info <Arrow />
            </a>
        {/if}
    </section>
</article>

<style lang="scss">
    $scale: 4vw;

    .premium::after {
        content: "*";
        font-size: 1.1em;
        color: var(--theme-accent);
    }

    article {
        display: flex;
        gap: clamp(2rem, $scale, 3rem);

        &:nth-child(even) {
            flex-direction: row-reverse;
        }

        & .info {
            flex: 2;
        }

        & h1 {
            font-size: clamp(1.2rem, $scale, 2rem);
        }

        & p {
            font-size: clamp(0.5rem, $scale, 1.1rem);
        }

        & > .artwork {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 0.5rem;
        }
    }

    .moreInfo {
        font-size: 0.8em;
        color: var(--theme-accent);
        display: inline-flex;
        align-items: center;
        gap: 0.3em;
        padding-block: 1em;
        font-size: 1rem;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
            color: var(--theme-accent-dark);
            :global(svg) {
                transform: translateX(0.3em);
            }
        }
    }
</style>
