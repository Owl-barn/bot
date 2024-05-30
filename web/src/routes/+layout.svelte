<script lang="ts">
    import { PUBLIC_INVITE_URL, PUBLIC_PREMIUM_URL } from '$env/static/public';
    import Crown from 'components/art/Crown.svelte';

    let { children } = $props();
</script>
<nav>
    <div class="filler"></div>
    <a class="invite" target="_blank" href={PUBLIC_INVITE_URL}>invite</a>
    <a class="premium" target="_blank" href={PUBLIC_PREMIUM_URL}><Crown/></a>
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
        padding: 1rem;
    }

    a {
        color: currentColor;
        text-decoration: none;
    }

    .filler {
        flex: 1;
    
    }

    .invite {
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
