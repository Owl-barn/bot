<script lang="ts">
    import { page } from "$app/stores";
    import { PUBLIC_INVITE_URL, PUBLIC_PREMIUM_URL } from "$env/static/public";
    import Crown from "components/art/Crown.svelte";

    let { children } = $props();
</script>

<nav>
    {#if $page.url.pathname === "/"}
        <a href="/docs">Docs</a>
    {:else}
        <a href="/">Home</a>
    {/if}

    <div class="filler"></div>
    <a target="_blank" href={PUBLIC_INVITE_URL}>invite</a>
    <a class="premium" target="_blank" href={PUBLIC_PREMIUM_URL}><Crown /></a>
</nav>
{@render children()}

<svelte:head>
    <meta name="theme-color" content="#bf8d50" />
    <title>Hootsifer bot</title>
</svelte:head>

<style lang="scss" global>
    @import "styles/global.scss";

    nav {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        padding: 0.7rem 2rem;

        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 10;

        background: linear-gradient(
            var(--theme-primary) 0%,
            var(--theme-primary) 30%,
            transparent 100%
        );
    }

    a {
        color: currentColor;
        text-decoration: none;
    }

    .filler {
        flex: 1;
    }

    a:not(.premium) {
        transition: color 0.3s;
        &:hover {
            color: var(--theme-accent-dark);
        }
    }

    .premium {
        $size: 3em;
        color: var(--theme-accent);

        :global(svg) {
            width: $size;
            height: $size;
        }
    }
</style>
