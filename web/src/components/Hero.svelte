<script>
    import Owl from "./art/Owl.svelte";
</script>

<header>
    <Owl />
    <h1>Hootsifer</h1>
    <p>A multi-purpose Discord bot</p>
    <!-- <p>Trusted by <b>{props.status.memberCount}</b> members</p>
    <p>In <b>{props.status.guildCount}</b> communities</p> -->
</header>

<style lang="scss">
    header {
        text-align: center;

        & h1 {
            font-weight: 400;
            font-size: 3rem;
        }

        & p {
            padding: 0;
            margin: 5px 0;
        }

        * b {
            color: var(--theme-accent);
        }
    }
</style>
