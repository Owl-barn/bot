<script lang="ts">
    import type { Stats } from "../structs/stats";
    import Owl from "./art/Owl.svelte";

    interface Props {
        stats: Stats;
    }

    let { stats }: Props = $props();
</script>

<header>
    <Owl />
    <h1>Hootsifer</h1>
    <p>A multi-purpose Discord bot</p>
    <p>Trusted by <var>{stats.memberCount}</var> members</p>
    <p>In <var>{stats.guildCount}</var> communities</p>
</header>

<style lang="scss">
    header {
        text-align: center;

        & h1 {
            font-weight: 400;
            font-size: 3rem;
            padding-top: 1.5rem;
        }

        & p {
            padding: 0;
            margin: 5px 0;
        }

        * var {
            color: var(--theme-accent);
            font-style: normal;
            font-weight: 600;
        }
    }
</style>
